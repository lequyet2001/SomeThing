import mongoose from 'mongoose'

import { MONGODB_SERVER_SELECTION_TIMEOUT_MS, MONGODB_URI } from './env.js'

const DB_READY_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting']

export function getDatabaseStatus() {
  return DB_READY_STATES[mongoose.connection.readyState] || 'unknown'
}

export async function connectDatabase() {
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: MONGODB_SERVER_SELECTION_TIMEOUT_MS,
  })
  console.log(`MongoDB connected: ${mongoose.connection.name}`)
}
