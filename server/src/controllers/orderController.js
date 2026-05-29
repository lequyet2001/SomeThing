import { Cart } from '../models/Cart.js'
import { Order } from '../models/Order.js'
import { Product } from '../models/Product.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { httpError } from '../utils/httpError.js'

function createOrderCode() {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(100 + Math.random() * 900)
  return `MS${timestamp}${random}`
}

async function buildOrderItems(items) {
  const requestedItems = Array.isArray(items) ? items : []
  const normalizedItems = requestedItems
    .map((item) => ({
      productId: Number(item.productId),
      quantity: Number(item.quantity || 1),
    }))
    .filter((item) => item.productId && item.quantity > 0)

  if (normalizedItems.length === 0) {
    throw httpError(400, 'Đơn hàng cần có ít nhất một sản phẩm.')
  }

  const products = await Product.find({ legacyId: { $in: normalizedItems.map((item) => item.productId) } })
  const productById = new Map(products.map((product) => [product.legacyId, product]))

  return normalizedItems.map((item) => {
    const product = productById.get(item.productId)
    if (!product) {
      throw httpError(404, `Không tìm thấy sản phẩm ${item.productId}.`)
    }

    return {
      productId: item.productId,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      image: product.image,
    }
  })
}

function serializeOrder(order) {
  return {
    id: order.orderCode,
    customer: order.customer,
    items: order.items,
    payment: order.payment,
    status: order.status,
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total,
    createdAt: order.createdAt,
  }
}

export const createOrder = asyncHandler(async (req, res) => {
  const customer = {
    name: String(req.body.customer?.name || req.body.name || '').trim(),
    email: String(req.body.customer?.email || req.body.email || '').trim().toLowerCase(),
    phone: String(req.body.customer?.phone || req.body.phone || '').trim(),
    address: String(req.body.customer?.address || req.body.address || '').trim(),
  }
  const payment = String(req.body.payment || '').trim()

  if (!customer.name || !customer.email || !customer.address || !payment) {
    throw httpError(400, 'Vui lòng nhập đầy đủ thông tin giao hàng và thanh toán.')
  }

  const items = await buildOrderItems(req.body.items)
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = subtotal > 1200000 || subtotal === 0 ? 0 : 35000
  const order = await Order.create({
    orderCode: createOrderCode(),
    user: req.user?._id,
    customer,
    items,
    payment,
    subtotal,
    shipping,
    total: subtotal + shipping,
  })

  if (req.user) {
    await Cart.updateOne({ user: req.user._id }, { $set: { items: [] } })
  }

  res.status(201).json({
    message: 'Đặt hàng thành công.',
    order: serializeOrder(order),
  })
})

export const listMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 })
  res.json({ orders: orders.map(serializeOrder) })
})

export const getOrderByCode = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderCode: req.params.orderCode })
  if (!order) {
    throw httpError(404, 'Không tìm thấy đơn hàng.')
  }

  if (order.user && req.user && order.user.toString() !== req.user._id.toString()) {
    throw httpError(403, 'Bạn không có quyền xem đơn hàng này.')
  }

  res.json({ order: serializeOrder(order) })
})
