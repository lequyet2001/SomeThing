import { Router } from 'express'

import {
  deleteNotification,
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  streamMyNotifications,
} from '../controllers/notificationController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/notifications', requireAuth, listMyNotifications)
router.get('/notifications/stream', streamMyNotifications)
router.patch('/notifications/read-all', requireAuth, markAllNotificationsRead)
router.patch('/notifications/:notificationId/read', requireAuth, markNotificationRead)
router.delete('/notifications/:notificationId', requireAuth, deleteNotification)

export default router
