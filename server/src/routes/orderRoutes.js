import { Router } from 'express'

import { createOrder, getOrderByCode, listMyOrders } from '../controllers/orderController.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/orders', optionalAuth, createOrder)
router.get('/orders/me', requireAuth, listMyOrders)
router.get('/orders/:orderCode', optionalAuth, getOrderByCode)

export default router
