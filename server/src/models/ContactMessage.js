import mongoose from 'mongoose'

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: '', trim: true },
    topic: { type: String, default: 'Tư vấn sản phẩm', trim: true },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    status: { type: String, default: 'new', enum: ['new', 'processing', 'done'] },
  },
  { timestamps: true },
)

export const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema)
