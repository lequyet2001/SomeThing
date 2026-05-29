import { ADMIN_EMAIL } from '../config/env.js'
import { User } from '../models/User.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { hashPassword, verifyPassword } from '../utils/password.js'
import { httpError } from '../utils/httpError.js'
import { createToken } from '../utils/token.js'

function serializeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    address: user.address || '',
    role: user.role || 'customer',
  }
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

async function syncConfiguredAdminRole(user) {
  if (user.email === ADMIN_EMAIL && user.role !== 'admin') {
    user.role = 'admin'
    await user.save()
  }

  return user
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
  req.user.phone = String(req.body.phone || '').trim()
  req.user.address = String(req.body.address || '').trim()
  await req.user.save()

  res.json({
    message: 'Đã cập nhật thông tin khách hàng.',
    user: serializeUser(req.user),
  })
})
