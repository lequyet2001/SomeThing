import { Router } from 'express'

import {
  createAdminProduct,
  deleteAdminProduct,
  getAdminSummary,
  listAdminProducts,
  listAdminContacts,
  listAdminOrders,
  listAdminUsers,
  updateAdminProduct,
  updateContactStatus,
  updateOrderStatus,
  updateUserRole,
  uploadProductImage,
} from '../controllers/adminController.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'

const router = Router()

router.use('/admin', requireAuth, requireAdmin)
router.get('/admin/summary', getAdminSummary)
router.get('/admin/orders', listAdminOrders)
router.patch('/admin/orders/:orderCode/status', updateOrderStatus)
router.get('/admin/contacts', listAdminContacts)
router.patch('/admin/contacts/:contactId/status', updateContactStatus)
router.get('/admin/users', listAdminUsers)
router.patch('/admin/users/:userId/role', updateUserRole)
router.get('/admin/products', listAdminProducts)
router.post('/admin/uploads/product-image', uploadProductImage)
router.post('/admin/products', createAdminProduct)
router.patch('/admin/products/:productId', updateAdminProduct)
router.delete('/admin/products/:productId', deleteAdminProduct)

export default router
