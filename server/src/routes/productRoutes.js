import { Router } from 'express'

import { getCategories, getProduct, listProducts } from '../controllers/productController.js'

const router = Router()

router.get('/categories', getCategories)
router.get('/products', listProducts)
router.get('/products/:productId', getProduct)

export default router
