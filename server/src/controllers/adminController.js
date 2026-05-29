import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { ADMIN_EMAIL } from '../config/env.js'
import { ContactMessage } from '../models/ContactMessage.js'
import { Order } from '../models/Order.js'
import { Product } from '../models/Product.js'
import { User } from '../models/User.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { httpError } from '../utils/httpError.js'

const ORDER_STATUS_LABELS = {
  confirmed: 'Đã xác nhận',
  paid: 'Đã thanh toán',
  shipping: 'Đang giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
}
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PRODUCT_UPLOAD_DIR = path.resolve(__dirname, '../../uploads/products')
const IMAGE_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

function serializeOrder(order) {
  return {
    id: order.orderCode,
    customer: order.customer,
    items: order.items,
    payment: order.payment,
    status: order.status,
    statusLabel: ORDER_STATUS_LABELS[order.status] || order.status,
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total,
    createdAt: order.createdAt,
  }
}

function serializeContact(contact) {
  return {
    id: contact._id.toString(),
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    topic: contact.topic,
    message: contact.message,
    status: contact.status,
    createdAt: contact.createdAt,
  }
}

function serializeProduct(product) {
  return {
    id: product.legacyId,
    name: product.name,
    category: product.category,
    price: product.price,
    rating: product.rating,
    stock: product.stock,
    image: product.image,
    description: product.description,
    createdAt: product.createdAt,
  }
}

function serializeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    address: user.address || '',
    role: user.role || 'customer',
    createdAt: user.createdAt,
  }
}

export const getAdminSummary = asyncHandler(async (_req, res) => {
  const [
    orderStats,
    statusStats,
    monthlyRevenue,
    topProducts,
    contactStats,
    productCount,
    userCount,
    adminCount,
    lowStockProducts,
    newContactCount,
    recentOrders,
    recentContacts,
  ] = await Promise.all([
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, revenue: { $sum: '$total' }, orderCount: { $sum: 1 }, averageOrder: { $avg: '$total' } } },
    ]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$total' } } }]),
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $limit: 6 },
    ]),
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]),
    ContactMessage.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Product.countDocuments(),
    User.countDocuments(),
    User.countDocuments({ role: 'admin' }),
    Product.find({ stock: { $lte: 10 } }).sort({ stock: 1 }).limit(8),
    ContactMessage.countDocuments({ status: 'new' }),
    Order.find().sort({ createdAt: -1 }).limit(5),
    ContactMessage.find().sort({ createdAt: -1 }).limit(5),
  ])

  const pendingOrderCount = statusStats
    .filter((item) => ['confirmed', 'paid', 'shipping'].includes(item._id))
    .reduce((sum, item) => sum + item.count, 0)

  res.json({
    summary: {
      revenue: orderStats[0]?.revenue || 0,
      orderCount: orderStats[0]?.orderCount || 0,
      averageOrder: Math.round(orderStats[0]?.averageOrder || 0),
      pendingOrderCount,
      productCount,
      userCount,
      adminCount,
      lowStockCount: lowStockProducts.length,
      newContactCount,
      statusStats: statusStats.map((item) => ({
        status: item._id,
        label: ORDER_STATUS_LABELS[item._id] || item._id,
        count: item.count,
        total: item.total,
      })),
      contactStats: contactStats.map((item) => ({ status: item._id, count: item.count })),
    },
    monthlyRevenue: monthlyRevenue.reverse().map((item) => ({ month: item._id, revenue: item.revenue, count: item.count })),
    topProducts: topProducts.map((item) => ({
      productId: item._id,
      name: item.name,
      quantity: item.quantity,
      revenue: item.revenue,
    })),
    lowStockProducts: lowStockProducts.map(serializeProduct),
    recentOrders: recentOrders.map(serializeOrder),
    recentContacts: recentContacts.map(serializeContact),
  })
})

export const listAdminOrders = asyncHandler(async (_req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 })
  res.json({ orders: orders.map(serializeOrder) })
})

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  if (!Object.keys(ORDER_STATUS_LABELS).includes(status)) {
    throw httpError(400, 'Trạng thái đơn hàng không hợp lệ.')
  }

  const order = await Order.findOneAndUpdate(
    { orderCode: req.params.orderCode },
    { $set: { status } },
    { new: true },
  )

  if (!order) {
    throw httpError(404, 'Không tìm thấy đơn hàng.')
  }

  res.json({
    message: 'Đã cập nhật trạng thái đơn hàng.',
    order: serializeOrder(order),
  })
})

export const listAdminContacts = asyncHandler(async (_req, res) => {
  const contacts = await ContactMessage.find().sort({ createdAt: -1 })
  res.json({ contacts: contacts.map(serializeContact) })
})

export const updateContactStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  if (!['new', 'processing', 'done'].includes(status)) {
    throw httpError(400, 'Trạng thái liên hệ không hợp lệ.')
  }

  const contact = await ContactMessage.findByIdAndUpdate(req.params.contactId, { $set: { status } }, { new: true })

  if (!contact) {
    throw httpError(404, 'Không tìm thấy liên hệ.')
  }

  res.json({
    message: 'Đã cập nhật trạng thái liên hệ.',
    contact: serializeContact(contact),
  })
})

export const listAdminUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 })
  res.json({ users: users.map(serializeUser) })
})

export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body
  if (!['customer', 'admin'].includes(role)) {
    throw httpError(400, 'Quyền người dùng không hợp lệ.')
  }

  const user = await User.findById(req.params.userId)
  if (!user) {
    throw httpError(404, 'Không tìm thấy người dùng.')
  }

  if (user.email === ADMIN_EMAIL && role !== 'admin') {
    throw httpError(400, 'Tài khoản admin cấu hình trong env không thể hạ quyền.')
  }

  if (user._id.toString() === req.user._id.toString() && role !== 'admin') {
    throw httpError(400, 'Bạn không thể tự hạ quyền tài khoản đang đăng nhập.')
  }

  user.role = role
  await user.save()

  res.json({
    message: 'Đã cập nhật quyền người dùng.',
    user: serializeUser(user),
  })
})

export const listAdminProducts = asyncHandler(async (_req, res) => {
  const products = await Product.find().sort({ legacyId: 1 })
  res.json({ products: products.map(serializeProduct) })
})

function readProductPayload(body, isCreate = false) {
  const payload = {}
  const requiredFields = ['name', 'category', 'price', 'stock', 'image', 'description']

  requiredFields.forEach((field) => {
    if (body[field] !== undefined) {
      payload[field] = typeof body[field] === 'string' ? body[field].trim() : body[field]
    }
  })

  if (body.price !== undefined) payload.price = Number(body.price)
  if (body.stock !== undefined) payload.stock = Number(body.stock)
  if (body.rating !== undefined) payload.rating = Number(body.rating)

  if (isCreate && requiredFields.some((field) => payload[field] === undefined || payload[field] === '')) {
    throw httpError(400, 'Vui lòng nhập đầy đủ thông tin sản phẩm.')
  }

  if (payload.price !== undefined && (!Number.isFinite(payload.price) || payload.price < 0)) {
    throw httpError(400, 'Giá sản phẩm không hợp lệ.')
  }

  if (payload.stock !== undefined && (!Number.isInteger(payload.stock) || payload.stock < 0)) {
    throw httpError(400, 'Tồn kho không hợp lệ.')
  }

  if (payload.rating !== undefined && (payload.rating < 0 || payload.rating > 5)) {
    throw httpError(400, 'Điểm đánh giá phải từ 0 đến 5.')
  }

  return payload
}

export const createAdminProduct = asyncHandler(async (req, res) => {
  const payload = readProductPayload(req.body, true)
  const lastProduct = await Product.findOne().sort({ legacyId: -1 })
  const product = await Product.create({
    ...payload,
    legacyId: (lastProduct?.legacyId || 0) + 1,
    rating: payload.rating ?? 0,
  })

  res.status(201).json({
    message: 'Đã thêm sản phẩm mới.',
    product: serializeProduct(product),
  })
})

export const updateAdminProduct = asyncHandler(async (req, res) => {
  const payload = readProductPayload(req.body)
  const product = await Product.findOneAndUpdate(
    { legacyId: Number(req.params.productId) },
    { $set: payload },
    { new: true, runValidators: true },
  )

  if (!product) {
    throw httpError(404, 'Không tìm thấy sản phẩm.')
  }

  res.json({
    message: 'Đã cập nhật sản phẩm.',
    product: serializeProduct(product),
  })
})

export const deleteAdminProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndDelete({ legacyId: Number(req.params.productId) })
  if (!product) {
    throw httpError(404, 'Không tìm thấy sản phẩm.')
  }

  res.json({
    message: 'Đã xóa sản phẩm.',
    product: serializeProduct(product),
  })
})

export const uploadProductImage = asyncHandler(async (req, res) => {
  const { dataUrl, fileName = '', mimeType } = req.body
  const imageMimeType = mimeType || String(dataUrl || '').match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/)?.[1]
  const extension = IMAGE_TYPES[imageMimeType]

  if (!extension || !dataUrl) {
    throw httpError(400, 'Ảnh sản phẩm phải là JPG, PNG, WEBP hoặc GIF.')
  }

  const base64 = String(dataUrl).replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '')
  const buffer = Buffer.from(base64, 'base64')

  if (buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES) {
    throw httpError(400, 'Ảnh sản phẩm phải nhỏ hơn 5MB.')
  }

  await fs.mkdir(PRODUCT_UPLOAD_DIR, { recursive: true })

  const safeName = path
    .basename(fileName, path.extname(fileName))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  const storedFileName = `${safeName || 'product'}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${extension}`
  const storedPath = path.join(PRODUCT_UPLOAD_DIR, storedFileName)

  await fs.writeFile(storedPath, buffer)

  res.status(201).json({
    message: 'Đã upload ảnh sản phẩm.',
    url: `/uploads/products/${storedFileName}`,
  })
})
