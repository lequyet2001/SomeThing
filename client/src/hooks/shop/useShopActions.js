import { useMemo } from 'react'

import { useAuthActions } from './actions/useAuthActions'
import { useCartActions } from './actions/useCartActions'
import { useCatalogActions } from './actions/useCatalogActions'
import { useCheckoutActions } from './actions/useCheckoutActions'
import { useContactActions } from './actions/useContactActions'
import { useReviewActions } from './actions/useReviewActions'

export function useShopActions({ cart, cartLines, catalog, dispatch, navigate, setNotice, user }) {
  const authActions = useAuthActions({ dispatch, navigate, setNotice })
  const cartActions = useCartActions({ dispatch, navigate, setNotice, user })
  const catalogActions = useCatalogActions({ catalog, dispatch, navigate })
  const contactActions = useContactActions({ setNotice })
  const reviewActions = useReviewActions({ dispatch, setNotice, user })
  const checkoutActions = useCheckoutActions({
    cart,
    cartLines,
    clearCart: cartActions.clearCart,
    dispatch,
    navigate,
    setNotice,
  })

  return useMemo(
    () => ({
      ...authActions,
      ...cartActions,
      ...catalogActions,
      ...checkoutActions,
      ...contactActions,
      ...reviewActions,
      dismissNotice: () => setNotice(''),
      navigate,
    }),
    [
      authActions,
      cartActions,
      catalogActions,
      checkoutActions,
      contactActions,
      navigate,
      reviewActions,
      setNotice,
    ],
  )
}
