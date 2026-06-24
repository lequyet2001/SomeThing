import type { NavigateFunction } from 'react-router-dom'

import { shopApi } from '../../../services/shopApi'
import { ordersActions } from '../../../store/shopStore'
import type { AppDispatch } from '../../../store/shopStore'
import type { CartItem, CartLine, CheckoutFormValues, SetNoticeFn } from '../../../types/shop'
import { getErrorMessage } from '../../../utils/errorMessage'

export function useCheckoutActions({
  cart,
  cartLines,
  clearCart,
  dispatch,
  navigate,
  setNotice,
}: {
  cart: CartItem[]
  cartLines: CartLine[]
  clearCart: () => Promise<void>
  dispatch: AppDispatch
  navigate: NavigateFunction
  setNotice: SetNoticeFn
}) {
  async function submitCheckout(values: CheckoutFormValues) {
    if (cartLines.length === 0) return

    try {
      const data = await shopApi.createOrder({
        customer: {
          name: values.name,
          email: values.email,
          phone: values.phone,
          address: values.address,
        },
        payment: values.payment,
        items: cart,
      })
      dispatch(ordersActions.setCurrentOrder(data.order))
      dispatch(ordersActions.prependOrder(data.order))
      await clearCart()
      setNotice(data.message)
      window.dispatchEvent(new Event('marseille04:catalog-changed'))
      navigate('/payment')
    } catch (error) {
      setNotice(getErrorMessage(error))
    }
  }

  return { submitCheckout }
}
