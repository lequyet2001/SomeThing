import path from 'node:path'
import { fileURLToPath } from 'node:url'

import express from 'express'
import cors from 'cors'

import { CLIENT_ORIGIN, PORT } from './config/env.js'
import { connectDatabase, getDatabaseStatus } from './config/database.js'
import { seedDatabase } from './data/seedDatabase.js'
import { errorHandler } from './middleware/errorHandler.js'
import shopRoutes from './routes/shopRoutes.js'

const app = express()
const MAX_COMPARE_ITEMS = 4
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = path.resolve(__dirname, '../uploads')

app.use(cors({ origin: CLIENT_ORIGIN }))
app.use(express.json({ limit: '12mb' }))
app.use('/uploads', express.static(uploadsDir))

app.get('/', (_req, res) => {
  res.json({
    name: 'marseille04-shop-api',
    status: 'ok',
    maxCompareItems: MAX_COMPARE_ITEMS,
    database: getDatabaseStatus(),
  })
})

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    database: getDatabaseStatus(),
  })
})

app.use('/api/shop', shopRoutes)
app.use(errorHandler)

async function startServer() {
  try {
    await connectDatabase()
    await seedDatabase()

    const server = app.listen(PORT, () => {
      console.log(`Shop API running at http://localhost:${PORT}`)
    })

    server.on('error', async (error) => {
      console.error('Failed to start server:', error.message)
      process.exit(1)
    })
  } catch (error) {
    console.error('Failed to start server:', error.message)
    process.exit(1)
  }
}

startServer()
