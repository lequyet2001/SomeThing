import { useEffect, useRef } from 'react'

import { clearAuth, createNotificationStream, getToken, saveStoredUser, shopApi } from '../../services/shopApi'
import {
  cartActions,
  catalogActions,
  contactsActions,
  ordersActions,
  reviewsActions,
  userNotificationActions,
  userActions,
} from '../../store/shopStore'
import type { AppDispatch, RootState } from '../../store/shopStore'
import type { CartItem, EntityId, SetNoticeFn, User, UserNotification } from '../../types/shop'
import { getErrorMessage } from '../../utils/errorMessage'
import { buildNotificationTargetPath } from '../../utils/notificationTarget'
import { getProductIdFromPathSlug } from '../../utils/slug'

const activeOrderStatuses = ['confirmed', 'paid', 'shipping']
const productPathPrefix = '/products-'

interface ProductLoadParams {
  category: string
  isShopPath: boolean
  page: number
  pageSize: number
  query: string
  sortOrder: string
}

function getProductIdFromProductPath(pathname: string) {
  if (!pathname.startsWith(productPathPrefix)) return null

  return getProductIdFromPathSlug(decodeURIComponent(pathname.slice(productPathPrefix.length)))
}

export function useShopEffects({
  cart,
  catalog,
  currentPath,
  dispatch,
  setNotice,
  user,
}: {
  cart: CartItem[]
  catalog: RootState['catalog']
  currentPath: string
  dispatch: AppDispatch
  setNotice: SetNoticeFn
  user: User | null
}) {
  const productQueryKeyRef = useRef('')
  const productRequestIdRef = useRef(0)
  const productAbortRef = useRef<AbortController | null>(null)
  const syncedUserEmailRef = useRef<string | null>(null)
  const shownUserNotificationIdsRef = useRef(new Set<EntityId>())

  function showUserNotificationToast(notification?: UserNotification) {
    if (!notification || shownUserNotificationIdsRef.current.has(notification.id)) return

    shownUserNotificationIdsRef.current.add(notification.id)
    setNotice({
      actionLabel: 'Xem thông báo',
      actionPath: buildNotificationTargetPath(notification),
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
        const storedUser = saveStoredUser(data.user)
        if (!storedUser) throw new Error('Phiên đăng nhập không hợp lệ.')
        dispatch(userActions.setUser(storedUser))
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
    const shouldLoadCatalog = currentPath === '/' || currentPath === '/shop'
    if (!shouldLoadCatalog) {
      productAbortRef.current?.abort()
      productAbortRef.current = null
      productQueryKeyRef.current = ''
      dispatch(catalogActions.setCatalogLoading(false))
      return undefined
    }

    let isMounted = true

    async function loadProducts(loadParams: ProductLoadParams, options: { force?: boolean } = {}) {
      const requestParams = loadParams.isShopPath
        ? {
            category: loadParams.category,
            limit: loadParams.pageSize,
            page: loadParams.page,
            query: loadParams.query,
            sort: loadParams.sortOrder,
          }
        : {}
      const requestKey = loadParams.isShopPath ? JSON.stringify(requestParams) : 'default-products'

      if (!options.force && productQueryKeyRef.current === requestKey) return

      productQueryKeyRef.current = requestKey
      const requestId = productRequestIdRef.current + 1
      productRequestIdRef.current = requestId
      productAbortRef.current?.abort()
      const abortController = new AbortController()
      productAbortRef.current = abortController
      dispatch(catalogActions.setCatalogLoading(true))
      try {
        const data = await shopApi.listProducts(requestParams, { signal: abortController.signal })
        if (!isMounted || requestId !== productRequestIdRef.current) return
        dispatch(catalogActions.setCatalog(data))
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return
        if (isMounted && requestId === productRequestIdRef.current) {
          if (productQueryKeyRef.current === requestKey) {
            productQueryKeyRef.current = ''
          }
          dispatch(catalogActions.setCatalogLoading(false))
          setNotice(`Không tải được sản phẩm từ API: ${getErrorMessage(error)}`)
        }
      } finally {
        if (productAbortRef.current === abortController) {
          productAbortRef.current = null
        }
      }
    }

    const loadParams = {
      category: catalog.category,
      isShopPath: currentPath === '/shop',
      page: catalog.page,
      pageSize: catalog.pageSize,
      query: catalog.query,
      sortOrder: catalog.sortOrder,
    }
    const timer = window.setTimeout(() => loadProducts(loadParams), loadParams.query ? 300 : 0)
    const handleCatalogChanged = () => loadProducts(loadParams, { force: true })
    window.addEventListener('marseille04:catalog-changed', handleCatalogChanged)

    return () => {
      isMounted = false
      productAbortRef.current?.abort()
      window.clearTimeout(timer)
      window.removeEventListener('marseille04:catalog-changed', handleCatalogChanged)
    }
  }, [
    catalog.category,
    catalog.page,
    catalog.pageSize,
    catalog.query,
    catalog.sortOrder,
    currentPath,
    dispatch,
    setNotice,
  ])

  useEffect(() => {
    const reviewProductId = getProductIdFromProductPath(currentPath)
    if (!reviewProductId) {
      dispatch(reviewsActions.clearReviews())
      return undefined
    }

    let isMounted = true

    async function loadReviews() {
      dispatch(reviewsActions.setReviewsLoading(true))
      try {
        const data = await shopApi.listReviews({ productId: reviewProductId })
        if (isMounted) {
          dispatch(reviewsActions.setReviews(data.reviews))
        }
      } catch (error) {
        setNotice(`Không tải được đánh giá từ API: ${getErrorMessage(error)}`)
        if (isMounted) {
          dispatch(reviewsActions.setReviewsLoading(false))
        }
      }
    }

    loadReviews()
    window.addEventListener('marseille04:reviews-changed', loadReviews)

    return () => {
      isMounted = false
      window.removeEventListener('marseille04:reviews-changed', loadReviews)
    }
  }, [currentPath, dispatch, setNotice])

  useEffect(() => {
    if (!user) {
      dispatch(ordersActions.clearOrders())
      return undefined
    }

    let isMounted = true
    const activeUser = user

    async function loadOrders() {
      dispatch(ordersActions.setOrdersLoading(true))
      try {
        const data = await shopApi.listMyOrders()
        if (isMounted) {
          dispatch(ordersActions.setOrders(data.orders))
          const activeOrders = data.orders.filter((order) => activeOrderStatuses.includes(order.status))
          if (activeOrders.length > 0) {
            setNotice({
              actionLabel: 'Xem lịch sử mua hàng',
              actionPath: '/account?focus=orders',
              dedupeKey: `active-orders-${activeUser.email}`,
              duration: 6500,
              message: `Bạn có ${activeOrders.length} đơn hàng đang được xử lý.`,
              title: 'Đơn hàng của bạn',
              type: 'info',
            })
          }
        }
      } catch (error) {
        setNotice(getErrorMessage(error))
        if (isMounted) {
          dispatch(ordersActions.setOrdersLoading(false))
        }
      }
    }

    loadOrders()
    window.addEventListener('marseille04:orders-changed', loadOrders)

    return () => {
      isMounted = false
      window.removeEventListener('marseille04:orders-changed', loadOrders)
    }
  }, [dispatch, setNotice, user?.email])

  useEffect(() => {
    if (!user) {
      dispatch(contactsActions.clearContacts())
      return undefined
    }

    let isMounted = true

    async function loadContacts() {
      dispatch(contactsActions.setContactsLoading(true))
      try {
        const data = await shopApi.listMyContacts()
        if (isMounted) {
          dispatch(contactsActions.setContacts(data.contacts))
        }
      } catch (error) {
        setNotice(`Không tải được yêu cầu hỗ trợ: ${getErrorMessage(error)}`)
        if (isMounted) {
          dispatch(contactsActions.setContactsLoading(false))
        }
      }
    }

    loadContacts()
    window.addEventListener('marseille04:contacts-changed', loadContacts)

    return () => {
      isMounted = false
      window.removeEventListener('marseille04:contacts-changed', loadContacts)
    }
  }, [dispatch, setNotice, user?.email])

  useEffect(() => {
    if (!user) {
      shownUserNotificationIdsRef.current.clear()
      dispatch(userNotificationActions.clearUserNotifications())
      return undefined
    }

    let isMounted = true

    async function loadNotifications({ showToast = false }: { showToast?: boolean } = {}) {
      try {
        const data = await shopApi.listNotifications()
        if (!isMounted) return

        dispatch(userNotificationActions.setUserNotifications(data))

        if (showToast) {
          const unreadNotification = data.notifications.find((notification) => !notification.isRead)
          showUserNotificationToast(unreadNotification)
        }
      } catch (error) {
        setNotice(`Không tải được thông báo: ${getErrorMessage(error)}`)
      }
    }

    loadNotifications({ showToast: true })
    const notificationStream = createNotificationStream((payload) => {
      if (!isMounted) return
      dispatch(userNotificationActions.receiveUserNotification(payload))
      if (payload.notification?.type === 'order') {
        window.dispatchEvent(new Event('marseille04:orders-changed'))
      }
      if (payload.notification?.type === 'contact') {
        window.dispatchEvent(new Event('marseille04:contacts-changed'))
      }
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
          dispatch(catalogActions.upsertProducts((data.cartLines || []).map((line) => line.product)))
        }
      } catch (error) {
        setNotice(`Không đồng bộ được giỏ hàng: ${getErrorMessage(error)}`)
      }
    }

    syncCart()

    return () => {
      isMounted = false
    }
  }, [dispatch, setNotice, user?.email])
}
