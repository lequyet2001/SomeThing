import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
  {
    legacyId: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    stock: { type: Number, default: 0, min: 0 },
    image: { type: String, required: true },
    description: { type: String, required: true, trim: true },
  },
  { timestamps: true },
)

export const Product = mongoose.model('Product', productSchema)
