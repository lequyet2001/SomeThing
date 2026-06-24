import { useSelector } from 'react-redux'

import type { RootState } from '../../store/shopStore'

export function useShopDerivedState() {
  const authMessage = useSelector((state: RootState) => state.notice.message)
  const notices = useSelector((state: RootState) => state.notice.items)
  const cart = useSelector((state: RootState) => state.cart.items)
  const catalog = useSelector((state: RootState) => state.catalog)
  const contacts = useSelector((state: RootState) => state.contacts.history)
  const contactsState = useSelector((state: RootState) => state.contacts)
  const order = useSelector((state: RootState) => state.orders.current)
  const orders = useSelector((state: RootState) => state.orders.history)
  const ordersState = useSelector((state: RootState) => state.orders)
  const reviews = useSelector((state: RootState) => state.reviews.items)
  const reviewsState = useSelector((state: RootState) => state.reviews)
  const showReviewLogin = useSelector((state: RootState) => state.ui.showReviewLogin)
  const user = useSelector((state: RootState) => state.user.current)
  const userNotificationState = useSelector((state: RootState) => state.userNotifications)

  const filteredProducts = catalog.products
  const cartLines = cart
    .map((item) => ({
      ...item,
      product: catalog.productById[String(item.productId)],
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
    contactsHasLoaded: contactsState.hasLoaded,
    contactsLoading: contactsState.isLoading,
    filteredProducts,
    order,
    ordersHasLoaded: ordersState.hasLoaded,
    ordersLoading: ordersState.isLoading,
    orders,
    notices,
    reviews,
    reviewsHasLoaded: reviewsState.hasLoaded,
    reviewsLoading: reviewsState.isLoading,
    shipping,
    showReviewLogin,
    subtotal,
    total,
    user,
    userNotifications: userNotificationState.items,
    unreadNotificationCount: userNotificationState.unreadCount,
  }
}
