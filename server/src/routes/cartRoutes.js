import { Router } from 'express'

import { addCartItem, clearCart, getCart, removeCartItem, updateCartItem } from '../controllers/cartController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.use('/cart', requireAuth)
router.get('/cart', getCart)
router.post('/cart/items', addCartItem)
router.patch('/cart/items/:productId', updateCartItem)
router.delete('/cart/items/:productId', removeCartItem)
router.delete('/cart', clearCart)

export default router
