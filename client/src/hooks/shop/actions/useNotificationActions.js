import { shopApi } from '../../../services/shopApi'
import { userNotificationActions } from '../../../store/shopStore'
import { buildNotificationTargetPath, emitAccountTarget } from '../../../utils/notificationTarget'

export function useNotificationActions({ dispatch, navigate, setNotice }) {
  async function openUserNotification(notification) {
    if (!notification) return

    if (!notification.isRead) {
      dispatch(userNotificationActions.markNotificationRead(notification.id))
      try {
        await shopApi.markNotificationRead(notification.id)
      } catch (error) {
        setNotice(error.message)
      }
    }

    const targetPath = buildNotificationTargetPath(notification)
    navigate(targetPath)
    emitAccountTarget(targetPath)
  }

  async function markAllUserNotificationsRead() {
    try {
      const data = await shopApi.markAllNotificationsRead()
      dispatch(userNotificationActions.setUserNotifications(data))
      setNotice({
        message: data.message,
        title: 'Thông báo',
        type: 'success',
      })
    } catch (error) {
      setNotice(error.message)
    }
  }

  async function deleteUserNotification(notificationId) {
    dispatch(userNotificationActions.deleteNotification(notificationId))
    try {
      await shopApi.deleteNotification(notificationId)
    } catch (error) {
      setNotice(error.message)
    }
  }

  return {
    deleteUserNotification,
    markAllUserNotificationsRead,
    openUserNotification,
  }
}
