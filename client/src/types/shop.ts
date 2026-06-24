import type { ChangeEvent, Dispatch, FormEvent, KeyboardEvent, ReactNode, RefObject, SetStateAction } from 'react'
import type { ColumnDef } from '../components/ui/DataTable'

export type EntityId = string | number

export type LanguageCode = 'en' | 'vi'
export type TranslationValues = Record<string, string | number>
export type TranslateFn = (key: string, params?: TranslationValues) => string

export type AdminSectionId = 'overview' | 'orders' | 'products' | 'customers' | 'users' | 'contacts' | 'reviews'
export type AuthMode = 'login' | 'register'
export type InventoryTabId = 'items' | 'categories' | 'history'
export type NoticeType = 'success' | 'error' | 'info' | ''
export type StockStatus = 'healthy' | 'low' | 'out'

export interface ShippingAddress {
  id: string
  label?: string
  recipient?: string
  phone?: string
  address: string
}

export interface User {
  id: EntityId
  name: string
  email: string
  role?: 'customer' | 'admin' | string
  phone?: string
  address?: string
  avatar?: string
  selectedAddressId?: string
  shippingAddresses?: ShippingAddress[]
  createdAt?: string
}

export interface AdminCustomer extends User {
  itemCount?: number
  latestOrderAt?: string
  orderCount?: number
  totalSpent?: number
}

export interface Product {
  id: EntityId
  name: string
  category: string
  price: number
  stock: number
  image: string
  description: string
  rating?: number
  images?: string[]
}

export interface TopCategory {
  category: string
  quantity: number
}

export interface CartItem {
  productId: EntityId
  quantity: number
}

export interface CartLine extends CartItem {
  product: Product
}

export interface OrderItem {
  productId?: EntityId
  productName?: string
  product?: Product
  name: string
  image: string
  price: number
  quantity: number
}

export interface OrderCustomer {
  id?: EntityId
  name: string
  email: string
  phone?: string
  address?: string
}

export interface Order {
  id: EntityId
  status: string
  statusLabel?: string
  payment: string
  subtotal?: number
  shipping?: number
  total: number
  items?: OrderItem[]
  createdAt?: string
  updatedAt?: string
  customer?: OrderCustomer
  customerType?: 'registered' | 'guest' | string
  registeredUserId?: EntityId
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  address?: string
}

export interface ContactRequest {
  id: EntityId
  name?: string
  email?: string
  phone?: string
  topic: string
  message: string
  status?: string
  createdAt?: string
}

export interface Review {
  id: EntityId
  productId: EntityId
  name: string
  rating: number
  comment: string
  images?: string[]
  createdAt?: string
  productName?: string
  productImage?: string
  userEmail?: string
}

export interface Category {
  id?: EntityId
  name: string
  createdAt?: string
}

export interface InventoryLogActor {
  name?: string
  email?: string
}

export interface InventoryLog {
  id: EntityId
  action: string
  delta?: number
  entityType?: 'product' | 'category' | string
  productId?: EntityId
  productImage?: string
  productName?: string
  productCategory?: string
  categoryName?: string
  previousStock?: number | null
  newStock?: number | null
  orderCode?: string
  actor?: InventoryLogActor
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  changes?: InventoryChange[]
  createdAt?: string
}

export interface InventoryChange {
  field: string
  previousValue?: unknown
  newValue?: unknown
}

export interface ProductGalleryPreview {
  name: string
  url: string
  saved?: boolean
}

export interface InventoryProductFormValues {
  name: string
  category: string
  price: string | number
  stock: string | number
  image: string
  images: string[]
  description: string
}

export interface InventoryMetrics {
  healthy: number
  low: number
  out: number
  skus: number
  units: number
  value: number
}

export interface InventoryFilters {
  products: {
    query: string
    category: string
    stock: string
    minPrice: string
    maxPrice: string
  }
  history: {
    query: string
    action: string
    startDate: string
    endDate: string
  }
}

export interface StatsFilters {
  mode: 'month' | 'range'
  month: string
  startDate: string
  endDate: string
}

export interface AdminFilters {
  contacts: { endDate: string; query: string; startDate: string; status: string }
  lowStock: { category: string; query: string }
  orders: {
    customerType: string
    dateField: string
    endDate: string
    maxTotal: string
    minTotal: string
    payment: string
    query: string
    startDate: string
    status: string
  }
  reviews: { endDate: string; hasImages: string; query: string; rating: string; startDate: string }
  users: { address: string; query: string; role: string }
}

export interface StatusStat {
  status: string
  count: number
}

export interface Pagination {
  hasNextPage: boolean
  hasPrevPage: boolean
  limit: number
  page: number
  total: number
  totalPages: number
}

export interface AdminPagination {
  hasMore: boolean
  limit: number
  page: number
  total: number
  totalPages: number
}

export interface SummaryStats {
  pendingOrderCount?: number
  newContactCount?: number
  revenue?: number
  orderCount?: number
  averageOrder?: number
  adminCount?: number
  userCount?: number
  productCount?: number
  lowStockCount?: number
  contactStats?: Array<{ status: string; count: number }>
  [key: string]: unknown
}

export interface RevenueStat extends Record<string, unknown> {
  count: number
  month: string
  revenue: number
}

export interface ProductSalesStat extends Record<string, unknown> {
  id?: EntityId
  name: string
  productId?: EntityId
  quantity: number
  revenue: number
}

export interface CustomerSalesStat extends Record<string, unknown> {
  email: string
  itemCount: number
  name: string
  orderCount: number
  totalSpent: number
}

export interface SummaryData {
  summary?: SummaryStats
  period?: {
    hasFilter?: boolean
    label?: string
  }
  lowStockProducts?: Product[]
  monthlyRevenue?: RevenueStat[]
  topProducts?: ProductSalesStat[]
  leastProducts?: ProductSalesStat[]
  topCustomers?: CustomerSalesStat[]
}

export interface AdminToastMessage {
  message: string
  title?: string
  type: NoticeType
}

export interface Notice {
  id: string
  actionLabel?: string
  actionPath?: string
  dedupeKey?: string
  duration?: number
  message: string
  title?: string
  type?: NoticeType
}

export type NoticeInput = string | Partial<Notice> | null | undefined
export type SetNoticeFn = (notice: NoticeInput) => void

export interface AdminAlert {
  id: string
  target: 'orders' | 'contacts'
  count: number
}

export interface UserNotification {
  id: EntityId
  type?: 'order' | 'contact' | string
  title?: string
  message: string
  link?: string
  metadata?: Record<string, string | number | undefined>
  isRead?: boolean
  readAt?: string
  createdAt?: string
}

export interface AuthFormValues {
  email: string
  password: string
  name?: string
}

export interface CheckoutFormValues {
  name: string
  email: string
  phone?: string
  address: string
  payment: string
  selectedAddressId?: string
}

export interface ContactFormValues {
  name?: string
  email?: string
  phone?: string
  topic: string
  message: string
}

export interface ReviewFormValues {
  comment: string
  images?: FileList | File[] | undefined
}

export interface FormErrors {
  [field: string]: string
}

export interface AdminFilterPanelProps {
  children: ReactNode
  className?: string
  clearLabel: string
  onClear: () => void
  title: string
}

export interface AdminSearchInputProps {
  onChange: (value: string) => void
  placeholder: string
  value: string
}

export interface AdminToastProps {
  closeLabel: string
  onClose: () => void
  onOpen?: () => void
  toast: AdminToastMessage
}

export interface InventoryAdminSectionProps {
  activeTab?: InventoryTabId
  onNavStatsChange?: Dispatch<SetStateAction<{ categoryCount: number; historyCount: number }>>
  reloadKey?: number
  setActiveTab?: Dispatch<SetStateAction<InventoryTabId>>
  showAdminToast: (message: string, type?: NoticeType) => void
}

export interface InventoryItemsTabProps {
  filters: InventoryFilters
  filteredProducts: Product[]
  focusedProductId?: EntityId | string
  inventoryColumns: Array<ColumnDef<Product, unknown>>
  isLoading?: boolean
  onAddProduct: () => void
  productCategories: string[]
  products: Product[]
  resetFilter: (group: keyof InventoryFilters) => void
  t: TranslateFn
  updateFilter: (group: keyof InventoryFilters, field: string, value: string) => void
}

export interface InventoryOverviewPanelProps {
  filteredProducts: Product[]
  inventoryHealthPercent: number
  inventoryMetrics: InventoryMetrics
  inventoryRiskCount: number
  onAddProduct: () => void
  products: Product[]
  t: TranslateFn
}

export interface InventoryCategoriesTabProps {
  isLoading?: boolean
  isCategorySaving: boolean
  onCreateCategory: (name: string) => Promise<boolean>
  onDeleteCategory: Dispatch<SetStateAction<CategoryRow | null>>
  onRenameCategory: (categoryName: string, nextName: string) => Promise<boolean>
  productCategories: string[]
  products: Product[]
  t: TranslateFn
}

export interface CategoryRow {
  name: string
  productCount: number
  stock: number
  value: number
}

export interface InventoryProductFormProps {
  editingProductId: EntityId | null
  handleProductImageChange: (event: ChangeEvent<HTMLInputElement>) => void
  handleProductGalleryChange: (event: ChangeEvent<HTMLInputElement>) => void
  handleProductSubmit: (event: FormEvent<HTMLFormElement>) => void
  isDialog?: boolean
  isProductImageUploading: boolean
  isProductSaving: boolean
  onClose: () => void
  onRemoveProductGalleryImage: (imageUrl: string) => void
  productCategories: string[]
  productForm: InventoryProductFormValues
  productFormErrors?: FormErrors
  productFormPanelRef: RefObject<HTMLElement | null>
  productGalleryPreviews: ProductGalleryPreview[]
  productImageFile: File | null
  productImagePreview: string
  resetProductForm: (options?: { closeDialog?: boolean }) => void
  setProductForm: Dispatch<SetStateAction<InventoryProductFormValues>>
  t: TranslateFn
}

export type InventoryHistoryKeyHandler = (event: KeyboardEvent<HTMLElement>, log: InventoryLog) => void
