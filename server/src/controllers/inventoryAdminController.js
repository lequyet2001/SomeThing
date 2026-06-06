import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { InventoryLog } from '../models/InventoryLog.js'
import { Product } from '../models/Product.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { httpError } from '../utils/httpError.js'
import {
  applyPagination,
  createPagination,
  escapeRegex,
  readDateRangeFilter,
  readPagination,
} from './adminQueryUtils.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PRODUCT_UPLOAD_DIR = path.resolve(__dirname, '../../uploads/products')
const IMAGE_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const productChangeFields = ['name', 'category', 'price', 'stock', 'image', 'description', 'rating']

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
  }
}

function serializeInventoryLog(log) {
  return {
    id: log._id.toString(),
    action: log.action,
    actor: log.actor || {},
    changes: (log.changes || []).map((change) => ({
      field: change.field,
      newValue: change.newValue,
      previousValue: change.previousValue,
    })),
    delta: log.delta,
    newStock: log.newStock,
    previousStock: log.previousStock,
    productCategory: log.productCategory,
    productId: log.productId,
    productImage: log.productImage,
    productName: log.productName,
    createdAt: log.createdAt,
  }
}

function normalizeProductChangeValue(value) {
  if (value === undefined) return null
  if (value === null) return null
  return typeof value === 'string' ? value.trim() : value
}

function areProductChangeValuesEqual(previousValue, newValue) {
  const normalizedPreviousValue = normalizeProductChangeValue(previousValue)
  const normalizedNewValue = normalizeProductChangeValue(newValue)
  return normalizedPreviousValue === normalizedNewValue
}

function readProductChanges(product, payload) {
  return Object.entries(payload)
    .filter(([field, value]) => !areProductChangeValuesEqual(product[field], value))
    .map(([field, value]) => ({
      field,
      newValue: normalizeProductChangeValue(value),
      previousValue: normalizeProductChangeValue(product[field]),
    }))
}

function readProductSnapshotChanges(product, mode) {
  return productChangeFields
    .filter((field) => product[field] !== undefined)
    .map((field) => ({
      field,
      newValue: mode === 'created' ? normalizeProductChangeValue(product[field]) : null,
      previousValue: mode === 'deleted' ? normalizeProductChangeValue(product[field]) : null,
    }))
}

async function createInventoryLog(req, product, action, previousStock, newStock, changes = []) {
  const normalizedPreviousStock = previousStock === undefined || previousStock === null ? null : Number(previousStock)
  const normalizedNewStock = newStock === undefined || newStock === null ? null : Number(newStock)
  const delta =
    normalizedPreviousStock === null || normalizedNewStock === null
      ? 0
      : normalizedNewStock - normalizedPreviousStock

  return InventoryLog.create({
    action,
    actor: {
      id: req.user?._id?.toString() || '',
      name: req.user?.name || '',
      email: req.user?.email || '',
    },
    changes,
    delta,
    newStock: normalizedNewStock,
    previousStock: normalizedPreviousStock,
    productCategory: product.category,
    productId: product.legacyId,
    productImage: product.image,
    productName: product.name,
  })
}

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

  if (stock === 'healthy') {
    match.stock = { $gt: 10 }
  } else if (stock === 'low') {
    match.stock = { $gt: 0, $lte: 10 }
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

export const listAdminInventoryHistory = asyncHandler(async (req, res) => {
  const query = String(req.query.query || '').trim()
  const action = String(req.query.action || 'all').trim()
  const productId = Number(req.query.productId)
  const pagination = readPagination(req.query, 30)
  const createdAtRange = readDateRangeFilter(req.query)
  const match = {}

  if (createdAtRange) {
    match.createdAt = createdAtRange
  }

  if (action !== 'all') {
    const allowedActions = ['created', 'stock-adjusted', 'stock-updated', 'details-updated', 'deleted']
    if (!allowedActions.includes(action)) {
      throw httpError(400, 'Bộ lọc lịch sử kho không hợp lệ.')
    }
    match.action = action
  }

  if (Number.isFinite(productId) && productId > 0) {
    match.productId = productId
  }

  if (query) {
    const searchRegex = new RegExp(escapeRegex(query), 'i')
    match.$or = [
      { productName: searchRegex },
      { productCategory: searchRegex },
      { 'actor.name': searchRegex },
      { 'actor.email': searchRegex },
      ...(Number.isFinite(Number(query)) ? [{ productId: Number(query) }] : []),
    ]
  }

  const historyQuery = applyPagination(InventoryLog.find(match).sort({ createdAt: -1 }), pagination)
  const [history, total] = await Promise.all([
    historyQuery,
    InventoryLog.countDocuments(match),
  ])

  res.json({
    history: history.map(serializeInventoryLog),
    pagination: createPagination(total, pagination),
  })
})

export const createAdminProduct = asyncHandler(async (req, res) => {
  const payload = readProductPayload(req.body, true)
  const lastProduct = await Product.findOne().sort({ legacyId: -1 })
  const product = await Product.create({
    ...payload,
    legacyId: (lastProduct?.legacyId || 0) + 1,
    rating: payload.rating ?? 0,
  })
  const inventoryLog = await createInventoryLog(
    req,
    product,
    'created',
    0,
    product.stock,
    readProductSnapshotChanges(product, 'created'),
  )

  res.status(201).json({
    message: 'Đã thêm mặt hàng vào kho.',
    inventoryLog: serializeInventoryLog(inventoryLog),
    product: serializeProduct(product),
  })
})

export const updateAdminProduct = asyncHandler(async (req, res) => {
  const payload = readProductPayload(req.body)
  const product = await Product.findOne({ legacyId: Number(req.params.productId) })
  if (!product) {
    throw httpError(404, 'Không tìm thấy sản phẩm.')
  }

  const previousStock = Number(product.stock) || 0
  const updateSource = String(req.body.source || '').trim()
  const productChanges = readProductChanges(product, payload)
  Object.entries(payload).forEach(([field, value]) => {
    product[field] = value
  })
  await product.save()

  const stockChanged = payload.stock !== undefined && previousStock !== product.stock
  const hasChanges = productChanges.length > 0
  const inventoryLog = stockChanged
    ? await createInventoryLog(
      req,
      product,
      updateSource === 'quick-adjust' ? 'stock-adjusted' : 'stock-updated',
      previousStock,
      product.stock,
      productChanges,
    )
    : hasChanges
      ? await createInventoryLog(req, product, 'details-updated', previousStock, product.stock, productChanges)
      : null

  res.json({
    message: 'Đã cập nhật kho hàng.',
    ...(inventoryLog ? { inventoryLog: serializeInventoryLog(inventoryLog) } : {}),
    product: serializeProduct(product),
  })
})

export const deleteAdminProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndDelete({ legacyId: Number(req.params.productId) })
  if (!product) {
    throw httpError(404, 'Không tìm thấy sản phẩm.')
  }
  const inventoryLog = await createInventoryLog(
    req,
    product,
    'deleted',
    product.stock,
    0,
    readProductSnapshotChanges(product, 'deleted'),
  )

  res.json({
    message: 'Đã xóa mặt hàng khỏi kho.',
    inventoryLog: serializeInventoryLog(inventoryLog),
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
