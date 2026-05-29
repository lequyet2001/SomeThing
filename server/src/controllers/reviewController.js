import { Product } from '../models/Product.js'
import { Review } from '../models/Review.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { httpError } from '../utils/httpError.js'

function serializeReview(review) {
  return {
    id: review._id.toString(),
    productId: review.productId,
    name: review.name,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
  }
}

export const listReviews = asyncHandler(async (req, res) => {
  const productId = req.query.productId ? Number(req.query.productId) : null
  const query = productId ? { productId } : {}
  const reviews = await Review.find(query).sort({ createdAt: -1 })

  res.json({ reviews: reviews.map(serializeReview) })
})

export const createReview = asyncHandler(async (req, res) => {
  const productId = Number(req.body.productId)
  const rating = Number(req.body.rating)
  const comment = String(req.body.comment || '').trim()

  if (!productId || !Number.isInteger(rating) || rating < 1 || rating > 5 || !comment) {
    throw httpError(400, 'Đánh giá cần có sản phẩm, số sao từ 1 đến 5 và nội dung.')
  }

  const product = await Product.findOne({ legacyId: productId })
  if (!product) {
    throw httpError(404, 'Không tìm thấy sản phẩm để đánh giá.')
  }

  const review = await Review.create({
    productId,
    user: req.user._id,
    name: req.user.name,
    rating,
    comment,
  })

  const stats = await Review.aggregate([
    { $match: { productId } },
    { $group: { _id: '$productId', averageRating: { $avg: '$rating' } } },
  ])

  if (stats[0]) {
    product.rating = Number(stats[0].averageRating.toFixed(1))
    await product.save()
  }

  res.status(201).json({
    message: 'Đã gửi đánh giá sản phẩm.',
    review: serializeReview(review),
  })
})
