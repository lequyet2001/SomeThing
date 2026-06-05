import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { ADMIN_EMAIL } from '../config/env.js'
import { ContactMessage } from '../models/ContactMessage.js'
import { Order } from '../models/Order.js'
import { Product } from '../models/Product.js'
import { Review } from '../models/Review.js'
import { User } from '../models/User.js'
import { createUserNotification, emitAdminEvent } from './notificationController.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { httpError } from '../utils/httpError.js'

const ORDER_STATUS_LABELS = {
  confirmed: 'Đã xác nhận',
  paid: 'Đã thanh toán',
  shipping: 'Đang giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
}
const CONTACT_STATUS_LABELS = {
  new: 'Mới',
  processing: 'Đang xử lý',
  done: 'Đã xong',
}
const REVENUE_ORDER_STATUSES = ['paid', 'completed']
const PENDING_ORDER_STATUSES = ['confirmed', 'paid', 'shipping']
const PENDING_CONTACT_STATUSES = ['new', 'processing']
const DASHBOARD_TIMEZONE_OFFSET = '+07:00'
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

function serializeAdminReview(review, product) {
  return {
    id: review._id.toString(),
    productId: review.productId,
    productName: product?.name || `#${review.productId}`,
    productImage: product?.image || '',
    name: review.name,
    userEmail: review.user?.email || '',
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
  }
}

function serializeUser(user) {
  const shippingAddresses = Array.isArray(user.shippingAddresses) && user.shippingAddresses.length > 0
    ? user.shippingAddresses
    : user.address
      ? [{ id: 'legacy-address', label: 'Mặc định', recipient: user.name, phone: user.phone || '', address: user.address }]
      : []
  const selectedAddress = shippingAddresses.find((item) => item.id === user.selectedAddressId) || shippingAddresses[0] || null

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    avatar: user.avatar || '',
    phone: user.phone || '',
    address: selectedAddress?.address || user.address || '',
    shippingAddresses,
    selectedAddressId: selectedAddress?.id || '',
    role: user.role || 'customer',
    createdAt: user.createdAt,
  }
}

function normalizeSummaryMonth(value) {
  const rawMonth = String(value || '').trim()
  if (!rawMonth) return ''

  const currentYear = new Date().getFullYear()
  const monthOnlyMatch = rawMonth.match(/^(\d{1,2})$/)
  if (monthOnlyMatch) {
    return `${currentYear}-${String(Number(monthOnlyMatch[1])).padStart(2, '0')}`
  }

  const yearMonthMatch = rawMonth.match(/^(\d{4})-(\d{1,2})$/)
  if (yearMonthMatch) {
    return `${yearMonthMatch[1]}-${String(Number(yearMonthMatch[2])).padStart(2, '0')}`
  }

  return rawMonth
}

function createLocalDate(dateValue, time = '00:00:00.000') {
  return new Date(`${dateValue}T${time}${DASHBOARD_TIMEZONE_OFFSET}`)
}

function createDateMatch(field, dateRange) {
  return dateRange ? { [field]: dateRange } : {}
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function readPositiveInteger(value, fallback, maxValue) {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.min(parsed, maxValue)
}

function readPagination(query, defaultLimit = 20) {
  return {
    limit: readPositiveInteger(query.limit, defaultLimit, 100),
    page: readPositiveInteger(query.page, 1, 100000),
    shouldPaginate: query.page !== undefined || query.limit !== undefined,
  }
}

function createPagination(total, pagination) {
  const totalPages = pagination.shouldPaginate ? Math.max(1, Math.ceil(total / pagination.limit)) : 1

  return {
    hasMore: pagination.shouldPaginate ? pagination.page < totalPages : false,
    limit: pagination.shouldPaginate ? pagination.limit : total,
    page: pagination.shouldPaginate ? pagination.page : 1,
    total,
    totalPages,
  }
}

function applyPagination(query, pagination) {
  if (!pagination.shouldPaginate) return query
  return query.skip((pagination.page - 1) * pagination.limit).limit(pagination.limit)
}

function readDateRangeFilter(query) {
  const startDate = String(query.startDate || '').trim()
  const endDate = String(query.endDate || '').trim()
  const dateRange = {}

  if (startDate) {
    const start = createLocalDate(startDate)
    if (Number.isNaN(start.getTime())) {
      throw httpError(400, 'Ngày bắt đầu không hợp lệ.')
    }
    dateRange.$gte = start
  }

  if (endDate) {
    const end = createLocalDate(endDate)
    if (Number.isNaN(end.getTime())) {
      throw httpError(400, 'Ngày kết thúc không hợp lệ.')
    }
    end.setUTCDate(end.getUTCDate() + 1)
    dateRange.$lt = end
  }

  if (dateRange.$gte && dateRange.$lt && dateRange.$gte >= dateRange.$lt) {
    throw httpError(400, 'Khoảng thời gian không hợp lệ.')
  }

  return Object.keys(dateRange).length ? dateRange : null
}

function readSummaryPeriod(query) {
  const month = normalizeSummaryMonth(query.month)
  const startDate = String(query.startDate || '').trim()
  const endDate = String(query.endDate || '').trim()

  if (month) {
    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw httpError(400, 'Tháng thống kê không hợp lệ.')
    }

    const [year, monthIndex] = month.split('-').map(Number)
    if (monthIndex < 1 || monthIndex > 12) {
      throw httpError(400, 'Tháng thống kê không hợp lệ.')
    }

    const start = createLocalDate(`${year}-${String(monthIndex).padStart(2, '0')}-01`)
    const nextMonthYear = monthIndex === 12 ? year + 1 : year
    const nextMonthIndex = monthIndex === 12 ? 1 : monthIndex + 1
    const end = createLocalDate(`${nextMonthYear}-${String(nextMonthIndex).padStart(2, '0')}-01`)

    return {
      label: month,
      dateRange: { $gte: start, $lt: end },
    }
  }

  const dateRange = {}
  if (startDate) {
    const start = createLocalDate(startDate)
    if (Number.isNaN(start.getTime())) {
      throw httpError(400, 'Ngày bắt đầu thống kê không hợp lệ.')
    }
    dateRange.$gte = start
  }

  if (endDate) {
    const end = createLocalDate(endDate)
    if (Number.isNaN(end.getTime())) {
      throw httpError(400, 'Ngày kết thúc thống kê không hợp lệ.')
    }
    end.setUTCDate(end.getUTCDate() + 1)
    dateRange.$lt = end
  }

  if (dateRange.$gte && dateRange.$lt && dateRange.$gte >= dateRange.$lt) {
    throw httpError(400, 'Khoảng thời gian thống kê không hợp lệ.')
  }

  return {
    label: startDate || endDate ? `${startDate || '...'} - ${endDate || '...'}` : 'all',
    dateRange: Object.keys(dateRange).length ? dateRange : null,
  }
}

function mapProductSales(products, salesByProduct) {
  const saleMap = new Map(salesByProduct.map((item) => [Number(item._id), item]))

  return products.map((product) => {
    const sale = saleMap.get(product.legacyId)
    return {
      productId: product.legacyId,
      name: product.name,
      quantity: sale?.quantity || 0,
      revenue: sale?.revenue || 0,
    }
  })
}

function serializeCustomerStat(customer, user) {
  return {
    id: customer.email,
    userId: user?._id?.toString() || '',
    name: user?.name || customer.name || customer.email,
    email: customer.email,
    avatar: user?.avatar || '',
    phone: user?.phone || customer.phone || '',
    address: user?.address || customer.address || '',
    role: user?.role || 'guest',
    orderCount: customer.orderCount || 0,
    itemCount: customer.itemCount || 0,
    totalSpent: customer.totalSpent || 0,
    latestOrderAt: customer.latestOrderAt,
    registeredAt: user?.createdAt || null,
  }
}

export const getAdminSummary = asyncHandler(async (req, res) => {
  const period = readSummaryPeriod(req.query)
  const orderCreatedAtMatch = createDateMatch('createdAt', period.dateRange)
  const contactCreatedAtMatch = createDateMatch('createdAt', period.dateRange)
  const revenueOrderMatch = { status: { $in: REVENUE_ORDER_STATUSES }, ...createDateMatch('updatedAt', period.dateRange) }

  const [
    revenueStats,
    orderCount,
    statusStats,
    monthlyRevenue,
    salesByProduct,
    topCustomers,
    contactStats,
    productCount,
    userCount,
    adminCount,
    productsForSales,
    lowStockProducts,
    newContactCount,
    recentOrders,
    recentContacts,
  ] = await Promise.all([
    Order.aggregate([
      { $match: revenueOrderMatch },
      { $group: { _id: null, revenue: { $sum: '$total' }, orderCount: { $sum: 1 }, averageOrder: { $avg: '$total' } } },
    ]),
    Order.countDocuments(orderCreatedAtMatch),
    Order.aggregate([{ $match: orderCreatedAtMatch }, { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$total' } } }]),
    Order.aggregate([
      { $match: revenueOrderMatch },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$updatedAt', timezone: DASHBOARD_TIMEZONE_OFFSET } }, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      ...(period.dateRange ? [] : [{ $limit: 6 }]),
    ]),
    Order.aggregate([
      { $match: revenueOrderMatch },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { quantity: -1, revenue: -1 } },
    ]),
    Order.aggregate([
      { $match: revenueOrderMatch },
      {
        $project: {
          customer: 1,
          total: 1,
          itemCount: { $sum: '$items.quantity' },
        },
      },
      {
        $group: {
          _id: '$customer.email',
          name: { $first: '$customer.name' },
          email: { $first: '$customer.email' },
          phone: { $first: '$customer.phone' },
          orderCount: { $sum: 1 },
          itemCount: { $sum: '$itemCount' },
          totalSpent: { $sum: '$total' },
        },
      },
      { $sort: { totalSpent: -1, orderCount: -1 } },
      { $limit: 5 },
    ]),
    ContactMessage.aggregate([{ $match: contactCreatedAtMatch }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Product.countDocuments(),
    User.countDocuments(),
    User.countDocuments({ role: 'admin' }),
    Product.find().sort({ name: 1 }),
    Product.find({ stock: { $lte: 10 } }).sort({ stock: 1 }).limit(8),
    ContactMessage.countDocuments({ status: 'new', ...contactCreatedAtMatch }),
    Order.find(orderCreatedAtMatch).sort({ createdAt: -1 }).limit(5),
    ContactMessage.find(contactCreatedAtMatch).sort({ createdAt: -1 }).limit(5),
  ])

  const pendingOrderCount = statusStats
    .filter((item) => PENDING_ORDER_STATUSES.includes(item._id))
    .reduce((sum, item) => sum + item.count, 0)

  res.json({
    summary: {
      revenue: revenueStats[0]?.revenue || 0,
      revenueOrderCount: revenueStats[0]?.orderCount || 0,
      orderCount,
      averageOrder: Math.round(revenueStats[0]?.averageOrder || 0),
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
    period: {
      label: period.label,
      hasFilter: Boolean(period.dateRange),
    },
    monthlyRevenue: monthlyRevenue.reverse().map((item) => ({ month: item._id, revenue: item.revenue, count: item.count })),
    topProducts: salesByProduct.slice(0, 5).map((item) => ({
      productId: item._id,
      name: item.name,
      quantity: item.quantity,
      revenue: item.revenue,
    })),
    leastProducts: mapProductSales(productsForSales, salesByProduct)
      .sort((first, second) => first.quantity - second.quantity || first.revenue - second.revenue || first.name.localeCompare(second.name))
      .slice(0, 5),
    topCustomers: topCustomers.map((item) => ({
      name: item.name,
      email: item.email,
      phone: item.phone,
      orderCount: item.orderCount,
      itemCount: item.itemCount,
      totalSpent: item.totalSpent,
    })),
    lowStockProducts: lowStockProducts.map(serializeProduct),
    recentOrders: recentOrders.map(serializeOrder),
    recentContacts: recentContacts.map(serializeContact),
  })
})

export const listAdminCustomers = asyncHandler(async (req, res) => {
  const query = String(req.query.query || '').trim()
  const pagination = readPagination(req.query, 12)
  const period = readSummaryPeriod(req.query)
  const orderMatch = { status: { $in: REVENUE_ORDER_STATUSES }, ...createDateMatch('updatedAt', period.dateRange) }
  const searchRegex = query ? new RegExp(escapeRegex(query), 'i') : null
  const skip = pagination.shouldPaginate ? (pagination.page - 1) * pagination.limit : 0
  const limit = pagination.shouldPaginate ? pagination.limit : 100000

  const pipeline = [
    { $match: orderMatch },
    { $sort: { updatedAt: -1 } },
    {
      $project: {
        customer: 1,
        total: 1,
        updatedAt: 1,
        itemCount: { $sum: '$items.quantity' },
      },
    },
    {
      $group: {
        _id: '$customer.email',
        name: { $first: '$customer.name' },
        email: { $first: '$customer.email' },
        phone: { $first: '$customer.phone' },
        address: { $first: '$customer.address' },
        orderCount: { $sum: 1 },
        itemCount: { $sum: '$itemCount' },
        totalSpent: { $sum: '$total' },
        latestOrderAt: { $max: '$updatedAt' },
      },
    },
    ...(searchRegex
      ? [{
          $match: {
            $or: [
              { name: searchRegex },
              { email: searchRegex },
              { phone: searchRegex },
              { address: searchRegex },
            ],
          },
        }]
      : []),
    { $sort: { totalSpent: -1, orderCount: -1, itemCount: -1, latestOrderAt: -1 } },
    {
      $facet: {
        customers: [
          ...(pagination.shouldPaginate ? [{ $skip: skip }, { $limit: limit }] : []),
        ],
        total: [{ $count: 'count' }],
      },
    },
  ]

  const [result] = await Order.aggregate(pipeline)
  const customers = result?.customers || []
  const total = result?.total?.[0]?.count || 0
  const emails = customers.map((customer) => customer.email).filter(Boolean)
  const users = await User.find({ email: { $in: emails } })
  const usersByEmail = new Map(users.map((user) => [user.email, user]))

  res.json({
    customers: customers.map((customer) => serializeCustomerStat(customer, usersByEmail.get(customer.email))),
    pagination: createPagination(total, pagination),
    period: {
      label: period.label,
      hasFilter: Boolean(period.dateRange),
    },
  })
})

export const listAdminOrders = asyncHandler(async (req, res) => {
  const query = String(req.query.query || '').trim()
  const customerEmail = String(req.query.customerEmail || '').trim().toLowerCase()
  const status = String(req.query.status || 'all').trim()
  const payment = String(req.query.payment || 'all').trim()
  const dateField = String(req.query.dateField || 'createdAt').trim()
  const pagination = readPagination(req.query)
  const match = {}

  if (query) {
    const searchRegex = new RegExp(escapeRegex(query), 'i')
    match.$or = [
      { orderCode: searchRegex },
      { payment: searchRegex },
      { 'customer.name': searchRegex },
      { 'customer.email': searchRegex },
      { 'customer.phone': searchRegex },
      { 'customer.address': searchRegex },
      { 'items.name': searchRegex },
    ]
  }

  if (customerEmail) {
    match['customer.email'] = customerEmail
  }

  if (status === 'pending') {
    match.status = { $in: PENDING_ORDER_STATUSES }
  } else if (status === 'revenue') {
    match.status = { $in: REVENUE_ORDER_STATUSES }
  } else if (status !== 'all') {
    if (!Object.keys(ORDER_STATUS_LABELS).includes(status)) {
      throw httpError(400, 'Trạng thái đơn hàng không hợp lệ.')
    }
    match.status = status
  }

  if (payment !== 'all') {
    match.payment = payment
  }

  if (!['createdAt', 'updatedAt'].includes(dateField)) {
    throw httpError(400, 'Trường ngày lọc đơn hàng không hợp lệ.')
  }

  const createdAtRange = readDateRangeFilter(req.query)
  if (createdAtRange) {
    match[dateField] = createdAtRange
  }

  const orderQuery = applyPagination(Order.find(match).sort({ createdAt: -1 }), pagination)

  const [orders, total, paymentOptions] = await Promise.all([
    orderQuery,
    Order.countDocuments(match),
    Order.distinct('payment'),
  ])

  res.json({
    orders: orders.map(serializeOrder),
    pagination: createPagination(total, pagination),
    paymentOptions: paymentOptions.filter(Boolean).sort(),
  })
})

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  if (!Object.keys(ORDER_STATUS_LABELS).includes(status)) {
    throw httpError(400, 'Trạng thái đơn hàng không hợp lệ.')
  }

  const order = await Order.findOne({ orderCode: req.params.orderCode })
  if (!order) {
    throw httpError(404, 'Không tìm thấy đơn hàng.')
  }

  const previousStatus = order.status
  order.status = status
  await order.save()

  if (previousStatus !== status) {
    const notificationUser = order.user || (await User.findOne({ email: order.customer.email }))?._id
    await createUserNotification({
      user: notificationUser,
      type: 'order',
      title: 'Cập nhật đơn hàng',
      message: `Đơn hàng ${order.orderCode} đã chuyển sang trạng thái ${ORDER_STATUS_LABELS[status]}.`,
      link: `/account?focus=order&order=${encodeURIComponent(order.orderCode)}`,
      metadata: {
        orderCode: order.orderCode,
        previousStatus,
        status,
      },
    })

    emitAdminEvent({
      type: 'order-updated',
      order: serializeOrder(order),
      orderCode: order.orderCode,
      previousStatus,
      status,
      createdAt: new Date().toISOString(),
    })
  }

  res.json({
    message: 'Đã cập nhật trạng thái đơn hàng.',
    order: serializeOrder(order),
  })
})

export const listAdminContacts = asyncHandler(async (req, res) => {
  const query = String(req.query.query || '').trim()
  const status = String(req.query.status || 'all').trim()
  const pagination = readPagination(req.query)
  const match = {}

  if (query) {
    const searchRegex = new RegExp(escapeRegex(query), 'i')
    match.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
      { topic: searchRegex },
      { message: searchRegex },
    ]
  }

  if (status === 'pending') {
    match.status = { $in: PENDING_CONTACT_STATUSES }
  } else if (status !== 'all') {
    if (!Object.keys(CONTACT_STATUS_LABELS).includes(status)) {
      throw httpError(400, 'Trạng thái liên hệ không hợp lệ.')
    }
    match.status = status
  }

  const createdAtRange = readDateRangeFilter(req.query)
  if (createdAtRange) {
    match.createdAt = createdAtRange
  }

  const contactQuery = applyPagination(ContactMessage.find(match).sort({ createdAt: -1 }), pagination)
  const [contacts, total] = await Promise.all([
    contactQuery,
    ContactMessage.countDocuments(match),
  ])

  res.json({
    contacts: contacts.map(serializeContact),
    pagination: createPagination(total, pagination),
  })
})

export const updateContactStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  if (!Object.keys(CONTACT_STATUS_LABELS).includes(status)) {
    throw httpError(400, 'Trạng thái liên hệ không hợp lệ.')
  }

  const contact = await ContactMessage.findById(req.params.contactId)
  if (!contact) {
    throw httpError(404, 'Không tìm thấy liên hệ.')
  }

  const previousStatus = contact.status
  contact.status = status
  await contact.save()

  if (previousStatus !== status) {
    const notificationUser = contact.user || (await User.findOne({ email: contact.email }))?._id
    await createUserNotification({
      user: notificationUser,
      type: 'contact',
      title: 'Cập nhật yêu cầu hỗ trợ',
      message: `Yêu cầu "${contact.topic}" đã chuyển sang trạng thái ${CONTACT_STATUS_LABELS[status]}.`,
      link: `/account?focus=contact&contact=${encodeURIComponent(contact._id.toString())}`,
      metadata: {
        contactId: contact._id.toString(),
        previousStatus,
        status,
        topic: contact.topic,
      },
    })
  }

  res.json({
    message: 'Đã cập nhật trạng thái liên hệ.',
    contact: serializeContact(contact),
  })
})

export const listAdminReviews = asyncHandler(async (req, res) => {
  const query = String(req.query.query || '').trim()
  const rating = String(req.query.rating || 'all').trim()
  const pagination = readPagination(req.query)
  const match = {}

  if (rating !== 'all') {
    const parsedRating = Number(rating)
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      throw httpError(400, 'Điểm đánh giá không hợp lệ.')
    }
    match.rating = parsedRating
  }

  const createdAtRange = readDateRangeFilter(req.query)
  if (createdAtRange) {
    match.createdAt = createdAtRange
  }

  if (query) {
    const searchRegex = new RegExp(escapeRegex(query), 'i')
    const [matchedProducts, matchedUsers] = await Promise.all([
      Product.find({ $or: [{ name: searchRegex }, { category: searchRegex }] }).select('legacyId'),
      User.find({ email: searchRegex }).select('_id'),
    ])
    const productIds = matchedProducts.map((product) => product.legacyId)
    const userIds = matchedUsers.map((user) => user._id)
    const queryMatch = [
      { name: searchRegex },
      { comment: searchRegex },
      ...(Number.isFinite(Number(query)) ? [{ productId: Number(query) }] : []),
      ...(productIds.length ? [{ productId: { $in: productIds } }] : []),
      ...(userIds.length ? [{ user: { $in: userIds } }] : []),
    ]

    match.$or = queryMatch
  }

  const reviewQuery = applyPagination(Review.find(match).populate('user', 'email').sort({ createdAt: -1 }), pagination)
  const [reviews, total] = await Promise.all([
    reviewQuery,
    Review.countDocuments(match),
  ])
  const productIds = [...new Set(reviews.map((review) => review.productId))]
  const products = await Product.find({ legacyId: { $in: productIds } })
  const productsByLegacyId = new Map(products.map((product) => [product.legacyId, product]))

  res.json({
    reviews: reviews.map((review) => serializeAdminReview(review, productsByLegacyId.get(review.productId))),
    pagination: createPagination(total, pagination),
  })
})

export const deleteAdminReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.reviewId)
  if (!review) {
    throw httpError(404, 'Không tìm thấy đánh giá.')
  }

  const product = await Product.findOne({ legacyId: review.productId })
  if (product) {
    const stats = await Review.aggregate([
      { $match: { productId: review.productId } },
      { $group: { _id: '$productId', averageRating: { $avg: '$rating' } } },
    ])
    product.rating = stats[0] ? Number(stats[0].averageRating.toFixed(1)) : 0
    await product.save()
  }

  res.json({
    message: 'Đã xóa đánh giá sản phẩm.',
    reviewId: review._id.toString(),
  })
})

export const listAdminUsers = asyncHandler(async (req, res) => {
  const query = String(req.query.query || '').trim()
  const role = String(req.query.role || 'all').trim()
  const pagination = readPagination(req.query)
  const match = {}

  if (query) {
    const searchRegex = new RegExp(escapeRegex(query), 'i')
    match.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
      { address: searchRegex },
      { 'shippingAddresses.address': searchRegex },
      { 'shippingAddresses.phone': searchRegex },
      { 'shippingAddresses.recipient': searchRegex },
    ]
  }

  if (role !== 'all') {
    if (!['customer', 'admin'].includes(role)) {
      throw httpError(400, 'Quyền người dùng không hợp lệ.')
    }
    match.role = role
  }

  const userQuery = applyPagination(User.find(match).sort({ createdAt: -1 }), pagination)
  const [users, total] = await Promise.all([
    userQuery,
    User.countDocuments(match),
  ])

  res.json({
    users: users.map(serializeUser),
    pagination: createPagination(total, pagination),
  })
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

export const listAdminProducts = asyncHandler(async (req, res) => {
  const query = String(req.query.query || '').trim()
  const category = String(req.query.category || 'all').trim()
  const stock = String(req.query.stock || 'all').trim()
  const pagination = readPagination(req.query)
  const match = {}

  if (query) {
    const searchRegex = new RegExp(escapeRegex(query), 'i')
    match.$or = [
      { name: searchRegex },
      { category: searchRegex },
      { description: searchRegex },
      ...(Number.isFinite(Number(query)) ? [{ legacyId: Number(query) }] : []),
    ]
  }

  if (category !== 'all') {
    match.category = category
  }

  if (stock === 'low') {
    match.stock = { $lte: 10 }
  } else if (stock === 'out') {
    match.stock = 0
  } else if (stock !== 'all') {
    throw httpError(400, 'Bộ lọc tồn kho không hợp lệ.')
  }

  const productQuery = applyPagination(Product.find(match).sort({ legacyId: 1 }), pagination)
  const [products, total, categoryOptions] = await Promise.all([
    productQuery,
    Product.countDocuments(match),
    Product.distinct('category'),
  ])

  res.json({
    products: products.map(serializeProduct),
    pagination: createPagination(total, pagination),
    categoryOptions: categoryOptions.filter(Boolean).sort(),
  })
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
    { returnDocument: 'after', runValidators: true },
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
