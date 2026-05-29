import { User } from '../models/User.js'
import { httpError } from '../utils/httpError.js'
import { verifyToken } from '../utils/token.js'

async function readUserFromRequest(req) {
  const authorization = req.get('authorization') || ''
  const [scheme, token] = authorization.split(' ')
  if (scheme !== 'Bearer' || !token) return null

  const payload = verifyToken(token)
  if (!payload?.sub) return null

  return User.findById(payload.sub)
}

export async function optionalAuth(req, _res, next) {
  try {
    req.user = await readUserFromRequest(req)
    next()
  } catch (error) {
    next(error)
  }
}

export async function requireAuth(req, _res, next) {
  try {
    const user = await readUserFromRequest(req)
    if (!user) throw httpError(401, 'Cần đăng nhập để thực hiện thao tác này.')

    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}

export function requireAdmin(req, _res, next) {
  if (req.user?.role !== 'admin') {
    next(httpError(403, 'Chỉ tài khoản admin mới được truy cập khu quản lý.'))
    return
  }

  next()
}
