import { useMemo } from 'react'
import type { NavigateFunction } from 'react-router-dom'

import { useAuthActions } from './actions/useAuthActions'
import { useCartActions } from './actions/useCartActions'
import { useCatalogActions } from './actions/useCatalogActions'
import { useCheckoutActions } from './actions/useCheckoutActions'
import { useContactActions } from './actions/useContactActions'
import { useNotificationActions } from './actions/useNotificationActions'
import { useReviewActions } from './actions/useReviewActions'
import { noticeActions } from '../../store/shopStore'
import type { AppDispatch, RootState } from '../../store/shopStore'
import type { CartItem, CartLine, Notice, SetNoticeFn, User } from '../../types/shop'
import { emitAccountTarget } from '../../utils/notificationTarget'

export function useShopActions({
  cart,
  cartLines,
  catalog,
  dispatch,
  navigate,
  setNotice,
  user,
}: {
  cart: CartItem[]
  cartLines: CartLine[]
  catalog: RootState['catalog']
  dispatch: AppDispatch
  navigate: NavigateFunction
  setNotice: SetNoticeFn
  user: User | null
}) {
  const authActions = useAuthActions({ dispatch, navigate, setNotice })
  const cartActions = useCartActions({ dispatch, navigate, setNotice, user })
  const catalogActions = useCatalogActions({ catalog, dispatch, navigate })
  const contactActions = useContactActions({ setNotice, user })
  const notificationActions = useNotificationActions({ dispatch, navigate, setNotice })
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
      ...notificationActions,
      ...reviewActions,
      dismissNotice: (noticeId: string) => dispatch(noticeActions.dismissNotice(noticeId)),
      openNotice: (notice: Notice) => {
        if (notice?.actionPath) {
          navigate(notice.actionPath)
          emitAccountTarget(notice.actionPath)
        }
        dispatch(noticeActions.dismissNotice(notice?.id))
      },
      navigate,
    }),
    [
      authActions,
      cartActions,
      catalogActions,
      checkoutActions,
      contactActions,
      dispatch,
      navigate,
      notificationActions,
      reviewActions,
      setNotice,
    ],
  )
}
