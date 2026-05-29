import { Product } from '../models/Product.js'
import { Review } from '../models/Review.js'
import { seedProducts, seedReviews } from './seedData.js'

export async function seedDatabase() {
  await Promise.all(
    seedProducts.map((product) =>
      Product.updateOne({ legacyId: product.legacyId }, { $setOnInsert: product }, { upsert: true }),
    ),
  )

  const reviewCount = await Review.countDocuments()
  if (reviewCount === 0) {
    await Review.insertMany(seedReviews)
  }
}
