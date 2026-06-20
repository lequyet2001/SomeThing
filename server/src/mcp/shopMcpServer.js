import mongoose from 'mongoose'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

import { MONGODB_SERVER_SELECTION_TIMEOUT_MS, MONGODB_URI } from '../config/env.js'
import { getDatabaseStatus } from '../config/database.js'
import { createLocalDate, escapeRegex } from '../controllers/adminQueryUtils.js'
import { Category } from '../models/Category.js'
import { ContactMessage } from '../models/ContactMessage.js'
import { Order } from '../models/Order.js'
import { Product } from '../models/Product.js'
import { User } from '../models/User.js'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10
const MAX_LIMIT = 50
const REVENUE_ORDER_STATUSES = ['paid', 'completed']
const PENDING_ORDER_STATUSES = ['confirmed', 'paid', 'shipping']
const PENDING_CONTACT_STATUSES = ['new', 'processing']

let databasePromise = null

function toJsonContent(data) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2),
      },
    ],
  }
}

async function ensureDatabase() {
  if (mongoose.connection.readyState === 1) return

  if (!databasePromise) {
    databasePromise = mongoose
      .connect(MONGODB_URI, {
        serverSelectionTimeoutMS: MONGODB_SERVER_SELECTION_TIMEOUT_MS,
      })
      .then(() => {
        console.error(`MCP MongoDB connected: ${mongoose.connection.name}`)
      })
      .catch((error) => {
        databasePromise = null
        throw error
      })
  }

  await databasePromise
}

function readPagination({ page, limit } = {}) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : DEFAULT_PAGE
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), MAX_LIMIT) : DEFAULT_LIMIT

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  }
}

function createDateRange({ month, startDate, endDate } = {}) {
  const safeMonth = String(month || '').trim()
  const safeStartDate = String(startDate || '').trim()
  const safeEndDate = String(endDate || '').trim()
  const range = {}

  if (safeMonth) {
    const start = createLocalDate(`${safeMonth}-01`)
    if (Number.isNaN(start.getTime())) {
      throw new Error('Tháng không hợp lệ. Dùng định dạng YYYY-MM.')
    }

    const end = new Date(start)
    end.setUTCMonth(end.getUTCMonth() + 1)
    return { $gte: start, $lt: end }
  }

  if (safeStartDate) {
    const start = createLocalDate(safeStartDate)
    if (Number.isNaN(start.getTime())) {
      throw new Error('Ngày bắt đầu không hợp lệ. Dùng định dạng YYYY-MM-DD.')
    }
    range.$gte = start
  }

  if (safeEndDate) {
    const end = createLocalDate(safeEndDate)
    if (Number.isNaN(end.getTime())) {
      throw new Error('Ngày kết thúc không hợp lệ. Dùng định dạng YYYY-MM-DD.')
    }
    end.setUTCDate(end.getUTCDate() + 1)
    range.$lt = end
  }

  if (range.$gte && range.$lt && range.$gte >= range.$lt) {
    throw new Error('Khoảng thời gian không hợp lệ.')
  }

  return Object.keys(range).length ? range : null
}

function buildProductMatch({ query, category } = {}) {
  const match = {}
  const safeQuery = String(query || '').trim()
  const safeCategory = String(category || '').trim()

  if (safeCategory && !['all', 'tat ca', 'tất cả'].includes(safeCategory.toLowerCase())) {
    match.category = new RegExp(`^${escapeRegex(safeCategory)}$`, 'i')
  }

  if (safeQuery) {
    const searchRegex = new RegExp(escapeRegex(safeQuery), 'i')
    match.$or = [{ name: searchRegex }, { category: searchRegex }, { description: searchRegex }]
  }

  return match
}

function buildProductSort(sort) {
  if (sort === 'priceAsc') return { price: 1, createdAt: -1 }
  if (sort === 'priceDesc') return { price: -1, createdAt: -1 }
  if (sort === 'ratingDesc') return { rating: -1, createdAt: -1 }
  if (sort === 'stockAsc') return { stock: 1, createdAt: -1 }
  return { createdAt: -1 }
}

function buildOrderMatch({ query, status, payment, customerType, month, startDate, endDate } = {}) {
  const match = {}
  const safeQuery = String(query || '').trim()
  const safeStatus = String(status || 'all').trim()
  const safePayment = String(payment || '').trim()
  const safeCustomerType = String(customerType || 'all').trim()
  const dateRange = createDateRange({ month, startDate, endDate })

  if (safeStatus === 'pending') {
    match.status = { $in: PENDING_ORDER_STATUSES }
  } else if (safeStatus === 'revenue') {
    match.status = { $in: REVENUE_ORDER_STATUSES }
  } else if (safeStatus !== 'all') {
    match.status = safeStatus
  }

  if (safePayment) {
    match.payment = new RegExp(escapeRegex(safePayment), 'i')
  }

  if (safeCustomerType === 'registered') {
    match.user = { $exists: true, $ne: null }
  } else if (safeCustomerType === 'guest') {
    match.$or = [{ user: { $exists: false } }, { user: null }]
  }

  if (dateRange) {
    match.createdAt = dateRange
  }

  if (safeQuery) {
    const searchRegex = new RegExp(escapeRegex(safeQuery), 'i')
    const searchMatch = {
      $or: [
        { orderCode: searchRegex },
        { 'customer.name': searchRegex },
        { 'customer.email': searchRegex },
        { 'customer.phone': searchRegex },
      ],
    }

    if (match.$or) {
      match.$and = [{ $or: match.$or }, searchMatch]
      delete match.$or
    } else {
      Object.assign(match, searchMatch)
    }
  }

  return match
}

function serializeProduct(product) {
  return {
    id: product._id.toString(),
    legacyId: product.legacyId,
    name: product.name,
    category: product.category,
    price: product.price,
    rating: product.rating,
    stock: product.stock,
    image: product.image,
    description: product.description,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  }
}

function serializeOrder(order) {
  return {
    id: order._id.toString(),
    orderCode: order.orderCode,
    customerType: order.user ? 'registered' : 'guest',
    customer: {
      name: order.customer?.name || '',
      email: order.customer?.email || '',
      phone: order.customer?.phone || '',
    },
    itemCount: order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total,
    payment: order.payment,
    status: order.status,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }
}

const server = new McpServer({
  name: 'marseille04-shop-mcp',
  version: '1.0.0',
})

server.registerTool(
  'shop_health',
  {
    title: 'Shop health',
    description: 'Kiểm tra trạng thái MCP server và kết nối MongoDB của Marseille04 Shop.',
  },
  async () => {
    await ensureDatabase()

    return toJsonContent({
      status: 'ok',
      database: getDatabaseStatus(),
      databaseName: mongoose.connection.name,
    })
  },
)

server.registerTool(
  'shop_list_categories',
  {
    title: 'List categories',
    description: 'Lấy danh sách danh mục sản phẩm.',
  },
  async () => {
    await ensureDatabase()

    const categories = await Category.find({}).sort({ name: 1 }).lean()

    return toJsonContent({
      total: categories.length,
      items: categories.map((category) => ({
        id: category._id.toString(),
        name: category.name,
      })),
    })
  },
)

server.registerTool(
  'shop_list_products',
  {
    title: 'List products',
    description: 'Tìm kiếm/lọc/phân trang sản phẩm trong database shop.',
    inputSchema: {
      page: z.number().int().min(1).optional(),
      limit: z.number().int().min(1).max(MAX_LIMIT).optional(),
      query: z.string().optional(),
      category: z.string().optional(),
      sort: z.enum(['newest', 'priceAsc', 'priceDesc', 'ratingDesc', 'stockAsc']).optional(),
    },
  },
  async (args) => {
    await ensureDatabase()

    const pagination = readPagination(args)
    const match = buildProductMatch(args)
    const sort = buildProductSort(args.sort)
    const [items, total] = await Promise.all([
      Product.find(match).sort(sort).skip(pagination.skip).limit(pagination.limit).lean(),
      Product.countDocuments(match),
    ])

    return toJsonContent({
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / pagination.limit)),
      items: items.map(serializeProduct),
    })
  },
)

server.registerTool(
  'shop_get_product',
  {
    title: 'Get product',
    description: 'Lấy chi tiết sản phẩm theo Mongo id, legacyId hoặc tên gần đúng.',
    inputSchema: {
      product: z.string().min(1),
    },
  },
  async ({ product }) => {
    await ensureDatabase()

    const safeProduct = String(product).trim()
    const isNumericId = /^\d+$/.test(safeProduct)
    const numericId = isNumericId ? Number.parseInt(safeProduct, 10) : null
    const match = isNumericId
      ? { legacyId: numericId }
      : mongoose.isValidObjectId(safeProduct)
        ? { _id: safeProduct }
        : { name: new RegExp(escapeRegex(safeProduct), 'i') }

    const item = await Product.findOne(match).lean()

    return toJsonContent({
      item: item ? serializeProduct(item) : null,
    })
  },
)

server.registerTool(
  'shop_list_orders',
  {
    title: 'List orders',
    description: 'Lọc và phân trang đơn hàng để kiểm tra vận hành shop.',
    inputSchema: {
      page: z.number().int().min(1).optional(),
      limit: z.number().int().min(1).max(MAX_LIMIT).optional(),
      query: z.string().optional(),
      status: z.enum(['all', 'confirmed', 'paid', 'shipping', 'completed', 'cancelled', 'pending', 'revenue']).optional(),
      payment: z.string().optional(),
      customerType: z.enum(['all', 'registered', 'guest']).optional(),
      month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    },
  },
  async (args) => {
    await ensureDatabase()

    const pagination = readPagination(args)
    const match = buildOrderMatch(args)
    const [items, total] = await Promise.all([
      Order.find(match).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit).lean(),
      Order.countDocuments(match),
    ])

    return toJsonContent({
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / pagination.limit)),
      items: items.map(serializeOrder),
    })
  },
)

server.registerTool(
  'shop_admin_summary',
  {
    title: 'Admin summary',
    description: 'Lấy thống kê tổng quan: doanh thu, đơn cần xử lý, liên hệ mới, sản phẩm và người dùng.',
    inputSchema: {
      month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    },
  },
  async (args) => {
    await ensureDatabase()

    const dateRange = createDateRange(args)
    const createdAtMatch = dateRange ? { createdAt: dateRange } : {}
    const revenueMatch = {
      status: { $in: REVENUE_ORDER_STATUSES },
      ...(dateRange ? { updatedAt: dateRange } : {}),
    }

    const [revenueStats, orderCount, pendingOrderCount, pendingContactCount, productCount, userCount, adminCount] =
      await Promise.all([
        Order.aggregate([
          { $match: revenueMatch },
          { $group: { _id: null, revenue: { $sum: '$total' }, orderCount: { $sum: 1 }, averageOrder: { $avg: '$total' } } },
        ]),
        Order.countDocuments(createdAtMatch),
        Order.countDocuments({ status: { $in: PENDING_ORDER_STATUSES }, ...createdAtMatch }),
        ContactMessage.countDocuments({ status: { $in: PENDING_CONTACT_STATUSES }, ...createdAtMatch }),
        Product.countDocuments({}),
        User.countDocuments({}),
        User.countDocuments({ role: 'admin' }),
      ])

    return toJsonContent({
      revenue: revenueStats[0]?.revenue || 0,
      revenueOrderCount: revenueStats[0]?.orderCount || 0,
      averageOrder: Math.round(revenueStats[0]?.averageOrder || 0),
      orderCount,
      pendingOrderCount,
      pendingContactCount,
      productCount,
      userCount,
      adminCount,
      revenueStatuses: REVENUE_ORDER_STATUSES,
    })
  },
)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('Marseille04 Shop MCP server running on stdio')
}

main().catch((error) => {
  console.error('Failed to start Marseille04 Shop MCP server:', error)
  process.exit(1)
})
