import { Router } from 'express'

import { getProfile, login, register, updateProfile } from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', requireAuth, getProfile)
router.put('/me', requireAuth, updateProfile)

export default router
