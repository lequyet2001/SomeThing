import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { Category } from '../models/Category.js'
import { InventoryLog } from '../models/InventoryLog.js'
import { Product } from '../models/Product.js'
import {
  createCategoryInventoryLog,
  createProductInventoryLog,
  serializeInventoryLog,
} from '../services/inventoryLogService.js'
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

function normalizeCategoryName(value) {
  return String(value || '').trim()
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
  }
}

async function ensureCategoryExists(name) {
  const categoryName = normalizeCategoryName(name)
  if (!categoryName) return

  const existingCategory = await Category.findOne({ name: new RegExp(`^${escapeRegex(categoryName)}$`, 'i') })
  if (!existingCategory) {
    await Category.create({ name: categoryName })
  }
}

function serializeCategory(category, stats = {}) {
  const productCount = Number(stats.productCount || 0)
  const stock = Number(stats.stock || 0)
  const value = Number(stats.value || 0)

  return {
    id: category._id?.toString() || category.name,
    name: category.name,
    productCount,
    stock,
    value,
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

async function readAdminCategoryList() {
  let [storedCategories, productStats] = await Promise.all([
    Category.find().sort({ name: 1 }),
    Product.aggregate([
      {
        $group: {
          _id: '$category',
          productCount: { $sum: 1 },
          stock: { $sum: '$stock' },
          value: { $sum: { $multiply: ['$stock', '$price'] } },
        },
      },
    ]),
  ])
  const existingCategoryNames = new Set(storedCategories.map((category) => category.name.toLowerCase()))
  const queuedCategoryNames = new Set()
  const missingProductCategories = productStats
    .map((item) => normalizeCategoryName(item._id))
    .filter((name) => {
      const normalizedName = name.toLowerCase()
      if (!name || existingCategoryNames.has(normalizedName) || queuedCategoryNames.has(normalizedName)) return false
      queuedCategoryNames.add(normalizedName)
      return true
    })

  if (missingProductCategories.length > 0) {
    await Category.bulkWrite(
      missingProductCategories.map((name) => ({
        updateOne: {
          filter: { name },
          update: { $setOnInsert: { name } },
          upsert: true,
        },
      })),
      { ordered: false },
    )
    storedCategories = await Category.find().sort({ name: 1 })
  }

  const categoryByName = new Map(
    storedCategories
      .filter((category) => category.name)
      .map((category) => [category.name, category]),
  )
  const statsByName = new Map(
    productStats
      .filter((item) => item._id)
      .map((item) => [item._id, item]),
  )

  productStats.forEach((item) => {
    const name = normalizeCategoryName(item._id)
    if (name && !categoryByName.has(name)) {
      categoryByName.set(name, { name })
    }
  })

  return [...categoryByName.values()]
    .map((category) => serializeCategory(category, statsByName.get(category.name)))
    .sort((first, second) => first.name.localeCompare(second.name, 'vi'))
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

export const listAdminCategories = asyncHandler(async (req, res) => {
  res.json({
    categories: await readAdminCategoryList(),
  })
})

export const createAdminCategory = asyncHandler(async (req, res) => {
  const name = normalizeCategoryName(req.body.name)
  if (!name) {
    throw httpError(400, 'Vui lòng nhập tên danh mục.')
  }

  const categoryNameRegex = new RegExp(`^${escapeRegex(name)}$`, 'i')
  const [existingCategory, existingProductCategory] = await Promise.all([
    Category.findOne({ name: categoryNameRegex }),
    Product.exists({ category: categoryNameRegex }),
  ])
  if (existingCategory || existingProductCategory) {
    throw httpError(409, 'Danh mục này đã tồn tại.')
  }

  const category = await Category.create({ name })
  const inventoryLog = await createCategoryInventoryLog({
    action: 'category-created',
    categoryName: name,
    changes: [
      { field: 'categoryName', previousValue: null, newValue: name },
    ],
    nextName: name,
    productCount: 0,
    user: req.user,
  })

  res.status(201).json({
    category: serializeCategory(category),
    categories: await readAdminCategoryList(),
    inventoryLog: serializeInventoryLog(inventoryLog),
    message: 'Đã thêm danh mục kho.',
  })
})

export const updateAdminCategory = asyncHandler(async (req, res) => {
  const currentName = normalizeCategoryName(req.params.categoryName)
  const nextName = normalizeCategoryName(req.body.name)

  if (!currentName || !nextName) {
    throw httpError(400, 'Tên danh mục không hợp lệ.')
  }

  if (currentName.toLowerCase() !== nextName.toLowerCase()) {
    const categoryNameRegex = new RegExp(`^${escapeRegex(nextName)}$`, 'i')
    const [existingCategory, existingProductCategory] = await Promise.all([
      Category.findOne({ name: categoryNameRegex }),
      Product.exists({ category: categoryNameRegex }),
    ])
    if (existingCategory || existingProductCategory) {
      throw httpError(409, 'Danh mục mới đã tồn tại.')
    }
  }

  const category = await Category.findOneAndUpdate(
    { name: currentName },
    { name: nextName },
    { returnDocument: 'after', upsert: true },
  )
  const updateResult = await Product.updateMany({ category: currentName }, { category: nextName })
  const inventoryLog = await createCategoryInventoryLog({
    action: 'category-updated',
    categoryName: nextName,
    changes: [
      { field: 'categoryName', previousValue: currentName, newValue: nextName },
    ],
    nextName,
    previousName: currentName,
    productCount: updateResult.modifiedCount || 0,
    user: req.user,
  })

  res.json({
    category: serializeCategory(category),
    categories: await readAdminCategoryList(),
    inventoryLog: serializeInventoryLog(inventoryLog),
    message: 'Đã cập nhật danh mục kho.',
    products: (await Product.find().sort({ legacyId: 1 })).map(serializeProduct),
  })
})

export const deleteAdminCategory = asyncHandler(async (req, res) => {
  const name = normalizeCategoryName(req.params.categoryName)
  if (!name) {
    throw httpError(400, 'Tên danh mục không hợp lệ.')
  }

  const productCount = await Product.countDocuments({ category: name })
  if (productCount > 0) {
    throw httpError(400, 'Không thể xóa danh mục đang có mặt hàng. Vui lòng chuyển mặt hàng sang danh mục khác trước.')
  }

  await Category.deleteOne({ name })
  const inventoryLog = await createCategoryInventoryLog({
    action: 'category-deleted',
    categoryName: name,
    changes: [
      { field: 'categoryName', previousValue: name, newValue: null },
    ],
    previousName: name,
    productCount,
    user: req.user,
  })

  res.json({
    categories: await readAdminCategoryList(),
    inventoryLog: serializeInventoryLog(inventoryLog),
    message: 'Đã xóa danh mục kho.',
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
    const allowedActions = [
      'created',
      'stock-adjusted',
      'stock-updated',
      'details-updated',
      'deleted',
      'category-created',
      'category-updated',
      'category-deleted',
      'order-deducted',
    ]
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
      { categoryName: searchRegex },
      { orderCode: searchRegex },
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
  await ensureCategoryExists(payload.category)
  const lastProduct = await Product.findOne().sort({ legacyId: -1 })
  const product = await Product.create({
    ...payload,
    legacyId: (lastProduct?.legacyId || 0) + 1,
    rating: payload.rating ?? 0,
  })
  const inventoryLog = await createProductInventoryLog({
    user: req.user,
    product,
    action: 'created',
    previousStock: 0,
    newStock: product.stock,
    changes: readProductSnapshotChanges(product, 'created'),
  })

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
  if (payload.category !== undefined) {
    await ensureCategoryExists(payload.category)
  }
  Object.entries(payload).forEach(([field, value]) => {
    product[field] = value
  })
  await product.save()

  const stockChanged = payload.stock !== undefined && previousStock !== product.stock
  const hasChanges = productChanges.length > 0
  const inventoryLog = stockChanged
    ? await createProductInventoryLog({
      user: req.user,
      product,
      action: updateSource === 'quick-adjust' ? 'stock-adjusted' : 'stock-updated',
      previousStock,
      newStock: product.stock,
      changes: productChanges,
    })
    : hasChanges
      ? await createProductInventoryLog({
        user: req.user,
        product,
        action: 'details-updated',
        previousStock,
        newStock: product.stock,
        changes: productChanges,
      })
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
  const inventoryLog = await createProductInventoryLog({
    user: req.user,
    product,
    action: 'deleted',
    previousStock: product.stock,
    newStock: 0,
    changes: readProductSnapshotChanges(product, 'deleted'),
  })

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
