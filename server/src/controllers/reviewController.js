import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { Product } from '../models/Product.js'
import { Review } from '../models/Review.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { httpError } from '../utils/httpError.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REVIEW_UPLOAD_DIR = path.resolve(__dirname, '../../uploads/reviews')
const MAX_REVIEW_IMAGES = 4
const MAX_REVIEW_IMAGE_BYTES = 2 * 1024 * 1024
const ALLOWED_REVIEW_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

function parseDataUrl(dataUrl) {
  const match = String(dataUrl || '').match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return null

  return {
    buffer: Buffer.from(match[2], 'base64'),
    mimeType: match[1].toLowerCase(),
  }
}

function getImageExtension(mimeType) {
  if (mimeType === 'image/jpeg') return 'jpg'
  if (mimeType === 'image/png') return 'png'
  if (mimeType === 'image/webp') return 'webp'
  if (mimeType === 'image/gif') return 'gif'
  return ''
}

async function storeReviewImages(images = []) {
  if (!Array.isArray(images) || images.length === 0) return []
  if (images.length > MAX_REVIEW_IMAGES) {
    throw httpError(400, `Mỗi đánh giá chỉ được gửi tối đa ${MAX_REVIEW_IMAGES} ảnh.`)
  }

  await fs.mkdir(REVIEW_UPLOAD_DIR, { recursive: true })
  const storedImages = []

  for (const image of images) {
    const parsed = parseDataUrl(image?.dataUrl || image)
    if (!parsed || !ALLOWED_REVIEW_IMAGE_TYPES.has(parsed.mimeType)) {
      throw httpError(400, 'Ảnh đánh giá không hợp lệ.')
    }

    if (parsed.buffer.length > MAX_REVIEW_IMAGE_BYTES) {
      throw httpError(400, 'Mỗi ảnh đánh giá phải nhỏ hơn 2MB.')
    }

    const extension = getImageExtension(parsed.mimeType)
    const storedFileName = `review-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${extension}`
    await fs.writeFile(path.join(REVIEW_UPLOAD_DIR, storedFileName), parsed.buffer)
    storedImages.push(`/uploads/reviews/${storedFileName}`)
  }

  return storedImages
}

function serializeReview(review) {
  return {
    id: review._id.toString(),
    productId: review.productId,
    name: review.name,
    rating: review.rating,
    comment: review.comment,
    images: review.images || [],
    createdAt: review.createdAt,
  }
}

export const listReviews = asyncHandler(async (req, res) => {
  const productId = Number(req.query.productId)
  if (!productId) {
    throw httpError(400, 'Cần productId để lấy đánh giá sản phẩm.')
  }

  const reviews = await Review.find({ productId }).sort({ createdAt: -1 })

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

  const images = await storeReviewImages(req.body.images)

  const review = await Review.create({
    productId,
    user: req.user._id,
    name: req.user.name,
    rating,
    comment,
    images,
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
