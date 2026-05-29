import crypto from 'node:crypto'

const ITERATIONS = 120000
const KEY_LENGTH = 64
const DIGEST = 'sha512'

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const passwordHash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex')
  return { passwordHash, passwordSalt: salt }
}

export function verifyPassword(password, passwordHash, passwordSalt) {
  const inputHash = crypto.pbkdf2Sync(password, passwordSalt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex')
  return crypto.timingSafeEqual(Buffer.from(inputHash, 'hex'), Buffer.from(passwordHash, 'hex'))
}
