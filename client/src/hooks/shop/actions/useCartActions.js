import { shopApi } from '../../../services/shopApi'
import { cartActions } from '../../../store/shopStore'

function getVisibleCartTarget() {
  const targets = [...document.querySelectorAll('[data-cart-target]')]
  return targets.find((target) => {
    const rect = target.getBoundingClientRect()
    return rect.width > 0 && rect.height > 0
  })
}

function animateProductToCart(sourceElement) {
  if (!sourceElement || typeof document === 'undefined') return

  const sourceContainer = sourceElement.closest('.product-card, .home-product-card, .detail-grid') || sourceElement
  const image = sourceContainer.querySelector('img')
  const sourceRect = (image || sourceElement).getBoundingClientRect()
  const target = getVisibleCartTarget()
  const targetRect = target?.getBoundingClientRect()
  const endX = targetRect ? targetRect.left + targetRect.width / 2 : window.innerWidth - 42
  const endY = targetRect ? targetRect.top + targetRect.height / 2 : 42

  const flyer = document.createElement('div')
  flyer.className = 'cart-flyer'
  flyer.style.left = `${sourceRect.left}px`
  flyer.style.top = `${sourceRect.top}px`
  flyer.style.width = `${Math.min(sourceRect.width, 120)}px`
  flyer.style.height = `${Math.min(sourceRect.height, 120)}px`

  if (image) {
    const clone = image.cloneNode()
    clone.alt = ''
    flyer.appendChild(clone)
  }

  document.body.appendChild(flyer)

  const startX = sourceRect.left + sourceRect.width / 2
  const startY = sourceRect.top + sourceRect.height / 2
  const deltaX = endX - startX
  const deltaY = endY - startY

  flyer.animate(
    [
      { transform: 'translate3d(0, 0, 0) scale(1)', opacity: 1 },
      { transform: `translate3d(${deltaX * 0.52}px, ${deltaY * 0.12 - 36}px, 0) scale(0.62)`, opacity: 0.9 },
      { transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(0.12)`, opacity: 0.05 },
    ],
    { duration: 720, easing: 'cubic-bezier(0.22, 0.9, 0.28, 1)' },
  ).addEventListener('finish', () => {
    flyer.remove()
    target?.classList.add('cart-target-pop')
    window.setTimeout(() => target?.classList.remove('cart-target-pop'), 360)
  })
}

export function useCartActions({ dispatch, navigate, setNotice, user }) {
  async function addToCart(productId, quantity = 1, sourceElement = null) {
    animateProductToCart(sourceElement)
    dispatch(cartActions.addCartItem({ productId, quantity }))

    if (user) {
      try {
        const data = await shopApi.addCartItem({ productId, quantity })
        dispatch(cartActions.setCart(data.cart))
      } catch (error) {
        setNotice(error.message)
      }
    }
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
