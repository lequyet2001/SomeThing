import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    passwordSalt: { type: String, required: true, select: false },
    phone: { type: String, default: '', trim: true },
    address: { type: String, default: '', trim: true },
    role: { type: String, default: 'customer', enum: ['customer', 'admin'], index: true },
  },
  { timestamps: true },
)

export const User = mongoose.model('User', userSchema)
