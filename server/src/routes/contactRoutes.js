import { Router } from 'express'

import { createContactMessage, listMyContactMessages } from '../controllers/contactController.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/contacts/me', requireAuth, listMyContactMessages)
router.post('/contact', optionalAuth, createContactMessage)

export default router
