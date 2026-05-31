import { UserNotification } from '../models/UserNotification.js'
import { User } from '../models/User.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { httpError } from '../utils/httpError.js'
import { verifyToken } from '../utils/token.js'

const notificationClients = new Map()

function serializeNotification(notification) {
  return {
    id: notification._id.toString(),
    type: notification.type,
    title: notification.title,
    message: notification.message,
    link: notification.link || '',
    metadata: notification.metadata || {},
    isRead: Boolean(notification.readAt),
    readAt: notification.readAt,
    createdAt: notification.createdAt,
  }
}

function addNotificationClient(userId, res) {
  const key = userId.toString()
  const clients = notificationClients.get(key) || new Set()
  clients.add(res)
  notificationClients.set(key, clients)

  return () => {
    clients.delete(res)
    if (clients.size === 0) {
      notificationClients.delete(key)
    }
  }
}

function sendNotificationEvent(userId, payload) {
  const clients = notificationClients.get(userId.toString())
  if (!clients) return

  const data = `event: notification\ndata: ${JSON.stringify(payload)}\n\n`
  clients.forEach((client) => client.write(data))
}

export async function createUserNotification({ user, type = 'system', title, message, link = '', metadata = {} }) {
  if (!user || !title || !message) return null

  const notification = await UserNotification.create({
    user,
    type,
    title,
    message,
    link,
    metadata,
  })
  const unreadCount = await UserNotification.countDocuments({ user, readAt: null })

  sendNotificationEvent(user, {
    notification: serializeNotification(notification),
    unreadCount,
  })

  return notification
}

export const listMyNotifications = asyncHandler(async (req, res) => {
  const [notifications, unreadCount] = await Promise.all([
    UserNotification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(40),
    UserNotification.countDocuments({ user: req.user._id, readAt: null }),
  ])

  res.json({
    notifications: notifications.map(serializeNotification),
    unreadCount,
  })
})

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await UserNotification.findOneAndUpdate(
    { _id: req.params.notificationId, user: req.user._id },
    { $set: { readAt: new Date() } },
    { returnDocument: 'after' },
  )

  if (!notification) {
    throw httpError(404, 'Không tìm thấy thông báo.')
  }

  const unreadCount = await UserNotification.countDocuments({ user: req.user._id, readAt: null })

  res.json({
    notification: serializeNotification(notification),
    unreadCount,
  })
})

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await UserNotification.updateMany(
    { user: req.user._id, readAt: null },
    { $set: { readAt: new Date() } },
  )

  const notifications = await UserNotification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(40)

  res.json({
    message: 'Đã đánh dấu tất cả thông báo là đã đọc.',
    notifications: notifications.map(serializeNotification),
    unreadCount: 0,
  })
})

export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await UserNotification.findOneAndDelete({
    _id: req.params.notificationId,
    user: req.user._id,
  })

  if (!notification) {
    throw httpError(404, 'Không tìm thấy thông báo.')
  }

  const unreadCount = await UserNotification.countDocuments({ user: req.user._id, readAt: null })

  res.json({
    message: 'Đã xóa thông báo.',
    notificationId: notification._id.toString(),
    unreadCount,
  })
})

export const streamMyNotifications = asyncHandler(async (req, res) => {
  const token = String(req.query.token || '').trim()
  const payload = verifyToken(token)
  if (!payload?.sub) {
    throw httpError(401, 'Cần đăng nhập để nhận thông báo realtime.')
  }

  const user = await User.findById(payload.sub)
  if (!user) {
    throw httpError(401, 'Cần đăng nhập để nhận thông báo realtime.')
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()

  const removeClient = addNotificationClient(user._id, res)
  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`)

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n')
  }, 25000)

  req.on('close', () => {
    clearInterval(heartbeat)
    removeClient()
  })
})
