import type { NavigateFunction } from 'react-router-dom'

import { shopApi } from '../../../services/shopApi'
import { userNotificationActions } from '../../../store/shopStore'
import type { AppDispatch } from '../../../store/shopStore'
import type { EntityId, SetNoticeFn, UserNotification } from '../../../types/shop'
import { getErrorMessage } from '../../../utils/errorMessage'
import { buildNotificationTargetPath, emitAccountTarget } from '../../../utils/notificationTarget'

export function useNotificationActions({
  dispatch,
  navigate,
  setNotice,
}: {
  dispatch: AppDispatch
  navigate: NavigateFunction
  setNotice: SetNoticeFn
}) {
  async function openUserNotification(notification: UserNotification) {
    if (!notification) return

    if (!notification.isRead) {
      dispatch(userNotificationActions.markNotificationRead(notification.id))
      try {
        await shopApi.markNotificationRead(notification.id)
      } catch (error) {
        setNotice(getErrorMessage(error))
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
      setNotice(getErrorMessage(error))
    }
  }

  async function deleteUserNotification(notificationId: EntityId) {
    dispatch(userNotificationActions.deleteNotification(notificationId))
    try {
      await shopApi.deleteNotification(notificationId)
    } catch (error) {
      setNotice(getErrorMessage(error))
    }
  }

  return {
    deleteUserNotification,
    markAllUserNotificationsRead,
    openUserNotification,
  }
}
