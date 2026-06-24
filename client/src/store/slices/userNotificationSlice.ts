import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

import type { EntityId, UserNotification } from '../../types/shop'

interface UserNotificationState {
  items: UserNotification[]
  unreadCount: number
}

interface UserNotificationPayload {
  notifications?: UserNotification[]
  notification?: UserNotification
  unreadCount?: number
}

const userNotificationSlice = createSlice({
  name: 'userNotifications',
  initialState: {
    items: [],
    unreadCount: 0,
  } as UserNotificationState,
  reducers: {
    clearUserNotifications(state) {
      state.items = []
      state.unreadCount = 0
    },
    setUserNotifications(state, action: PayloadAction<UserNotificationPayload>) {
      state.items = action.payload?.notifications || []
      state.unreadCount = action.payload?.unreadCount || 0
    },
    receiveUserNotification(state, action: PayloadAction<UserNotificationPayload>) {
      const notification = action.payload?.notification
      if (!notification) return

      state.items = [
        notification,
        ...state.items.filter((item) => item.id !== notification.id),
      ].slice(0, 40)
      state.unreadCount = action.payload?.unreadCount ?? state.items.filter((item) => !item.isRead).length
    },
    markNotificationRead(state, action: PayloadAction<EntityId>) {
      const notificationId = action.payload
      state.items = state.items.map((item) => (
        item.id === notificationId ? { ...item, isRead: true, readAt: item.readAt || new Date().toISOString() } : item
      ))
      state.unreadCount = state.items.filter((item) => !item.isRead).length
    },
    deleteNotification(state, action: PayloadAction<EntityId>) {
      const notificationId = action.payload
      state.items = state.items.filter((item) => item.id !== notificationId)
      state.unreadCount = state.items.filter((item) => !item.isRead).length
    },
    markAllNotificationsRead(state) {
      const now = new Date().toISOString()
      state.items = state.items.map((item) => ({ ...item, isRead: true, readAt: item.readAt || now }))
      state.unreadCount = 0
    },
  },
})

export const userNotificationActions = userNotificationSlice.actions
export const userNotificationReducer = userNotificationSlice.reducer
