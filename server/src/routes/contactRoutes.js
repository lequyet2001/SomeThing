import { Router } from 'express'

import { createContactMessage } from '../controllers/contactController.js'
import { optionalAuth } from '../middleware/auth.js'

const router = Router()

router.post('/contact', optionalAuth, createContactMessage)

export default router
