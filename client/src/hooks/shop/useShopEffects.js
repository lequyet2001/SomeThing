import { useEffect, useRef } from 'react'

import { clearAuth, getToken, shopApi } from '../../services/shopApi'
import {
  cartActions,
  catalogActions,
  ordersActions,
  reviewsActions,
  userActions,
} from '../../store/shopStore'

export function useShopEffects({ cart, dispatch, setNotice, user }) {
  const syncedUserEmailRef = useRef(null)

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
