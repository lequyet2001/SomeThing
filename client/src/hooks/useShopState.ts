import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'

import { noticeActions } from '../store/shopStore'
import type { AppDispatch } from '../store/shopStore'
import type { NoticeInput } from '../types/shop'
import { useShopActions } from './shop/useShopActions'
import { useShopDerivedState } from './shop/useShopDerivedState'
import { useShopEffects } from './shop/useShopEffects'

export function useShopState() {
  const dispatch = useDispatch<AppDispatch>()
  const location = useLocation()
  const navigate = useNavigate()
  const state = useShopDerivedState()

  const setNotice = useCallback(
    (message: NoticeInput) => {
      dispatch(noticeActions.setNotice(message))
    },
    [dispatch],
  )

  useShopEffects({
    cart: state.cart,
    catalog: state.catalog,
    currentPath: location.pathname,
    dispatch,
    setNotice,
    user: state.user,
  })

  const actions = useShopActions({
    cart: state.cart,
    cartLines: state.cartLines,
    catalog: state.catalog,
    dispatch,
    navigate,
    setNotice,
    user: state.user,
  })

  return {
    authMessage: state.authMessage,
    cart: state.cart,
    cartLines: state.cartLines,
    categories: state.catalog.categories,
    category: state.catalog.category,
    contacts: state.contacts,
    contactsHasLoaded: state.contactsHasLoaded,
    contactsLoading: state.contactsLoading,
    filteredProducts: state.filteredProducts,
    order: state.order,
    orders: state.orders,
    ordersHasLoaded: state.ordersHasLoaded,
    ordersLoading: state.ordersLoading,
    notices: state.notices,
    products: state.catalog.products,
    productPagination: state.catalog.pagination,
    isCatalogLoading: state.catalog.isLoading,
    query: state.catalog.query,
    reviews: state.reviews,
    reviewsHasLoaded: state.reviewsHasLoaded,
    reviewsLoading: state.reviewsLoading,
    shipping: state.shipping,
    showReviewLogin: state.showReviewLogin,
    sortOrder: state.catalog.sortOrder,
    subtotal: state.subtotal,
    topCategories: state.catalog.topCategories,
    total: state.total,
    user: state.user,
    userNotifications: state.userNotifications,
    unreadNotificationCount: state.unreadNotificationCount,
    actions,
  }
}
