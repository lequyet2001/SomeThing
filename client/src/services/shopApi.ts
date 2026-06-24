import type {
  AdminCustomer,
  AdminPagination,
  AuthFormValues,
  CartItem,
  Category,
  CheckoutFormValues,
  ContactFormValues,
  ContactRequest,
  EntityId,
  InventoryLog,
  Order,
  Product,
  Pagination,
  Review,
  ShippingAddress,
  SummaryData,
  TopCategory,
  User,
  UserNotification,
} from '../types/shop'

const API_URL = import.meta.env.VITE_API_URL || '/api/shop'
const TOKEN_KEY = 'marseille04_token'
const USER_KEY = 'marseille04_user'
let passwordPublicKeyPromise: Promise<CryptoKey> | null = null
let profileCache: ProfileResponse | null = null
let profileCacheTime = 0
let profileCacheToken = ''
let profileRequestPromise: Promise<ProfileResponse> | null = null
let profileRequestToken = ''
const PROFILE_CACHE_MS = 15000

type QueryParams = Record<string, string | number | boolean | null | undefined>
type RequestOptions = RequestInit & { headers?: HeadersInit }
type ApiObject = Record<string, unknown>
type PasswordPayload = { password: string }
type PasswordEncryptedPayload<T extends PasswordPayload> = Omit<T, 'password'> & { passwordEncrypted: string }

interface AuthResponse {
  message: string
  token: string
  user: User
}

interface ProfileResponse {
  message?: string
  user: User
}

interface CatalogResponse {
  categories?: string[]
  pagination?: Pagination
  products: Product[]
  topCategories?: TopCategory[]
}

interface CartResponse {
  cart: CartItem[]
  cartLines?: Array<CartItem & { product: Product }>
}

interface NotificationListResponse {
  message?: string
  notifications: UserNotification[]
  unreadCount: number
}

interface NotificationStreamPayload {
  notification?: UserNotification
  unreadCount?: number
}

interface AdminEventPayload {
  type?: string
  summary?: SummaryData
}

interface UploadResponse {
  url: string
}

interface InventoryMutationResponse {
  categories?: Category[]
  inventoryLog?: InventoryLog
  message: string
  product: Product
  products?: Product[]
}

interface CreateOrderPayload {
  customer: {
    address: string
    email: string
    name: string
    phone?: string
  }
  items?: CartItem[]
  payment: string
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isStoredUser(value: unknown): value is User {
  return isRecord(value) && typeof value.email === 'string'
}

export function saveStoredUser(user: unknown): User | null {
  if (!isStoredUser(user)) {
    localStorage.removeItem(USER_KEY)
    return null
  }

  localStorage.setItem(USER_KEY, JSON.stringify(user))
  return user
}

export function getStoredUser(): User | null {
  const user = localStorage.getItem(USER_KEY)
  if (!user || user === 'undefined' || user === 'null') {
    localStorage.removeItem(USER_KEY)
    return null
  }

  try {
    const parsedUser = JSON.parse(user) as unknown
    return saveStoredUser(parsedUser)
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}

export function saveAuth({ token, user }: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, token)
  const storedUser = saveStoredUser(user)
  if (!storedUser) {
    throw new Error('API trả về thông tin đăng nhập không hợp lệ.')
  }

  profileCache = { user: storedUser }
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

export function createNotificationStream(onNotification: (payload: NotificationStreamPayload) => void) {
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

export function createAdminEventStream(onEvent: (payload: AdminEventPayload) => void) {
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

async function request<T = ApiObject>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  const data = await response.json().catch(() => ({})) as T & { message?: string }
  if (!response.ok) {
    throw new Error(data.message || 'Không thể kết nối API.')
  }

  return data
}

async function getProfile(): Promise<ProfileResponse> {
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
    profileRequestPromise = request<ProfileResponse>('/me')
      .then((data) => {
        const storedUser = saveStoredUser(data.user)
        if (!storedUser) {
          throw new Error('Phiên đăng nhập không hợp lệ.')
        }

        const profileData = { ...data, user: storedUser }
        if (getToken() === token) {
          profileCache = profileData
          profileCacheToken = token
          profileCacheTime = Date.now()
        }
        return profileData
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

function base64ToArrayBuffer(value: string) {
  const binary = window.atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes.buffer
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return window.btoa(binary)
}

function pemToArrayBuffer(pem: string) {
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

async function encryptPasswordForServer(password: string) {
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

async function encryptPasswordPayload<T extends PasswordPayload>(payload: T): Promise<PasswordEncryptedPayload<T>> {
  const { password, ...rest } = payload
  return {
    ...rest,
    passwordEncrypted: await encryptPasswordForServer(password),
  }
}

function toQueryString(params: QueryParams) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value))
    }
  })
  const queryString = query.toString()
  return queryString ? `?${queryString}` : ''
}

function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(String(reader.result || '')))
    reader.addEventListener('error', () => reject(new Error('Không đọc được file ảnh.')))
    reader.readAsDataURL(file)
  })
}

export const shopApi = {
  addCartItem: (payload: CartItem) => request<CartResponse>('/cart/items', { method: 'POST', body: JSON.stringify(payload) }),
  clearCart: () => request<ApiObject>('/cart', { method: 'DELETE' }),
  createAdminCategory: (payload: { name: string }) => request<InventoryMutationResponse>('/admin/categories', { method: 'POST', body: JSON.stringify(payload) }),
  createAdminProduct: (payload: Omit<Product, 'id'> & { id?: EntityId }) => request<InventoryMutationResponse>('/admin/products', { method: 'POST', body: JSON.stringify(payload) }),
  createOrder: (payload: CreateOrderPayload) => request<{ message: string; order: Order }>('/orders', { method: 'POST', body: JSON.stringify(payload) }),
  createReview: (payload: { comment: string; images: string[]; productId: EntityId; rating: number }) =>
    request<{ message: string; review: Review }>('/reviews', { method: 'POST', body: JSON.stringify(payload) }),
  getAdminSummary: (params: QueryParams = {}) => request<SummaryData>(`/admin/summary${toQueryString(params)}`),
  getCart: () => request<CartResponse>('/cart'),
  listNotifications: () => request<NotificationListResponse>('/notifications'),
  getProfile,
  getProduct: (productId: EntityId) => request<{ product: Product }>(`/products/${productId}`),
  listAdminCategories: () => request<{ categories: Category[] }>('/admin/categories'),
  listAdminContacts: (params: QueryParams = {}) => request<{ contacts: ContactRequest[] }>(`/admin/contacts${toQueryString(params)}`),
  listAdminCustomers: (params: QueryParams = {}) => request<{ customers: AdminCustomer[]; pagination?: AdminPagination }>(`/admin/customers${toQueryString(params)}`),
  listAdminInventoryHistory: (params: QueryParams = {}) => request<{ history: InventoryLog[] }>(`/admin/inventory-history${toQueryString(params)}`),
  listAdminOrders: (params: QueryParams = {}) => request<{ orders: Order[]; pagination?: AdminPagination }>(`/admin/orders${toQueryString(params)}`),
  listAdminProducts: (params: QueryParams = {}) => request<{ products: Product[] }>(`/admin/products${toQueryString(params)}`),
  listAdminReviews: (params: QueryParams = {}) => request<{ reviews: Review[] }>(`/admin/reviews${toQueryString(params)}`),
  listAdminUsers: (params: QueryParams = {}) => request<{ users: User[] }>(`/admin/users${toQueryString(params)}`),
  listMyContacts: () => request<{ contacts: ContactRequest[] }>('/contacts/me'),
  listMyOrders: () => request<{ orders: Order[] }>('/orders/me'),
  listProducts: (params: QueryParams = {}, options: RequestOptions = {}) => request<CatalogResponse>(`/products${toQueryString(params)}`, options),
  listReviews: (params: QueryParams = {}) => request<{ reviews: Review[] }>(`/reviews${toQueryString(params)}`),
  login: async (payload: AuthFormValues) =>
    request<AuthResponse>('/login', { method: 'POST', body: JSON.stringify(await encryptPasswordPayload(payload)) }),
  markAllNotificationsRead: () => request<NotificationListResponse>('/notifications/read-all', { method: 'PATCH' }),
  markNotificationRead: (notificationId: EntityId) => request<NotificationListResponse>(`/notifications/${notificationId}/read`, { method: 'PATCH' }),
  register: async (payload: AuthFormValues) =>
    request<AuthResponse>('/register', { method: 'POST', body: JSON.stringify(await encryptPasswordPayload(payload)) }),
  removeCartItem: (productId: EntityId) => request<CartResponse>(`/cart/items/${productId}`, { method: 'DELETE' }),
  deleteAdminCategory: (categoryName: string) =>
    request<InventoryMutationResponse>(`/admin/categories/${encodeURIComponent(categoryName)}`, { method: 'DELETE' }),
  deleteAdminProduct: (productId: EntityId) => request<InventoryMutationResponse>(`/admin/products/${productId}`, { method: 'DELETE' }),
  deleteAdminReview: (reviewId: EntityId) => request<{ message: string }>(`/admin/reviews/${reviewId}`, { method: 'DELETE' }),
  deleteNotification: (notificationId: EntityId) => request<NotificationListResponse>(`/notifications/${notificationId}`, { method: 'DELETE' }),
  forgotPassword: (payload: Pick<AuthFormValues, 'email'>) => request<{ message: string }>('/forgot-password', { method: 'POST', body: JSON.stringify(payload) }),
  sendContact: (payload: ContactFormValues) => request<{ contact: ContactRequest; message: string }>('/contact', { method: 'POST', body: JSON.stringify(payload) }),
  resetPassword: async (token: string, payload: PasswordPayload) =>
    request<{ message: string }>(`/reset-password/${encodeURIComponent(token)}`, {
      method: 'POST',
      body: JSON.stringify(await encryptPasswordPayload(payload)),
    }),
  updateCartItem: (productId: EntityId, quantity: number) =>
    request<CartResponse>(`/cart/items/${productId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
  updateContactStatus: (contactId: EntityId, status: string) =>
    request<{ contact: ContactRequest; message: string }>(`/admin/contacts/${contactId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateOrderStatus: (orderCode: EntityId, status: string) =>
    request<{ message: string; order: Order }>(`/admin/orders/${orderCode}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateAdminCategory: (categoryName: string, payload: { name: string }) =>
    request<InventoryMutationResponse>(`/admin/categories/${encodeURIComponent(categoryName)}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  updateAdminProduct: (productId: EntityId, payload: Partial<Product> & { source?: string }) =>
    request<InventoryMutationResponse>(`/admin/products/${productId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  updateProfile: async (payload: Partial<User> & { avatar?: string; selectedAddressId?: string; shippingAddresses?: ShippingAddress[] }) => {
    const data = await request<ProfileResponse>('/me', { method: 'PUT', body: JSON.stringify(payload) })
    const storedUser = saveStoredUser(data.user)
    if (!storedUser) {
      throw new Error('API trả về thông tin người dùng không hợp lệ.')
    }

    profileCache = { user: storedUser }
    profileCacheToken = getToken() || ''
    profileCacheTime = Date.now()
    return { ...data, user: storedUser }
  },
  updateUserRole: (userId: EntityId, role: string) =>
    request<{ message: string; user: User }>(`/admin/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  uploadProductImage: async (file: File) =>
    request<UploadResponse>('/admin/uploads/product-image', {
      method: 'POST',
      body: JSON.stringify({
        dataUrl: await readFileAsDataUrl(file),
        fileName: file.name,
        mimeType: file.type,
      }),
    }),
}
