import { useSelector } from 'react-redux'

export function useShopDerivedState() {
  const authMessage = useSelector((state) => state.notice.message)
  const notices = useSelector((state) => state.notice.items)
  const cart = useSelector((state) => state.cart.items)
  const catalog = useSelector((state) => state.catalog)
  const contacts = useSelector((state) => state.contacts.history)
  const order = useSelector((state) => state.orders.current)
  const orders = useSelector((state) => state.orders.history)
  const reviews = useSelector((state) => state.reviews.items)
  const showReviewLogin = useSelector((state) => state.ui.showReviewLogin)
  const user = useSelector((state) => state.user.current)
  const userNotificationState = useSelector((state) => state.userNotifications)

  const filteredProducts = catalog.products
  const cartLines = cart
    .map((item) => ({
      ...item,
      product: catalog.productById[item.productId],
    }))
    .filter((item) => item.product)

  const subtotal = cartLines.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const shipping = subtotal > 1200000 || subtotal === 0 ? 0 : 35000
  const total = subtotal + shipping

  return {
    authMessage,
    cart,
    cartLines,
    catalog,
    contacts,
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
