import { shopApi } from '../../../services/shopApi'
import { ordersActions } from '../../../store/shopStore'

export function useCheckoutActions({ cart, cartLines, clearCart, dispatch, navigate, setNotice }) {
  async function submitCheckout(event) {
    event.preventDefault()
    if (cartLines.length === 0) return
    const formData = new FormData(event.currentTarget)

    try {
      const data = await shopApi.createOrder({
        customer: {
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          address: formData.get('address'),
        },
        payment: formData.get('payment'),
        items: cart,
      })
      dispatch(ordersActions.setCurrentOrder(data.order))
      dispatch(ordersActions.prependOrder(data.order))
      await clearCart()
      setNotice(data.message)
      window.dispatchEvent(new Event('marseille04:catalog-changed'))
      navigate('/payment')
    } catch (error) {
      setNotice(error.message)
    }
  }

  return { submitCheckout }
}
