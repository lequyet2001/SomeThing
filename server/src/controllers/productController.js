import { Order } from '../models/Order.js'
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

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const [products, categories, topCategories] = await Promise.all([
    Product.find(mongoQuery).sort(sortBy),
    Product.distinct('category'),
    Order.aggregate([
      {
        $match: {
          status: { $ne: 'cancelled' },
          createdAt: { $gte: monthStart, $lt: nextMonthStart },
        },
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: 'legacyId',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { quantity: -1, revenue: -1, _id: 1 } },
      { $limit: 4 },
    ]),
  ])

  res.json({
    categories: ['Tat ca', ...categories],
    products: products.map(serializeProduct),
    topCategories: topCategories.map((item) => ({
      category: item._id,
      quantity: item.quantity,
      revenue: item.revenue,
    })),
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
