import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { products as fallbackProducts } from '../data/catalog'
import { shopApi } from '../services/shopApi'
import { createProductPath } from '../utils/slug'
import { useCart } from './useCart'
import { useCatalog } from './useCatalog'
import { useCustomer } from './useCustomer'
import { useNotice } from './useNotice'
import { useReviews } from './useReviews'

export function useShopState() {
  const navigate = useNavigate()
  const notice = useNotice()
  const customer = useCustomer(navigate, notice.setMessage)
  const catalog = useCatalog(fallbackProducts, navigate, notice.setMessage)
  const cartState = useCart(catalog.products, navigate, customer.user, notice.setMessage)
  const [order, setOrder] = useState(null)
  const [orders, setOrders] = useState([])
  const [showReviewLogin, setShowReviewLogin] = useState(false)
  const reviewsState = useReviews(customer.user, () => setShowReviewLogin(true), notice.setMessage)

  useEffect(() => {
    if (!customer.user) {
      setOrders([])
      return undefined
    }

    let isMounted = true

    async function loadOrders() {
      try {
        const data = await shopApi.listMyOrders()
        if (isMounted) {
          setOrders(data.orders)
        }
      } catch (error) {
        notice.setMessage(error.message)
      }
    }

    loadOrders()

    return () => {
      isMounted = false
    }
  }, [customer.user?.email, notice.setMessage])

  function goToProduct(productId) {
    const product = catalog.products.find((item) => item.id === productId)
    if (product) {
      navigate(createProductPath(product))
    }
  }

  async function submitCheckout(event) {
    event.preventDefault()
    if (cartState.cartLines.length === 0) return
    const formData = new FormData(event.currentTarget)

    try {
      const data = await shopApi.createOrder({
        customer: {
          name: formData.get('name'),
          email: formData.get('email'),
          address: formData.get('address'),
        },
        payment: formData.get('payment'),
        items: cartState.cart,
      })
      setOrder(data.order)
      setOrders((current) => [data.order, ...current.filter((item) => item.id !== data.order.id)])
      await cartState.clearCart()
      notice.setMessage(data.message)
      navigate('/payment')
    } catch (error) {
      notice.setMessage(error.message)
    }
  }

  async function submitContact(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    try {
      const data = await shopApi.sendContact({
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        topic: formData.get('topic'),
        message: formData.get('message'),
      })
      notice.setMessage(data.message)
      event.currentTarget.reset()
    } catch (error) {
      notice.setMessage(error.message)
    }
  }

  function goToLegacyPage(pageName) {
    const routes = {
      account: '/account',
      cart: '/cart',
      checkout: '/checkout',
      contact: '/contact',
      home: '/',
      login: '/login',
      register: '/register',
      shop: '/shop',
    }
    navigate(routes[pageName] || '/')
  }

  return {
    authMessage: notice.message,
    cart: cartState.cart,
    cartLines: cartState.cartLines,
    categories: catalog.categories,
    category: catalog.category,
    filteredProducts: catalog.filteredProducts,
    order,
    orders,
    products: catalog.products,
    query: catalog.query,
    reviews: reviewsState.reviews,
    shipping: cartState.shipping,
    showReviewLogin,
    sortOrder: catalog.sortOrder,
    subtotal: cartState.subtotal,
    total: cartState.total,
    user: customer.user,
    actions: {
      addToCart: cartState.addToCart,
      closeReviewLogin: () => setShowReviewLogin(false),
      dismissNotice: () => notice.setMessage(''),
      goToCategory: catalog.goToCategory,
      goToLegacyPage,
      goToProduct,
      handleAuth: customer.handleAuth,
      handleReviewLogin: (event) => customer.handleReviewLogin(event, () => setShowReviewLogin(false)),
      logout: customer.logout,
      navigate,
      openReviewLogin: () => setShowReviewLogin(true),
      removeFromCart: cartState.removeFromCart,
      setCategory: catalog.setCategory,
      setQuery: catalog.setQuery,
      setSortOrder: catalog.setSortOrder,
      submitCheckout,
      submitContact,
      submitProfile: customer.submitProfile,
      submitReview: reviewsState.submitReview,
      updateQuantity: cartState.updateQuantity,
    },
  }
}
