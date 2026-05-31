const API_URL = import.meta.env.VITE_API_URL || '/api/shop'
const TOKEN_KEY = 'marseille04_token'
const USER_KEY = 'marseille04_user'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser() {
  const user = localStorage.getItem(USER_KEY)
  return user ? JSON.parse(user) : null
}

export function saveAuth({ token, user }) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function createNotificationStream(onNotification) {
  const token = getToken()
  if (!token || typeof EventSource === 'undefined') return null

  const url = new URL(`${API_URL}/notifications/stream`, window.location.origin)
  url.searchParams.set('token', token)

  const source = new EventSource(url.toString())
  source.addEventListener('notification', (event) => {
    const data = JSON.parse(event.data)
    onNotification(data)
  })

  return source
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Không thể kết nối API.')
  }

  return data
}

function toQueryString(params) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value)
    }
  })
  const queryString = query.toString()
  return queryString ? `?${queryString}` : ''
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(reader.result))
    reader.addEventListener('error', () => reject(new Error('Không đọc được file ảnh.')))
    reader.readAsDataURL(file)
  })
}

export const shopApi = {
  addCartItem: (payload) => request('/cart/items', { method: 'POST', body: JSON.stringify(payload) }),
  clearCart: () => request('/cart', { method: 'DELETE' }),
  createAdminProduct: (payload) => request('/admin/products', { method: 'POST', body: JSON.stringify(payload) }),
  createOrder: (payload) => request('/orders', { method: 'POST', body: JSON.stringify(payload) }),
  createReview: (payload) => request('/reviews', { method: 'POST', body: JSON.stringify(payload) }),
  getAdminSummary: (params = {}) => request(`/admin/summary${toQueryString(params)}`),
  getCart: () => request('/cart'),
  listNotifications: () => request('/notifications'),
  getProfile: () => request('/me'),
  listAdminContacts: () => request('/admin/contacts'),
  listAdminOrders: () => request('/admin/orders'),
  listAdminProducts: () => request('/admin/products'),
  listAdminReviews: () => request('/admin/reviews'),
  listAdminUsers: () => request('/admin/users'),
  listMyContacts: () => request('/contacts/me'),
  listMyOrders: () => request('/orders/me'),
  listProducts: (params = {}) => request(`/products${toQueryString(params)}`),
  listReviews: (params = {}) => request(`/reviews${toQueryString(params)}`),
  login: (payload) => request('/login', { method: 'POST', body: JSON.stringify(payload) }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PATCH' }),
  markNotificationRead: (notificationId) => request(`/notifications/${notificationId}/read`, { method: 'PATCH' }),
  register: (payload) => request('/register', { method: 'POST', body: JSON.stringify(payload) }),
  removeCartItem: (productId) => request(`/cart/items/${productId}`, { method: 'DELETE' }),
  deleteAdminProduct: (productId) => request(`/admin/products/${productId}`, { method: 'DELETE' }),
  deleteAdminReview: (reviewId) => request(`/admin/reviews/${reviewId}`, { method: 'DELETE' }),
  deleteNotification: (notificationId) => request(`/notifications/${notificationId}`, { method: 'DELETE' }),
  forgotPassword: (payload) => request('/forgot-password', { method: 'POST', body: JSON.stringify(payload) }),
  sendContact: (payload) => request('/contact', { method: 'POST', body: JSON.stringify(payload) }),
  resetPassword: (token, payload) =>
    request(`/reset-password/${encodeURIComponent(token)}`, { method: 'POST', body: JSON.stringify(payload) }),
  updateCartItem: (productId, quantity) =>
    request(`/cart/items/${productId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
  updateContactStatus: (contactId, status) =>
    request(`/admin/contacts/${contactId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateOrderStatus: (orderCode, status) =>
    request(`/admin/orders/${orderCode}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateAdminProduct: (productId, payload) =>
    request(`/admin/products/${productId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  updateProfile: (payload) => request('/me', { method: 'PUT', body: JSON.stringify(payload) }),
  updateUserRole: (userId, role) =>
    request(`/admin/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  uploadProductImage: async (file) =>
    request('/admin/uploads/product-image', {
      method: 'POST',
      body: JSON.stringify({
        dataUrl: await readFileAsDataUrl(file),
        fileName: file.name,
        mimeType: file.type,
      }),
    }),
}
