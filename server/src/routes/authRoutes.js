import { Router } from 'express'

import { forgotPassword, getProfile, login, register, resetPassword, updateProfile } from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password/:token', resetPassword)
router.post('/reset-password', resetPassword)
router.get('/me', requireAuth, getProfile)
router.put('/me', requireAuth, updateProfile)

export default router
