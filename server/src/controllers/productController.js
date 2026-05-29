import { Product } from '../models/Product.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { httpError } from '../utils/httpError.js'

export function serializeProduct(product) {
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

export const listProducts = asyncHandler(async (req, res) => {
  const { category = 'Tat ca', query = '', sort = 'default' } = req.query
  const mongoQuery = {}
  const normalizedQuery = String(query).trim()

  if (category && category !== 'Tat ca') {
    mongoQuery.category = category
  }

  if (normalizedQuery) {
    mongoQuery.$or = [
      { name: { $regex: normalizedQuery, $options: 'i' } },
      { description: { $regex: normalizedQuery, $options: 'i' } },
    ]
  }

  const sortBy =
    sort === 'price-asc' ? { price: 1 } : sort === 'price-desc' ? { price: -1 } : { legacyId: 1 }

  const [products, categories] = await Promise.all([
    Product.find(mongoQuery).sort(sortBy),
    Product.distinct('category'),
  ])

  res.json({
    categories: ['Tat ca', ...categories],
    products: products.map(serializeProduct),
  })
})

export const getCategories = asyncHandler(async (_req, res) => {
  const categories = await Product.distinct('category')
  res.json({ categories: ['Tat ca', ...categories] })
})

export const getProduct = asyncHandler(async (req, res) => {
  const productId = Number(req.params.productId)
  const product = await Product.findOne({ legacyId: productId })

  if (!product) {
    throw httpError(404, 'Không tìm thấy sản phẩm.')
  }

  res.json({ product: serializeProduct(product) })
})
