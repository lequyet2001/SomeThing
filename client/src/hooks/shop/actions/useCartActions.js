import { shopApi } from '../../../services/shopApi'
import { cartActions } from '../../../store/shopStore'

export function useCartActions({ dispatch, navigate, setNotice, user }) {
  async function addToCart(productId, quantity = 1) {
    dispatch(cartActions.addCartItem({ productId, quantity }))

    if (user) {
      try {
        const data = await shopApi.addCartItem({ productId, quantity })
        dispatch(cartActions.setCart(data.cart))
      } catch (error) {
        setNotice(error.message)
      }
    }

    navigate('/cart')
  }

  async function updateQuantity(productId, quantity) {
    if (quantity < 1) return
    dispatch(cartActions.updateCartItem({ productId, quantity }))

    if (user) {
      try {
        const data = await shopApi.updateCartItem(productId, quantity)
        dispatch(cartActions.setCart(data.cart))
      } catch (error) {
        setNotice(error.message)
      }
    }
  }

  async function removeFromCart(productId) {
    dispatch(cartActions.removeCartItem(productId))

    if (user) {
      try {
        const data = await shopApi.removeCartItem(productId)
        dispatch(cartActions.setCart(data.cart))
      } catch (error) {
        setNotice(error.message)
      }
    }
  }

  async function clearCart() {
    dispatch(cartActions.clearCart())
    if (user) {
      try {
        await shopApi.clearCart()
      } catch (error) {
        setNotice(error.message)
      }
    }
  }

  return {
    addToCart,
    clearCart,
    removeFromCart,
    updateQuantity,
  }
}
