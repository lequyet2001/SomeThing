import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { noticeActions } from '../store/shopStore'
import { useShopActions } from './shop/useShopActions'
import { useShopDerivedState } from './shop/useShopDerivedState'
import { useShopEffects } from './shop/useShopEffects'

export function useShopState() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const state = useShopDerivedState()

  const setNotice = useCallback(
    (message) => {
      dispatch(noticeActions.setNotice(message))
    },
    [dispatch],
  )

  useShopEffects({
    cart: state.cart,
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
    filteredProducts: state.filteredProducts,
    order: state.order,
    orders: state.orders,
    products: state.catalog.products,
    query: state.catalog.query,
    reviews: state.reviews,
    shipping: state.shipping,
    showReviewLogin: state.showReviewLogin,
    sortOrder: state.catalog.sortOrder,
    subtotal: state.subtotal,
    topCategories: state.catalog.topCategories,
    total: state.total,
    user: state.user,
    actions,
  }
}
