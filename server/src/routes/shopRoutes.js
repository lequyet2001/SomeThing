import { Router } from 'express'

import adminRoutes from './adminRoutes.js'
import authRoutes from './authRoutes.js'
import cartRoutes from './cartRoutes.js'
import contactRoutes from './contactRoutes.js'
import orderRoutes from './orderRoutes.js'
import productRoutes from './productRoutes.js'
import reviewRoutes from './reviewRoutes.js'

const router = Router()

router.use(authRoutes)
router.use(adminRoutes)
router.use(productRoutes)
router.use(reviewRoutes)
router.use(cartRoutes)
router.use(orderRoutes)
router.use(contactRoutes)

export default router
