import path from 'node:path'
import { fileURLToPath } from 'node:url'

import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: path.resolve(__dirname, '../../.env.example') })
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true })

export const PORT = process.env.PORT || 3001
export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/marseille04_shop'
export const MONGODB_SERVER_SELECTION_TIMEOUT_MS =
  Number.parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || '5000', 10) || 5000
export const JWT_SECRET = process.env.JWT_SECRET || 'marseille04-dev-secret'
export const TOKEN_EXPIRES_IN_SECONDS =
  Number.parseInt(process.env.TOKEN_EXPIRES_IN_SECONDS || String(60 * 60 * 24 * 7), 10) || 60 * 60 * 24 * 7
export const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || 'admin@marseille04.vn').trim().toLowerCase()
