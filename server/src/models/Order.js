import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: Number, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String, required: true },
  },
  { _id: false },
)

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: '', trim: true },
    address: { type: String, required: true, trim: true },
  },
  { _id: false },
)

const orderSchema = new mongoose.Schema(
  {
    orderCode: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customer: { type: customerSchema, required: true },
    items: { type: [orderItemSchema], required: true },
    payment: { type: String, required: true, trim: true },
    status: { type: String, default: 'confirmed', enum: ['confirmed', 'paid', 'shipping', 'completed', 'cancelled'] },
    subtotal: { type: Number, required: true, min: 0 },
    shipping: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
)

export const Order = mongoose.model('Order', orderSchema)
