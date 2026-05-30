import mongoose from 'mongoose'

import { connectDatabase } from '../config/database.js'
import { seedDatabase } from './seedDatabase.js'

try {
  await connectDatabase()
  await seedDatabase()
  console.log('Seed data ready.')
  await mongoose.disconnect()
} catch (error) {
  console.error('Seed failed:', error.message)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
}
