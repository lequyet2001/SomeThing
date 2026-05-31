import { ContactMessage } from '../models/ContactMessage.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { httpError } from '../utils/httpError.js'

export const createContactMessage = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim()
  const email = String(req.body.email || '').trim().toLowerCase()
  const phone = String(req.body.phone || '').trim()
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
      topic: contactMessage.topic,
      status: contactMessage.status,
      createdAt: contactMessage.createdAt,
    },
  })
})
