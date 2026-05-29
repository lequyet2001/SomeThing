import crypto from 'node:crypto'

import { JWT_SECRET, TOKEN_EXPIRES_IN_SECONDS } from '../config/env.js'

function base64Url(input) {
  return Buffer.from(input).toString('base64url')
}

function sign(value) {
  return crypto.createHmac('sha256', JWT_SECRET).update(value).digest('base64url')
}

export function createToken(user) {
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64Url(
    JSON.stringify({
      sub: user._id.toString(),
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRES_IN_SECONDS,
    }),
  )
  const unsignedToken = `${header}.${payload}`
  return `${unsignedToken}.${sign(unsignedToken)}`
}

export function verifyToken(token) {
  const [header, payload, signature] = token.split('.')
  if (!header || !payload || !signature) return null

  const unsignedToken = `${header}.${payload}`
  const expectedSignature = sign(unsignedToken)
  const isValidSignature =
    signature.length === expectedSignature.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))

  if (!isValidSignature) return null

  const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  if (data.exp && data.exp < Math.floor(Date.now() / 1000)) return null
  return data
}
