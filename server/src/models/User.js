import mongoose from 'mongoose'

const shippingAddressSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, default: 'Địa chỉ giao hàng', trim: true },
    recipient: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    address: { type: String, required: true, trim: true },
  },
  { _id: false },
)

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    passwordSalt: { type: String, required: true, select: false },
    passwordResetTokenHash: { type: String, default: '', select: false, index: true },
    passwordResetExpiresAt: { type: Date, default: null, select: false },
    avatar: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    address: { type: String, default: '', trim: true },
    shippingAddresses: { type: [shippingAddressSchema], default: [] },
    selectedAddressId: { type: String, default: '', trim: true },
    role: { type: String, default: 'customer', enum: ['customer', 'admin'], index: true },
  },
  { timestamps: true },
)

export const User = mongoose.model('User', userSchema)
