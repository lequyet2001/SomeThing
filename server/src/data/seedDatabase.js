import { ADMIN_EMAIL } from '../config/env.js'
import { Cart } from '../models/Cart.js'
import { ContactMessage } from '../models/ContactMessage.js'
import { Order } from '../models/Order.js'
import { Product } from '../models/Product.js'
import { Review } from '../models/Review.js'
import { User } from '../models/User.js'
import { hashPassword } from '../utils/password.js'
import { seedCarts, seedContacts, seedOrderTemplates, seedProducts, seedReviews, seedUsers } from './seedData.js'

const SHIPPING_FEE = 30000

function daysAgoToDate(daysAgo) {
  const date = new Date()
  date.setHours(9, 0, 0, 0)
  date.setDate(date.getDate() - daysAgo)
  return date
}

function buildMaps(items, key) {
  return new Map(items.map((item) => [item[key], item]))
}

export async function seedDatabase() {
  await Promise.all(
    seedProducts.map((product) =>
      Product.updateOne({ legacyId: product.legacyId }, { $setOnInsert: product }, { upsert: true }),
    ),
  )

  const createdUsers = []
  for (const userData of seedUsers) {
    const email = userData.email.toLowerCase()
    const existingUser = await User.findOne({ email })

    if (existingUser) {
      if ((email === ADMIN_EMAIL || userData.role === 'admin') && existingUser.role !== 'admin') {
        existingUser.role = 'admin'
        await existingUser.save()
      }
      createdUsers.push(existingUser)
      continue
    }

    const { passwordHash, passwordSalt } = hashPassword(userData.password)
    const user = await User.create({
      name: userData.name,
      email,
      passwordHash,
      passwordSalt,
      phone: userData.phone,
      address: userData.address,
      role: email === ADMIN_EMAIL ? 'admin' : userData.role,
    })
    createdUsers.push(user)
  }

  const products = await Product.find({ legacyId: { $in: seedProducts.map((product) => product.legacyId) } })
  const usersByEmail = buildMaps(createdUsers, 'email')
  const productsByLegacyId = buildMaps(products, 'legacyId')

  await Promise.all(
    seedReviews.map((review) =>
      Review.updateOne(
        { productId: review.productId, name: review.name, comment: review.comment },
        {
          $setOnInsert: {
            productId: review.productId,
            user: usersByEmail.get(review.userEmail)?._id,
            name: review.name,
            rating: review.rating,
            comment: review.comment,
          },
        },
        { upsert: true },
      ),
    ),
  )

  await Promise.all(
    seedCarts
      .filter((cart) => usersByEmail.has(cart.userEmail))
      .map((cart) =>
        Cart.updateOne(
          { user: usersByEmail.get(cart.userEmail)._id },
          { $set: { items: cart.items } },
          { upsert: true },
        ),
      ),
  )

  await Promise.all(
    seedContacts.map((contact) => {
      const createdAt = daysAgoToDate(contact.daysAgo)
      return ContactMessage.updateOne(
        { email: contact.email, topic: contact.topic, message: contact.message },
        {
          $setOnInsert: {
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            topic: contact.topic,
            message: contact.message,
            status: contact.status,
            createdAt,
            updatedAt: createdAt,
          },
        },
        { upsert: true, timestamps: false },
      )
    }),
  )

  await Promise.all(
    seedOrderTemplates.map((template) => {
      const user = usersByEmail.get(template.userEmail)
      const items = template.items.map((item) => {
        const product = productsByLegacyId.get(item.productId)
        return {
          productId: item.productId,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          image: product.image,
        }
      })
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const shipping = subtotal >= 1200000 ? 0 : SHIPPING_FEE
      const createdAt = daysAgoToDate(template.daysAgo)

      return Order.updateOne(
        { orderCode: template.orderCode },
        {
          $setOnInsert: {
            orderCode: template.orderCode,
            user: user?._id,
            customer: {
              name: user?.name || 'Khach hang test',
              email: user?.email || template.userEmail,
              phone: user?.phone || '',
              address: user?.address || 'Dia chi test',
            },
            items,
            payment: template.payment,
            status: template.status,
            subtotal,
            shipping,
            total: subtotal + shipping,
            createdAt,
            updatedAt: createdAt,
          },
        },
        { upsert: true, timestamps: false },
      )
    }),
  )
}
