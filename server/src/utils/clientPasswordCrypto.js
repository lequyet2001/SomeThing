import { constants, generateKeyPairSync, privateDecrypt } from 'node:crypto'

import { httpError } from './httpError.js'

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    format: 'pem',
    type: 'spki',
  },
  privateKeyEncoding: {
    format: 'pem',
    type: 'pkcs8',
  },
})

export function getClientPasswordPublicKey() {
  return {
    algorithm: 'RSA-OAEP-256',
    publicKey,
  }
}

export function decryptClientPassword(encryptedPassword) {
  const value = String(encryptedPassword || '').trim()
  if (!value) return ''

  try {
    return privateDecrypt(
      {
        key: privateKey,
        oaepHash: 'sha256',
        padding: constants.RSA_PKCS1_OAEP_PADDING,
      },
      Buffer.from(value, 'base64'),
    ).toString('utf8')
  } catch {
    throw httpError(400, 'Mật khẩu mã hóa không hợp lệ hoặc đã hết hạn khóa.')
  }
}

export function readRequestPassword(body) {
  if (body?.passwordEncrypted) {
    return decryptClientPassword(body.passwordEncrypted)
  }

  return String(body?.password || '')
}
