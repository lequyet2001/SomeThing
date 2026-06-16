const API_URL = import.meta.env.VITE_API_URL || '/api/shop'
const TOKEN_KEY = 'marseille04_token'
const USER_KEY = 'marseille04_user'
let passwordPublicKeyPromise = null
let profileCache = null
let profileCacheTime = 0
let profileCacheToken = ''
let profileRequestPromise = null
let profileRequestToken = ''
const PROFILE_CACHE_MS = 15000

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
  profileCache = { user }
  profileCacheToken = token
  profileCacheTime = Date.now()
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  profileCache = null
  profileCacheTime = 0
  profileCacheToken = ''
  profileRequestPromise = null
  profileRequestToken = ''
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

export function createAdminEventStream(onEvent) {
  const token = getToken()
  if (!token || typeof EventSource === 'undefined') return null

  const url = new URL(`${API_URL}/admin/events/stream`, window.location.origin)
  url.searchParams.set('token', token)

  const source = new EventSource(url.toString())
  source.addEventListener('admin-event', (event) => {
    const data = JSON.parse(event.data)
    onEvent(data)
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

async function getProfile() {
  const token = getToken()
  if (!token) {
    throw new Error('Bạn cần đăng nhập.')
  }

  const now = Date.now()
  if (profileCache && profileCacheToken === token && now - profileCacheTime < PROFILE_CACHE_MS) {
    return profileCache
  }

  if (!profileRequestPromise || profileRequestToken !== token) {
    profileRequestToken = token
    profileRequestPromise = request('/me')
      .then((data) => {
        if (getToken() === token) {
          profileCache = data
          profileCacheToken = token
          profileCacheTime = Date.now()
        }
        return data
      })
      .finally(() => {
        if (profileRequestToken === token) {
          profileRequestPromise = null
          profileRequestToken = ''
        }
      })
  }

  return profileRequestPromise
}

function base64ToArrayBuffer(value) {
  const binary = window.atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes.buffer
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return window.btoa(binary)
}

function pemToArrayBuffer(pem) {
  const base64 = String(pem || '')
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\s+/g, '')
  return base64ToArrayBuffer(base64)
}

async function getPasswordPublicKey() {
  if (!passwordPublicKeyPromise) {
    passwordPublicKeyPromise = fetch(`${API_URL}/password-public-key`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok || !data.publicKey) {
          throw new Error(data.message || 'Không lấy được khóa mã hóa mật khẩu.')
        }
        return window.crypto.subtle.importKey(
          'spki',
          pemToArrayBuffer(data.publicKey),
          { hash: 'SHA-256', name: 'RSA-OAEP' },
          false,
          ['encrypt'],
        )
      })
      .catch((error) => {
        passwordPublicKeyPromise = null
        throw error
      })
  }

  return passwordPublicKeyPromise
}

async function encryptPasswordForServer(password) {
  if (!window.crypto?.subtle) {
    throw new Error('Trình duyệt không hỗ trợ mã hóa mật khẩu.')
  }

  const publicKey = await getPasswordPublicKey()
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    new TextEncoder().encode(String(password || '')),
  )

  return arrayBufferToBase64(encrypted)
}

async function encryptPasswordPayload(payload) {
  const { password, ...rest } = payload
  return {
    ...rest,
    passwordEncrypted: await encryptPasswordForServer(password),
  }
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
  createAdminCategory: (payload) => request('/admin/categories', { method: 'POST', body: JSON.stringify(payload) }),
  createAdminProduct: (payload) => request('/admin/products', { method: 'POST', body: JSON.stringify(payload) }),
  createOrder: (payload) => request('/orders', { method: 'POST', body: JSON.stringify(payload) }),
  createReview: (payload) => request('/reviews', { method: 'POST', body: JSON.stringify(payload) }),
  getAdminSummary: (params = {}) => request(`/admin/summary${toQueryString(params)}`),
  getCart: () => request('/cart'),
  listNotifications: () => request('/notifications'),
  getProfile,
  getProduct: (productId) => request(`/products/${productId}`),
  listAdminCategories: () => request('/admin/categories'),
  listAdminContacts: (params = {}) => request(`/admin/contacts${toQueryString(params)}`),
  listAdminCustomers: (params = {}) => request(`/admin/customers${toQueryString(params)}`),
  listAdminInventoryHistory: (params = {}) => request(`/admin/inventory-history${toQueryString(params)}`),
  listAdminOrders: (params = {}) => request(`/admin/orders${toQueryString(params)}`),
  listAdminProducts: (params = {}) => request(`/admin/products${toQueryString(params)}`),
  listAdminReviews: (params = {}) => request(`/admin/reviews${toQueryString(params)}`),
  listAdminUsers: (params = {}) => request(`/admin/users${toQueryString(params)}`),
  listMyContacts: () => request('/contacts/me'),
  listMyOrders: () => request('/orders/me'),
  listProducts: (params = {}) => request(`/products${toQueryString(params)}`),
  listReviews: (params = {}) => request(`/reviews${toQueryString(params)}`),
  login: async (payload) =>
    request('/login', { method: 'POST', body: JSON.stringify(await encryptPasswordPayload(payload)) }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PATCH' }),
  markNotificationRead: (notificationId) => request(`/notifications/${notificationId}/read`, { method: 'PATCH' }),
  register: async (payload) =>
    request('/register', { method: 'POST', body: JSON.stringify(await encryptPasswordPayload(payload)) }),
  removeCartItem: (productId) => request(`/cart/items/${productId}`, { method: 'DELETE' }),
  deleteAdminCategory: (categoryName) =>
    request(`/admin/categories/${encodeURIComponent(categoryName)}`, { method: 'DELETE' }),
  deleteAdminProduct: (productId) => request(`/admin/products/${productId}`, { method: 'DELETE' }),
  deleteAdminReview: (reviewId) => request(`/admin/reviews/${reviewId}`, { method: 'DELETE' }),
  deleteNotification: (notificationId) => request(`/notifications/${notificationId}`, { method: 'DELETE' }),
  forgotPassword: (payload) => request('/forgot-password', { method: 'POST', body: JSON.stringify(payload) }),
  sendContact: (payload) => request('/contact', { method: 'POST', body: JSON.stringify(payload) }),
  resetPassword: async (token, payload) =>
    request(`/reset-password/${encodeURIComponent(token)}`, {
      method: 'POST',
      body: JSON.stringify(await encryptPasswordPayload(payload)),
    }),
  updateCartItem: (productId, quantity) =>
    request(`/cart/items/${productId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
  updateContactStatus: (contactId, status) =>
    request(`/admin/contacts/${contactId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateOrderStatus: (orderCode, status) =>
    request(`/admin/orders/${orderCode}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateAdminCategory: (categoryName, payload) =>
    request(`/admin/categories/${encodeURIComponent(categoryName)}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  updateAdminProduct: (productId, payload) =>
    request(`/admin/products/${productId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  updateProfile: async (payload) => {
    const data = await request('/me', { method: 'PUT', body: JSON.stringify(payload) })
    profileCache = { user: data.user }
    profileCacheToken = getToken()
    profileCacheTime = Date.now()
    return data
  },
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
