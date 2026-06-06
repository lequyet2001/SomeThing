import { ContactMessage } from '../models/ContactMessage.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { httpError } from '../utils/httpError.js'

function serializeContactMessage(contactMessage) {
  return {
    id: contactMessage._id.toString(),
    name: contactMessage.name,
    email: contactMessage.email,
    phone: contactMessage.phone,
    topic: contactMessage.topic,
    message: contactMessage.message,
    status: contactMessage.status,
    createdAt: contactMessage.createdAt,
    updatedAt: contactMessage.updatedAt,
  }
}

export const createContactMessage = asyncHandler(async (req, res) => {
  const fallbackName = req.user?.name || req.user?.email?.split('@')[0] || ''
  const name = String(req.body.name || fallbackName).trim()
  const email = String(req.body.email || req.user?.email || '').trim().toLowerCase()
  const phone = String(req.body.phone || req.user?.phone || '').trim()
  const topic = String(req.body.topic || 'Tư vấn sản phẩm').trim()
  const message = String(req.body.message || '').trim()

  if (!name || !email || !message) {
    throw httpError(400, 'Vui lòng nhập tên, email và nội dung liên hệ.')
  }

  const contactMessage = await ContactMessage.create({
    name,
    email,
    phone,
    topic,
    message,
    user: req.user?._id,
  })

  res.status(201).json({
    message: `Cảm ơn ${contactMessage.name}, Marseille04 đã nhận thông tin liên hệ.`,
    contact: {
      id: contactMessage._id.toString(),
      name: contactMessage.name,
      email: contactMessage.email,
      phone: contactMessage.phone,
      topic: contactMessage.topic,
      message: contactMessage.message,
      status: contactMessage.status,
      createdAt: contactMessage.createdAt,
    },
  })
})

export const listMyContactMessages = asyncHandler(async (req, res) => {
  const contacts = await ContactMessage.find({
    $or: [
      { user: req.user._id },
      { email: req.user.email },
    ],
  }).sort({ createdAt: -1 })

  res.json({ contacts: contacts.map(serializeContactMessage) })
})
