import { createHash, randomBytes } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { ADMIN_EMAIL, CLIENT_ORIGIN } from '../config/env.js'
import { User } from '../models/User.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { hashPassword, verifyPassword } from '../utils/password.js'
import { httpError } from '../utils/httpError.js'
import { createToken } from '../utils/token.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AVATAR_UPLOAD_DIR = path.resolve(__dirname, '../../uploads/avatars')
const MAX_AVATAR_BYTES = 2 * 1024 * 1024
const MAX_AVATAR_DATA_URL_LENGTH = Math.ceil(MAX_AVATAR_BYTES * 1.4) + 64
const AVATAR_DATA_URL_PATTERN = /^data:image\/(jpeg|png|webp|gif);base64,([A-Za-z0-9+/]+=*)$/i
const AVATAR_EXTENSIONS = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
  gif: 'gif',
}
const RESET_PASSWORD_EXPIRES_IN_MS = 30 * 60 * 1000

function getUserShippingAddresses(user) {
  const addresses = Array.isArray(user.shippingAddresses) ? user.shippingAddresses : []
  if (addresses.length > 0) return addresses
  if (!user.address) return []

  return [{
    id: 'legacy-address',
    label: 'Mặc định',
    recipient: user.name,
    phone: user.phone || '',
    address: user.address,
  }]
}

function getSelectedAddress(user) {
  const addresses = getUserShippingAddresses(user)
  return addresses.find((item) => item.id === user.selectedAddressId) || addresses[0] || null
}

function serializeUser(user) {
  const shippingAddresses = getUserShippingAddresses(user)
  const selectedAddress = getSelectedAddress(user)
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    avatar: user.avatar || '',
    phone: user.phone || '',
    address: selectedAddress?.address || user.address || '',
    shippingAddresses,
    selectedAddressId: selectedAddress?.id || '',
    role: user.role || 'customer',
  }
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function hashResetToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

function createResetPasswordUrl(req, token) {
  const origin = req.get('origin') || CLIENT_ORIGIN
  return `${origin.replace(/\/$/, '')}/reset-password/${encodeURIComponent(token)}`
}

async function normalizeAvatar(rawValue, user) {
  const avatar = String(rawValue || '').trim()
  if (!avatar) return ''

  if (avatar.length > MAX_AVATAR_DATA_URL_LENGTH) {
    throw httpError(400, 'Ảnh đại diện phải nhỏ hơn 2MB.')
  }

  if (/^https?:\/\//i.test(avatar) || avatar.startsWith('/uploads/')) {
    return avatar
  }

  const match = avatar.match(AVATAR_DATA_URL_PATTERN)
  if (!match) {
    throw httpError(400, 'Ảnh đại diện phải là JPG, PNG, WEBP hoặc GIF.')
  }

  const [, type, base64Data] = match
  const buffer = Buffer.from(base64Data, 'base64')
  if (buffer.length > MAX_AVATAR_BYTES) {
    throw httpError(400, 'Ảnh đại diện phải nhỏ hơn 2MB.')
  }

  await fs.mkdir(AVATAR_UPLOAD_DIR, { recursive: true })
  const fileName = `avatar-${user._id}-${Date.now()}.${AVATAR_EXTENSIONS[type.toLowerCase()]}`
  await fs.writeFile(path.join(AVATAR_UPLOAD_DIR, fileName), buffer)

  return `/uploads/avatars/${fileName}`
}

async function syncConfiguredAdminRole(user) {
  if (user.email === ADMIN_EMAIL && user.role !== 'admin') {
    user.role = 'admin'
    await user.save()
  }

  return user
}

function normalizeShippingAddresses(rawValue, fallbackUser) {
  let rawAddresses = rawValue
  if (typeof rawAddresses === 'string') {
    try {
      rawAddresses = JSON.parse(rawAddresses || '[]')
    } catch {
      throw httpError(400, 'Danh sách địa chỉ giao hàng không hợp lệ.')
    }
  }

  if (!Array.isArray(rawAddresses)) {
    throw httpError(400, 'Danh sách địa chỉ giao hàng không hợp lệ.')
  }

  return rawAddresses
    .map((item, index) => ({
      id: String(item.id || `address-${Date.now()}-${index}`).trim(),
      label: String(item.label || `Địa chỉ ${index + 1}`).trim(),
      recipient: String(item.recipient || fallbackUser.name || '').trim(),
      phone: String(item.phone || fallbackUser.phone || '').trim(),
      address: String(item.address || '').trim(),
    }))
    .filter((item) => item.address)
    .slice(0, 8)
}

export const register = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim()
  const email = normalizeEmail(req.body.email)
  const password = String(req.body.password || '')

  if (!name || !email || password.length < 6) {
    throw httpError(400, 'Vui lòng nhập tên, email và mật khẩu tối thiểu 6 ký tự.')
  }

  const existingUser = await User.findOne({ email })
  if (existingUser) {
    throw httpError(409, 'Email đã được sử dụng.')
  }

  const { passwordHash, passwordSalt } = hashPassword(password)
  const role = email === ADMIN_EMAIL ? 'admin' : 'customer'
  const user = await User.create({ name, email, passwordHash, passwordSalt, role })

  res.status(201).json({
    message: 'Đăng ký thành công.',
    token: createToken(user),
    user: serializeUser(user),
  })
})

export const login = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email)
  const password = String(req.body.password || '')
  const user = await User.findOne({ email }).select('+passwordHash +passwordSalt')

  if (!user || !verifyPassword(password, user.passwordHash, user.passwordSalt)) {
    throw httpError(401, 'Email hoặc mật khẩu không đúng.')
  }

  await syncConfiguredAdminRole(user)

  res.json({
    message: 'Đăng nhập thành công.',
    token: createToken(user),
    user: serializeUser(user),
  })
})

export const forgotPassword = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email)
  if (!email) {
    throw httpError(400, 'Vui lòng nhập email để đặt lại mật khẩu.')
  }

  const user = await User.findOne({ email }).select('+passwordResetTokenHash +passwordResetExpiresAt')
  const response = {
    message: 'Nếu email tồn tại, hệ thống đã tạo liên kết đặt lại mật khẩu.',
  }

  if (user) {
    const resetToken = randomBytes(32).toString('hex')
    user.passwordResetTokenHash = hashResetToken(resetToken)
    user.passwordResetExpiresAt = new Date(Date.now() + RESET_PASSWORD_EXPIRES_IN_MS)
    await user.save()

    response.resetUrl = createResetPasswordUrl(req, resetToken)
    response.expiresInMinutes = Math.round(RESET_PASSWORD_EXPIRES_IN_MS / 60000)
  }

  res.json(response)
})

export const resetPassword = asyncHandler(async (req, res) => {
  const token = String(req.body.token || req.params.token || '').trim()
  const password = String(req.body.password || '')

  if (!token || password.length < 6) {
    throw httpError(400, 'Mật khẩu mới phải có tối thiểu 6 ký tự.')
  }

  const user = await User.findOne({
    passwordResetTokenHash: hashResetToken(token),
    passwordResetExpiresAt: { $gt: new Date() },
  }).select('+passwordHash +passwordSalt +passwordResetTokenHash +passwordResetExpiresAt')

  if (!user) {
    throw httpError(400, 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.')
  }

  const { passwordHash, passwordSalt } = hashPassword(password)
  user.passwordHash = passwordHash
  user.passwordSalt = passwordSalt
  user.passwordResetTokenHash = ''
  user.passwordResetExpiresAt = null
  await user.save()

  res.json({ message: 'Đã đặt lại mật khẩu. Bạn có thể đăng nhập bằng mật khẩu mới.' })
})

export const getProfile = asyncHandler(async (req, res) => {
  await syncConfiguredAdminRole(req.user)
  res.json({ user: serializeUser(req.user) })
})

export const updateProfile = asyncHandler(async (req, res) => {
  const nextEmail = normalizeEmail(req.body.email || req.user.email)
  if (nextEmail === ADMIN_EMAIL && req.user.role !== 'admin') {
    throw httpError(403, 'Email này được cấu hình cho tài khoản admin.')
  }

  req.user.name = String(req.body.name || req.user.name).trim()
  req.user.email = nextEmail
  if (req.body.avatar !== undefined) {
    req.user.avatar = await normalizeAvatar(req.body.avatar, req.user)
  }
  req.user.phone = String(req.body.phone || '').trim()

  const shippingAddresses = req.body.shippingAddresses !== undefined
    ? normalizeShippingAddresses(req.body.shippingAddresses, req.user)
    : normalizeShippingAddresses([{ address: req.body.address || req.user.address }], req.user)
  const selectedAddressId = String(req.body.selectedAddressId || '').trim()
  const selectedAddress = shippingAddresses.find((item) => item.id === selectedAddressId) || shippingAddresses[0] || null

  req.user.shippingAddresses = shippingAddresses
  req.user.selectedAddressId = selectedAddress?.id || ''
  req.user.address = selectedAddress?.address || String(req.body.address || '').trim()
  await req.user.save()

  res.json({
    message: 'Đã cập nhật thông tin khách hàng.',
    user: serializeUser(req.user),
  })
})
