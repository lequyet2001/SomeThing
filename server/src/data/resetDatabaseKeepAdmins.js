import mongoose from 'mongoose'

import { ADMIN_EMAIL } from '../config/env.js'
import { connectDatabase } from '../config/database.js'
import { Cart } from '../models/Cart.js'
import { Category } from '../models/Category.js'
import { ContactMessage } from '../models/ContactMessage.js'
import { InventoryLog } from '../models/InventoryLog.js'
import { Order } from '../models/Order.js'
import { Product } from '../models/Product.js'
import { Review } from '../models/Review.js'
import { User } from '../models/User.js'
import { UserNotification } from '../models/UserNotification.js'
import { hashPassword } from '../utils/password.js'
import { seedDatabase } from './seedDatabase.js'

async function ensureAdminUsers() {
  const envAdminEmail = ADMIN_EMAIL.toLowerCase()
  const envAdmin = await User.findOne({ email: envAdminEmail })
  if (envAdmin && envAdmin.role !== 'admin') {
    envAdmin.role = 'admin'
    await envAdmin.save()
  }

  let admins = await User.find({
    $or: [
      { role: 'admin' },
      { email: envAdminEmail },
    ],
  })

  if (admins.length === 0) {
    const { passwordHash, passwordSalt } = hashPassword('123456')
    const createdAdmin = await User.create({
      address: '24 phố Lý Thường Kiệt, Hoàn Kiếm, Hà Nội',
      email: envAdminEmail,
      name: 'Admin Test',
      passwordHash,
      passwordSalt,
      phone: '0901000001',
      role: 'admin',
      selectedAddressId: 'admin-home',
      shippingAddresses: [
        {
          id: 'admin-home',
          label: 'Nhà riêng',
          recipient: 'Admin Test',
          phone: '0901000001',
          address: '24 phố Lý Thường Kiệt, Hoàn Kiếm, Hà Nội',
        },
      ],
    })
    admins = [createdAdmin]
  }

  return admins
}

async function resetDatabaseKeepAdmins() {
  await connectDatabase()

  const admins = await ensureAdminUsers()
  const adminIds = admins.map((admin) => admin._id)

  await Promise.all([
    Cart.deleteMany({}),
    Category.deleteMany({}),
    ContactMessage.deleteMany({}),
    InventoryLog.deleteMany({}),
    Order.deleteMany({}),
    Product.deleteMany({}),
    Review.deleteMany({}),
    UserNotification.deleteMany({}),
  ])
  await User.deleteMany({ _id: { $nin: adminIds } })

  await seedDatabase({
    includeAdminSeedUsers: false,
    updateExisting: true,
  })

  const [
    userCount,
    adminCount,
    productCount,
    categoryCount,
    orderCount,
    reviewCount,
    contactCount,
    cartCount,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'admin' }),
    Product.countDocuments(),
    Category.countDocuments(),
    Order.countDocuments(),
    Review.countDocuments(),
    ContactMessage.countDocuments(),
    Cart.countDocuments(),
  ])

  console.log('Database reset completed.')
  console.log(`Admins kept: ${adminCount}`)
  console.log(`Users: ${userCount}`)
  console.log(`Products: ${productCount}`)
  console.log(`Categories: ${categoryCount}`)
  console.log(`Orders: ${orderCount}`)
  console.log(`Reviews: ${reviewCount}`)
  console.log(`Contacts: ${contactCount}`)
  console.log(`Carts: ${cartCount}`)
}

resetDatabaseKeepAdmins()
  .then(async () => {
    await mongoose.disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await mongoose.disconnect().catch(() => {})
    process.exit(1)
  })
