import { useEffect, useRef } from 'react'

import { clearAuth, createNotificationStream, getToken, shopApi } from '../../services/shopApi'
import {
  cartActions,
  catalogActions,
  ordersActions,
  reviewsActions,
  userNotificationActions,
  userActions,
} from '../../store/shopStore'

const activeOrderStatuses = ['confirmed', 'paid', 'shipping']

export function useShopEffects({ cart, dispatch, setNotice, user }) {
  const syncedUserEmailRef = useRef(null)
  const shownUserNotificationIdsRef = useRef(new Set())

  function showUserNotificationToast(notification) {
    if (!notification || shownUserNotificationIdsRef.current.has(notification.id)) return

    shownUserNotificationIdsRef.current.add(notification.id)
    setNotice({
      actionLabel: 'Xem thông báo',
      actionPath: notification.link || '/account',
      dedupeKey: `user-notification-${notification.id}`,
      duration: 6500,
      message: notification.message,
      title: notification.title,
      type: 'info',
    })
  }

  useEffect(() => {
    if (!getToken()) return undefined

    let isMounted = true

    async function refreshProfile() {
      try {
        const data = await shopApi.getProfile()
        if (!isMounted) return
        localStorage.setItem('marseille04_user', JSON.stringify(data.user))
        dispatch(userActions.setUser(data.user))
      } catch {
        clearAuth()
        if (isMounted) {
          dispatch(userActions.clearUser())
        }
      }
    }

    refreshProfile()

    return () => {
      isMounted = false
    }
  }, [dispatch])

  useEffect(() => {
    let isMounted = true

    async function loadProducts() {
      try {
        const data = await shopApi.listProducts()
        if (!isMounted) return
        dispatch(catalogActions.setCatalog(data))
      } catch (error) {
        setNotice(`Không tải được sản phẩm từ API: ${error.message}`)
      }
    }

    loadProducts()
    window.addEventListener('marseille04:catalog-changed', loadProducts)

    return () => {
      isMounted = false
      window.removeEventListener('marseille04:catalog-changed', loadProducts)
    }
  }, [dispatch, setNotice])

  useEffect(() => {
    let isMounted = true

    async function loadReviews() {
      try {
        const data = await shopApi.listReviews()
        if (isMounted) {
          dispatch(reviewsActions.setReviews(data.reviews))
        }
      } catch (error) {
        setNotice(`Không tải được đánh giá từ API: ${error.message}`)
      }
    }

    loadReviews()
    window.addEventListener('marseille04:reviews-changed', loadReviews)

    return () => {
      isMounted = false
      window.removeEventListener('marseille04:reviews-changed', loadReviews)
    }
  }, [dispatch, setNotice])

  useEffect(() => {
    if (!user) {
      dispatch(ordersActions.setOrders([]))
      return undefined
    }

    let isMounted = true

    async function loadOrders() {
      try {
        const data = await shopApi.listMyOrders()
        if (isMounted) {
          dispatch(ordersActions.setOrders(data.orders))
          const activeOrders = data.orders.filter((order) => activeOrderStatuses.includes(order.status))
          if (activeOrders.length > 0) {
            setNotice({
              actionLabel: 'Xem lịch sử mua hàng',
              actionPath: '/account',
              dedupeKey: `active-orders-${user.email}`,
              duration: 6500,
              message: `Bạn có ${activeOrders.length} đơn hàng đang được xử lý.`,
              title: 'Đơn hàng của bạn',
              type: 'info',
            })
          }
        }
      } catch (error) {
        setNotice(error.message)
      }
    }

    loadOrders()

    return () => {
      isMounted = false
    }
  }, [dispatch, setNotice, user?.email])

  useEffect(() => {
    if (!user) {
      shownUserNotificationIdsRef.current.clear()
      dispatch(userNotificationActions.clearUserNotifications())
      return undefined
    }

    let isMounted = true

    async function loadNotifications({ showToast = false } = {}) {
      try {
        const data = await shopApi.listNotifications()
        if (!isMounted) return

        dispatch(userNotificationActions.setUserNotifications(data))

        if (showToast) {
          const unreadNotification = data.notifications.find((notification) => !notification.isRead)
          showUserNotificationToast(unreadNotification)
        }
      } catch (error) {
        setNotice(`Không tải được thông báo: ${error.message}`)
      }
    }

    loadNotifications({ showToast: true })
    const notificationStream = createNotificationStream((payload) => {
      if (!isMounted) return
      dispatch(userNotificationActions.receiveUserNotification(payload))
      showUserNotificationToast(payload.notification)
    })
    const refreshTimer = window.setInterval(() => loadNotifications({ showToast: true }), 60000)
    const handleFocus = () => loadNotifications({ showToast: true })
    window.addEventListener('focus', handleFocus)

    return () => {
      isMounted = false
      notificationStream?.close()
      window.clearInterval(refreshTimer)
      window.removeEventListener('focus', handleFocus)
    }
  }, [dispatch, setNotice, user?.email])

  useEffect(() => {
    if (!user) return undefined
    if (syncedUserEmailRef.current === user.email) return undefined

    syncedUserEmailRef.current = user.email
    let isMounted = true

    async function syncCart() {
      try {
        for (const item of cart) {
          await shopApi.addCartItem(item)
        }
        const data = await shopApi.getCart()
        if (isMounted) {
          dispatch(cartActions.setCart(data.cart))
        }
      } catch (error) {
        setNotice(`Không đồng bộ được giỏ hàng: ${error.message}`)
      }
    }

    syncCart()

    return () => {
      isMounted = false
    }
  }, [dispatch, setNotice, user?.email])
}
