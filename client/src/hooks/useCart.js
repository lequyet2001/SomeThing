import { useEffect, useMemo, useRef, useState } from 'react'

import { shopApi } from '../services/shopApi'

export function useCart(products, navigate, user, setNotice) {
  const [cart, setCart] = useState([])
  const syncedUserEmailRef = useRef(null)

  useEffect(() => {
    if (!user) return
    if (syncedUserEmailRef.current === user.email) return

    syncedUserEmailRef.current = user.email
    let isMounted = true

    async function syncCart() {
      try {
        for (const item of cart) {
          await shopApi.addCartItem(item)
        }
        const data = await shopApi.getCart()
        if (isMounted) {
          setCart(data.cart)
        }
      } catch (error) {
        setNotice?.(`Không đồng bộ được giỏ hàng: ${error.message}`)
      }
    }

    syncCart()

    return () => {
      isMounted = false
    }
  }, [user?.email])

  const cartLines = useMemo(
    () =>
      cart
        .map((item) => ({
          ...item,
          product: products.find((product) => product.id === item.productId),
        }))
        .filter((item) => item.product),
    [cart, products],
  )

  const subtotal = cartLines.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const shipping = subtotal > 1200000 || subtotal === 0 ? 0 : 35000
  const total = subtotal + shipping

  async function addToCart(productId, quantity = 1) {
    setCart((current) => {
      const existing = current.find((item) => item.productId === productId)
      if (existing) {
        return current.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + quantity } : item,
        )
      }
      return [...current, { productId, quantity }]
    })

    if (user) {
      try {
        const data = await shopApi.addCartItem({ productId, quantity })
        setCart(data.cart)
      } catch (error) {
        setNotice?.(error.message)
      }
    }

    navigate('/cart')
  }

  async function updateQuantity(productId, quantity) {
    if (quantity < 1) return
    setCart((current) => current.map((item) => (item.productId === productId ? { ...item, quantity } : item)))

    if (user) {
      try {
        const data = await shopApi.updateCartItem(productId, quantity)
        setCart(data.cart)
      } catch (error) {
        setNotice?.(error.message)
      }
    }
  }

  async function removeFromCart(productId) {
    setCart((current) => current.filter((item) => item.productId !== productId))

    if (user) {
      try {
        const data = await shopApi.removeCartItem(productId)
        setCart(data.cart)
      } catch (error) {
        setNotice?.(error.message)
      }
    }
  }

  async function clearCart() {
    setCart([])
    if (user) {
      try {
        await shopApi.clearCart()
      } catch (error) {
        setNotice?.(error.message)
      }
    }
  }

  return {
    addToCart,
    cart,
    cartLines,
    clearCart,
    removeFromCart,
    shipping,
    subtotal,
    total,
    updateQuantity,
  }
}
