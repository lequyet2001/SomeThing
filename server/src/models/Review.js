import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema(
  {
    productId: { type: Number, required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
)

export const Review = mongoose.model('Review', reviewSchema)
