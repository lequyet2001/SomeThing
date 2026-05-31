import { useMemo } from 'react'
import { useSelector } from 'react-redux'

export function useShopDerivedState() {
  const authMessage = useSelector((state) => state.notice.message)
  const notices = useSelector((state) => state.notice.items)
  const cart = useSelector((state) => state.cart.items)
  const catalog = useSelector((state) => state.catalog)
  const order = useSelector((state) => state.orders.current)
  const orders = useSelector((state) => state.orders.history)
  const reviews = useSelector((state) => state.reviews.items)
  const showReviewLogin = useSelector((state) => state.ui.showReviewLogin)
  const user = useSelector((state) => state.user.current)
  const userNotificationState = useSelector((state) => state.userNotifications)

  const filteredProducts = useMemo(() => {
    const normalizedQuery = catalog.query.trim().toLowerCase()
    const filtered = catalog.products.filter((product) => {
      const matchesQuery =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.description.toLowerCase().includes(normalizedQuery)
      const matchesCategory = catalog.category === 'Tat ca' || product.category === catalog.category
      return matchesQuery && matchesCategory
    })

    if (catalog.sortOrder === 'price-asc') {
      return [...filtered].sort((firstProduct, secondProduct) => firstProduct.price - secondProduct.price)
    }

    if (catalog.sortOrder === 'price-desc') {
      return [...filtered].sort((firstProduct, secondProduct) => secondProduct.price - firstProduct.price)
    }

    return filtered
  }, [catalog.category, catalog.products, catalog.query, catalog.sortOrder])

  const cartLines = useMemo(
    () =>
      cart
        .map((item) => ({
          ...item,
          product: catalog.products.find((product) => product.id === item.productId),
        }))
        .filter((item) => item.product),
    [cart, catalog.products],
  )

  const subtotal = cartLines.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const shipping = subtotal > 1200000 || subtotal === 0 ? 0 : 35000
  const total = subtotal + shipping

  return {
    authMessage,
    cart,
    cartLines,
    catalog,
    filteredProducts,
    order,
    orders,
    notices,
    reviews,
    shipping,
    showReviewLogin,
    subtotal,
    total,
    user,
    userNotifications: userNotificationState.items,
    unreadNotificationCount: userNotificationState.unreadCount,
  }
}
