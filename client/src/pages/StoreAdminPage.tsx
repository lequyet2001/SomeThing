import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  ClipboardList,
  Inbox,
  MessageSquare,
  Eye,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Star,
  Trash2,
  Truck,
  UserCog,
  Users,
} from 'lucide-react'
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom'

import { useLanguage } from '../i18n/LanguageContext'
import AdminFilterPanel from '../components/admin/AdminFilterPanel'
import AdminImagePreview, { AdminImageMosaic } from '../components/admin/AdminImagePreview'
import AdminCustomersSection from './admin/AdminCustomersSection'
import AdminOrderDetailDialog from '../components/admin/AdminOrderDetailDialog'
import AdminOverviewSection from './admin/AdminOverviewSection'
import AdminSearchInput from '../components/admin/AdminSearchInput'
import AdminToast from '../components/admin/AdminToast'
import AppDialog from '../components/ui/AppDialog'
import DataTable, { type ColumnDef } from '../components/ui/DataTable'
import LazyViewport from '../components/ui/LazyViewport'
import InventoryAdminSection from './admin/InventoryAdminSection'
import InventoryTabsNav from './admin/inventory/InventoryTabsNav'
import {
  buildSummaryParams,
  contactStatusOptions,
  countStatuses,
  emptyAdminFilters,
  emptyStatsFilters,
  formatAdminDate,
  isWithinDateRange,
  isWithinNumberRange,
  matchesSearch,
  notifyCatalogChanged,
  notifyReviewsChanged,
  orderCustomerTypeOptions,
  orderStatusOptions,
  pendingContactStatuses,
  pendingOrderStatuses,
  revenueOrderStatuses,
} from './admin/adminUtils'
import { createAdminEventStream, shopApi } from '../services/shopApi'
import type {
  AdminAlert,
  AdminFilters,
  AdminSectionId,
  AdminToastMessage,
  ContactRequest,
  CustomerSalesStat,
  EntityId,
  InventoryTabId,
  NoticeType,
  Order,
  OrderCustomer,
  OrderItem,
  Product,
  Review,
  SummaryData,
  SummaryStats,
  User,
} from '../types/shop'
import { formatCategoryLabel } from '../utils/categoryLabel'
import { formatCurrency } from '../utils/currency'
import { getErrorMessage } from '../utils/errorMessage'

const adminTabs = [
  { id: 'overview', labelKey: 'admin.overview', icon: BarChart3 },
  { id: 'orders', labelKey: 'admin.orders', icon: ClipboardList },
  { id: 'products', labelKey: 'admin.products', icon: Boxes, path: '/admin/inventory' },
  { id: 'customers', labelKey: 'admin.customers', icon: Users },
  { id: 'users', labelKey: 'admin.users', icon: UserCog },
  { id: 'contacts', labelKey: 'admin.contacts', icon: Inbox },
  { id: 'reviews', labelKey: 'admin.reviews', icon: MessageSquare },
]

function getOrderCustomerType(order: Order) {
  return order?.customerType || (order?.registeredUserId ? 'registered' : 'guest')
}

function getCustomerTypeBadgeClass(customerType: string) {
  return customerType === 'registered'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-amber-200 bg-amber-50 text-amber-800'
}

function getOrderStatusClass(status: string) {
  if (status === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'cancelled') return 'border-red-200 bg-red-50 text-red-700'
  if (status === 'shipping') return 'border-blue-200 bg-blue-50 text-blue-700'
  if (status === 'paid') return 'border-primary/30 bg-primary/10 text-primaryDark'
  return 'border-amber-200 bg-amber-50 text-amber-800'
}

function getMonthDateRange(monthValue: string) {
  const match = String(monthValue || '').trim().match(/^(\d{4})-(\d{1,2})$/)
  if (!match) return {}

  const year = Number(match[1])
  const monthIndex = Number(match[2])
  if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || monthIndex < 1 || monthIndex > 12) return {}

  const monthText = String(monthIndex).padStart(2, '0')
  const lastDay = new Date(year, monthIndex, 0).getDate()

  return {
    endDate: `${year}-${monthText}-${String(lastDay).padStart(2, '0')}`,
    startDate: `${year}-${monthText}-01`,
  }
}

function isAllowedRouteValue(value: string | null, options: readonly string[]): value is string {
  return typeof value === 'string' && options.includes(value)
}


interface StoreAdminPageProps {
  section?: AdminSectionId
}

function StoreAdminPage({ section = 'overview' }: StoreAdminPageProps) {
  const { language, t } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const routeFilterKey = searchParams.toString()
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [contacts, setContacts] = useState<ContactRequest[]>([])
  const [adminReviews, setAdminReviews] = useState<Review[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [deleteReviewTarget, setDeleteReviewTarget] = useState<Review | null>(null)
  const [toast, setToast] = useState<AdminToastMessage>({ message: '', title: '', type: 'success' })
  const [adminAlerts, setAdminAlerts] = useState<AdminAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadedAdminSections, setLoadedAdminSections] = useState<Partial<Record<AdminSectionId, boolean>>>({})
  const [inventoryReloadKey, setInventoryReloadKey] = useState(0)
  const [inventoryActiveTab, setInventoryActiveTab] = useState<InventoryTabId>('items')
  const [inventoryNavStats, setInventoryNavStats] = useState({ categoryCount: 0, historyCount: 0 })
  const [customersReloadKey, setCustomersReloadKey] = useState(0)
  const [statsFilters, setStatsFilters] = useState(emptyStatsFilters)
  const [summaryParams, setSummaryParams] = useState<Record<string, string | undefined>>({})
  const [overviewView, setOverviewView] = useState<'list' | 'chart'>('list')
  const [adminFilters, setAdminFilters] = useState(emptyAdminFilters)
  const adminAlertShownRef = useRef(false)

  const summary: SummaryStats = summaryData?.summary || {}
  const pendingOrderCount = Number(summary.pendingOrderCount) || 0
  const newContactCount = Number(summary.newContactCount) || 0
  const pendingContactCount = countStatuses(summary.contactStats, pendingContactStatuses) || newContactCount
  const lowStockProducts = summaryData?.lowStockProducts || []
  const monthlyRevenue = summaryData?.monthlyRevenue || []
  const topProducts = summaryData?.topProducts || []
  const leastProducts = summaryData?.leastProducts || []
  const topCustomers = summaryData?.topCustomers || []
  const lowStockCategories = useMemo(
    () => ([...new Set(lowStockProducts.map((product) => product.category).filter(Boolean))] as string[]).sort(),
    [lowStockProducts],
  )
  const isOverviewLoading = section === 'overview' && !loadedAdminSections.overview
  const isOrdersLoading = section === 'orders' && !loadedAdminSections.orders
  const isUsersLoading = section === 'users' && !loadedAdminSections.users
  const isContactsLoading = section === 'contacts' && !loadedAdminSections.contacts
  const isReviewsLoading = section === 'reviews' && !loadedAdminSections.reviews
  const paymentOptions = useMemo(
    () => [...new Set(orders.map((order) => order.payment).filter(Boolean))].sort(),
    [orders],
  )

  const awaitingOrders = useMemo(
    () => orders.filter((order) => pendingOrderStatuses.includes(order.status)).length,
    [orders],
  )
  const displayedPendingOrders = orders.length > 0 ? awaitingOrders : pendingOrderCount

  const filteredOrders = useMemo(() => {
    const filters = adminFilters.orders
    return orders.filter((order) => {
      const orderItems = order.items?.map((item) => item.name || item.productName || item.product?.name).join(' ') || ''
      const customerType = getOrderCustomerType(order)
      const customerTypeLabel = t(`admin.customerType.${customerType}`)
      const matchesStatus =
        filters.status === 'all' ||
        (filters.status === 'pending' && pendingOrderStatuses.includes(order.status)) ||
        (filters.status === 'revenue' && revenueOrderStatuses.includes(order.status)) ||
        order.status === filters.status
      const filterDate = filters.dateField === 'updatedAt' ? order.updatedAt || order.createdAt : order.createdAt

      return (
        matchesSearch([
          order.id,
          order.customer?.name,
          order.customer?.email,
          order.customer?.address,
          order.status,
          order.payment,
          customerTypeLabel,
          orderItems,
          formatAdminDate(filterDate, language, ''),
        ], filters.query) &&
        matchesStatus &&
        (filters.payment === 'all' || order.payment === filters.payment) &&
        (filters.customerType === 'all' || customerType === filters.customerType) &&
        isWithinNumberRange(order.total, filters.minTotal, filters.maxTotal) &&
        isWithinDateRange(filterDate, filters.startDate, filters.endDate)
      )
    })
  }, [adminFilters.orders, language, orders, t])

  const filteredUsers = useMemo(() => {
    const filters = adminFilters.users
    return users.filter((user) => {
      const hasAddress = Boolean(user.address || user.shippingAddresses?.length)
      return (
        matchesSearch([user.name, user.email, user.phone, user.address, user.role], filters.query) &&
        (filters.role === 'all' || user.role === filters.role) &&
        (filters.address === 'all' ||
          (filters.address === 'hasAddress' && hasAddress) ||
          (filters.address === 'missingAddress' && !hasAddress))
      )
    })
  }, [adminFilters.users, users])

  const filteredContacts = useMemo(() => {
    const filters = adminFilters.contacts
    return contacts.filter((contact) => {
      const matchesStatus =
        filters.status === 'all' ||
        (filters.status === 'pending' ? pendingContactStatuses.includes(contact.status || '') : contact.status === filters.status)

      return (
        matchesSearch([contact.name, contact.email, contact.phone, contact.topic, contact.message, contact.status], filters.query) &&
        matchesStatus &&
        isWithinDateRange(contact.createdAt, filters.startDate, filters.endDate)
      )
    })
  }, [adminFilters.contacts, contacts])

  const filteredReviews = useMemo(() => {
    const filters = adminFilters.reviews
    return adminReviews.filter((review) => (
      matchesSearch([review.productId, review.productName, review.name, review.userEmail, review.comment], filters.query) &&
      (filters.rating === 'all' || Number(review.rating) === Number(filters.rating)) &&
      (filters.hasImages === 'all' ||
        (filters.hasImages === 'yes' && (review.images?.length || 0) > 0) ||
        (filters.hasImages === 'no' && !review.images?.length)) &&
      isWithinDateRange(review.createdAt, filters.startDate, filters.endDate)
    ))
  }, [adminFilters.reviews, adminReviews])

  const filteredLowStockProducts = useMemo(() => {
    const filters = adminFilters.lowStock
    return lowStockProducts.filter((product) => (
      matchesSearch([product.id, product.name, product.category], filters.query) &&
      (filters.category === 'all' || product.category === filters.category)
    ))
  }, [adminFilters.lowStock, lowStockProducts])

  function showAdminToast(
    message: string,
    type: NoticeType = 'success',
    title = type === 'error' ? t('admin.toastError') : t('admin.toastSuccess'),
  ) {
    setToast({ message, title, type })
  }

  function updateAdminFilter<K extends keyof AdminFilters>(filterKey: K, field: keyof AdminFilters[K], value: string) {
    setAdminFilters((current) => ({
      ...current,
      [filterKey]: {
        ...current[filterKey],
        [field]: value,
      },
    }) as AdminFilters)
  }

  function resetAdminFilter(filterKey: keyof AdminFilters) {
    setAdminFilters((current) => ({
      ...current,
      [filterKey]: emptyAdminFilters[filterKey],
    }))
  }

  function dismissAdminAlert(alertId: string) {
    setAdminAlerts((current) => current.filter((alert) => alert.id !== alertId))
  }

  function openAdminAlert(alert: AdminAlert) {
    dismissAdminAlert(alert.id)

    if (alert.target === 'orders') {
      setAdminFilters((current) => ({
        ...current,
        orders: {
          ...emptyAdminFilters.orders,
          status: 'pending',
        },
      }))
      navigate('/admin/orders?status=pending')
      return
    }

    setAdminFilters((current) => ({
      ...current,
      contacts: {
        ...emptyAdminFilters.contacts,
        status: 'pending',
      },
    }))
    navigate('/admin/contacts?status=pending')
  }

  async function loadAdminData({ refreshCustomers = false, refreshInventory = false, silent = false, includeSection = true } = {}) {
    if (!silent) {
      setIsLoading(true)
    }
    try {
      const nextLoadedSections: Record<string, boolean> = { overview: true }
      const summaryResponse = await shopApi.getAdminSummary(summaryParams)
      setSummaryData(summaryResponse)

      if (includeSection && section === 'orders') {
        const ordersResponse = await shopApi.listAdminOrders()
        setOrders(ordersResponse.orders)
        nextLoadedSections.orders = true
      }

      if (includeSection && section === 'users') {
        const usersResponse = await shopApi.listAdminUsers()
        setUsers(usersResponse.users)
        nextLoadedSections.users = true
      }

      if (includeSection && section === 'contacts') {
        const contactsResponse = await shopApi.listAdminContacts()
        setContacts(contactsResponse.contacts)
        nextLoadedSections.contacts = true
      }

      if (includeSection && section === 'reviews') {
        const reviewsResponse = await shopApi.listAdminReviews()
        setAdminReviews(reviewsResponse.reviews)
        nextLoadedSections.reviews = true
      }
      setLoadedAdminSections((current) => ({ ...current, ...nextLoadedSections }))
    } catch (error) {
      const message = getErrorMessage(error)
      showAdminToast(message, 'error')
      const normalizedMessage = message.toLowerCase()
      if (normalizedMessage.includes('admin') || normalizedMessage.includes('dang nhap') || normalizedMessage.includes('đăng nhập')) {
        navigate('/login')
      }
    } finally {
      if (!silent) {
        setIsLoading(false)
      }
      if (refreshInventory) {
        setInventoryReloadKey((current) => current + 1)
      }
      if (refreshCustomers) {
        setCustomersReloadKey((current) => current + 1)
      }
    }
  }

  useEffect(() => {
    loadAdminData({ includeSection: false })
  }, [section, summaryParams])

  useEffect(() => {
    let refreshTimer: number | null = null
    const scheduleRefresh = () => {
      if (refreshTimer) {
        window.clearTimeout(refreshTimer)
      }
      refreshTimer = window.setTimeout(() => {
        refreshTimer = null
        loadAdminData({ silent: true })
      }, 350)
    }

    const source = createAdminEventStream((event) => {
      if (!['order-created', 'order-updated'].includes(event?.type || '')) return
      scheduleRefresh()
    })

    return () => {
      source?.close()
      if (refreshTimer) {
        window.clearTimeout(refreshTimer)
      }
    }
  }, [section, summaryParams])

  useEffect(() => {
    if (!routeFilterKey) return

    const routeParams = new URLSearchParams(routeFilterKey)
    const routeStatus = routeParams.get('status')
    const routeQuery = routeParams.get('query') || ''
    const routeStartDate = routeParams.get('startDate') || ''
    const routeEndDate = routeParams.get('endDate') || ''

    if (section === 'orders') {
      const allowedStatuses = ['all', 'pending', 'revenue', ...orderStatusOptions.map((option) => option.value)]
      const nextStatus = isAllowedRouteValue(routeStatus, allowedStatuses) ? routeStatus : 'all'
      const routeDateField = routeParams.get('dateField')
      const routeCustomerType = routeParams.get('customerType')
      const nextDateField = isAllowedRouteValue(routeDateField, ['createdAt', 'updatedAt']) ? routeDateField : 'createdAt'
      const nextCustomerType = isAllowedRouteValue(routeCustomerType, ['all', 'registered', 'guest']) ? routeCustomerType : 'all'

      setAdminFilters((current) => ({
        ...current,
        orders: {
          ...emptyAdminFilters.orders,
          customerType: nextCustomerType,
          dateField: nextDateField,
          endDate: routeEndDate,
          query: routeQuery,
          startDate: routeStartDate,
          status: nextStatus,
        },
      }))
      return
    }

    if (section === 'contacts') {
      const allowedStatuses = ['all', 'pending', ...contactStatusOptions.map((option) => option.value)]
      const nextStatus = isAllowedRouteValue(routeStatus, allowedStatuses) ? routeStatus : 'all'

      setAdminFilters((current) => ({
        ...current,
        contacts: {
          ...emptyAdminFilters.contacts,
          endDate: routeEndDate,
          query: routeQuery,
          startDate: routeStartDate,
          status: nextStatus,
        },
      }))
      return
    }

    if (section === 'users') {
      const routeRole = routeParams.get('role')
      const routeAddress = routeParams.get('address')

      setAdminFilters((current) => ({
        ...current,
        users: {
          ...emptyAdminFilters.users,
          address: isAllowedRouteValue(routeAddress, ['all', 'hasAddress', 'missingAddress']) ? routeAddress : 'all',
          query: routeQuery,
          role: isAllowedRouteValue(routeRole, ['all', 'customer', 'admin']) ? routeRole : 'all',
        },
      }))
      return
    }

    if (section === 'reviews') {
      const routeRating = routeParams.get('rating')
      const routeHasImages = routeParams.get('hasImages')

      setAdminFilters((current) => ({
        ...current,
        reviews: {
          ...emptyAdminFilters.reviews,
          endDate: routeEndDate,
          hasImages: isAllowedRouteValue(routeHasImages, ['all', 'yes', 'no']) ? routeHasImages : 'all',
          query: routeQuery,
          rating: isAllowedRouteValue(routeRating, ['all', '1', '2', '3', '4', '5']) ? routeRating : 'all',
          startDate: routeStartDate,
        },
      }))
    }
  }, [routeFilterKey, section])

  useEffect(() => {
    if (!summaryData || adminAlertShownRef.current) return

    adminAlertShownRef.current = true
    const alerts: AdminAlert[] = []
    if (pendingOrderCount > 0) {
      alerts.push({ id: 'pending-orders', count: pendingOrderCount, target: 'orders' })
    }
    if (pendingContactCount > 0) {
      alerts.push({ id: 'pending-contacts', count: pendingContactCount, target: 'contacts' })
    }

    setAdminAlerts(alerts)
  }, [pendingContactCount, pendingOrderCount, summaryData])

  useEffect(() => {
    if (!toast.message) return undefined

    const timer = window.setTimeout(() => {
      setToast({ message: '', title: '', type: 'success' })
    }, toast.type === 'info' ? 5200 : 3600)

    return () => window.clearTimeout(timer)
  }, [toast])

  function handleStatsFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSummaryParams(buildSummaryParams(statsFilters))
  }

  function resetStatsFilters() {
    setStatsFilters(emptyStatsFilters)
    setSummaryParams({})
  }

  async function handleOrderStatus(orderCode: EntityId, status: string) {
    try {
      const data = await shopApi.updateOrderStatus(orderCode, status)
      setOrders((current) => current.map((order) => (order.id === orderCode ? data.order : order)))
      setSelectedOrder((current) => (current?.id === orderCode ? data.order : current))
      showAdminToast(data.message)
    } catch (error) {
      showAdminToast(getErrorMessage(error), 'error')
    }
  }

  function navigateWithParams(path: string, params: Record<string, unknown>) {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.set(key, String(value))
      }
    })

    const queryString = query.toString()
    navigate(queryString ? `${path}?${queryString}` : path)
  }

  function getSummaryDateParams() {
    if (summaryParams.month) return getMonthDateRange(summaryParams.month)
    return {
      endDate: summaryParams.endDate,
      startDate: summaryParams.startDate,
    }
  }

  function openAdminOrders(params = {}) {
    navigateWithParams('/admin/orders', {
      ...getSummaryDateParams(),
      ...params,
    })
  }

  function openAdminContacts(params = {}) {
    navigateWithParams('/admin/contacts', {
      ...getSummaryDateParams(),
      ...params,
    })
  }

  function openAdminUsers(params: Record<string, string | number | undefined> = {}) {
    navigateWithParams('/admin/users', params)
  }

  function openAdminInventory(params: Record<string, string | number | undefined> = {}) {
    setInventoryActiveTab('items')
    navigateWithParams('/admin/inventory', params)
  }

  function openAdminProduct(item: Partial<Product & OrderItem>) {
    const productId = item?.productId || item?.id || ''
    const query = productId || item?.name || item?.productName || ''

    setSelectedOrder(null)
    setInventoryActiveTab('items')
    navigateWithParams('/admin/inventory', {
      focusProductId: productId,
      query,
    })
  }

  function openAdminCustomer(customer?: CustomerSalesStat | OrderCustomer | User | null) {
    const email = String(customer?.email || '').trim().toLowerCase()
    const query = email || customer?.name || ''

    setSelectedOrder(null)
    navigateWithParams('/admin/customers', {
      ...getSummaryDateParams(),
      focusEmail: email,
      query,
    })
  }

  function openAdminCustomers(params: Record<string, string | number | undefined> = {}) {
    navigateWithParams('/admin/customers', {
      ...getSummaryDateParams(),
      ...params,
    })
  }

  async function handleContactStatus(contactId: EntityId, status: string) {
    try {
      const data = await shopApi.updateContactStatus(contactId, status)
      setContacts((current) => current.map((contact) => (contact.id === contactId ? data.contact : contact)))
      showAdminToast(data.message)
    } catch (error) {
      showAdminToast(getErrorMessage(error), 'error')
    }
  }

  async function confirmDeleteReview() {
    if (!deleteReviewTarget) return
    try {
      const data = await shopApi.deleteAdminReview(deleteReviewTarget.id)
      setAdminReviews((current) => current.filter((review) => review.id !== deleteReviewTarget.id))
      showAdminToast(data.message)
      setDeleteReviewTarget(null)
      notifyReviewsChanged()
      notifyCatalogChanged()
    } catch (error) {
      showAdminToast(getErrorMessage(error), 'error')
    }
  }

  async function handleUserRole(userId: EntityId, role: string) {
    try {
      const data = await shopApi.updateUserRole(userId, role)
      setUsers((current) => current.map((user) => (user.id === userId ? data.user : user)))
      showAdminToast(data.message)
    } catch (error) {
      showAdminToast(getErrorMessage(error), 'error')
    }
  }

  const orderColumns = useMemo<Array<ColumnDef<Order, unknown>>>(() => [
    {
      header: t('admin.orderCode'),
      meta: { mobileLabel: t('admin.orderCode') },
      cell: ({ row }) => {
        const order = row.original
        return (
          <button
            type="button"
            className="border-0 bg-transparent p-0 text-left font-black text-primaryDark shadow-none hover:text-primary"
            onClick={(event) => {
              event.stopPropagation()
              setSelectedOrder(order)
            }}
          >
            {order.id}
          </button>
        )
      },
    },
    {
      header: t('admin.customer'),
      meta: { mobileLabel: t('admin.customer') },
      cell: ({ row }) => {
        const order = row.original
        const customer = order.customer
        if (!customer) {
          return <span className="text-sm font-semibold text-muted">{t('admin.noInfo')}</span>
        }

        return (
          <button
            type="button"
            className="grid gap-1 border-0 bg-transparent p-0 text-left shadow-none hover:text-primary"
            onClick={(event) => {
              event.stopPropagation()
              openAdminCustomer(customer)
            }}
          >
            <strong className="font-black text-primaryDark">{customer.name}</strong>
            <small className="font-semibold text-muted">{customer.email}</small>
            <small className="font-semibold text-muted">{customer.address}</small>
          </button>
        )
      },
    },
    {
      header: t('admin.customerType'),
      meta: { mobileLabel: t('admin.customerType') },
      cell: ({ row }) => {
        const customerType = getOrderCustomerType(row.original)
        return (
          <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-black ${getCustomerTypeBadgeClass(customerType)}`}>
            {t(`admin.customerType.${customerType}`)}
          </span>
        )
      },
    },
    {
      header: t('admin.createdAt'),
      meta: { mobileLabel: t('admin.createdAt') },
      cell: ({ row }) => <strong className="text-sm font-semibold text-muted">{formatAdminDate(row.original.createdAt, language, t('admin.noInfo'))}</strong>,
    },
    {
      header: t('admin.items'),
      meta: { mobileLabel: t('admin.items') },
      cell: ({ row }) => {
        const order = row.original
        return (
          <button
            type="button"
            className="border-0 bg-transparent p-0 text-left font-black text-primaryDark shadow-none hover:text-primary"
            onClick={(event) => {
              event.stopPropagation()
              setSelectedOrder(order)
            }}
          >
            {(order.items?.length || 0)} {t('admin.items')}
          </button>
        )
      },
    },
    {
      header: t('admin.paymentMethod'),
      meta: { mobileLabel: t('admin.paymentMethod') },
      cell: ({ row }) => (
        <span className="inline-flex w-fit items-center rounded-full border border-line bg-surfaceMuted px-3 py-1 text-xs font-black text-primaryDark">
          {row.original.payment || t('admin.noInfo')}
        </span>
      ),
    },
    {
      header: t('admin.total'),
      meta: { mobileLabel: t('admin.total') },
      cell: ({ row }) => <strong className="text-xl font-black text-primaryDark">{formatCurrency(row.original.total)}</strong>,
    },
    {
      header: t('admin.status'),
      meta: { mobileLabel: t('admin.status') },
      cell: ({ row }) => {
        const order = row.original
        return (
          <select
            className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-black ${getOrderStatusClass(order.status)}`}
            value={order.status}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => handleOrderStatus(order.id, event.target.value)}
          >
            {orderStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
            ))}
          </select>
        )
      },
    },
  ], [language, t])

  const userColumns = useMemo<Array<ColumnDef<User, unknown>>>(() => [
    {
      header: t('admin.customer'),
      meta: { mobileLabel: t('admin.customer') },
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-black text-primaryDark" aria-hidden="true">
              {user.avatar ? <img className="h-full w-full object-cover" src={user.avatar} alt="" /> : user.name?.slice(0, 1).toUpperCase() || '?'}
            </span>
            <strong>{user.name}</strong>
          </div>
        )
      },
    },
    { header: 'Email', meta: { mobileLabel: 'Email' }, cell: ({ row }) => row.original.email },
    { header: t('admin.phone'), meta: { mobileLabel: t('admin.phone') }, cell: ({ row }) => row.original.phone || t('admin.noInfo') },
    {
      header: t('account.address'),
      meta: { mobileLabel: t('account.address') },
      cell: ({ row }) => (
        <div className="grid gap-1">
          <strong>{row.original.address || t('admin.noInfo')}</strong>
          <small className="font-semibold text-muted">{t('account.addressCount', { count: row.original.shippingAddresses?.length || 0 })}</small>
        </div>
      ),
    },
    {
      header: t('admin.createdAt'),
      meta: { mobileLabel: t('admin.createdAt') },
      cell: ({ row }) => formatAdminDate(row.original.createdAt, language, t('admin.noInfo')),
    },
    {
      header: t('admin.role'),
      meta: { mobileLabel: t('admin.role') },
      cell: ({ row }) => (
        <select value={row.original.role} onChange={(event) => handleUserRole(row.original.id, event.target.value)}>
          <option value="customer">{t('admin.roleCustomer')}</option>
          <option value="admin">{t('admin.roleAdmin')}</option>
        </select>
      ),
    },
  ], [language, t])

  const contactColumns = useMemo<Array<ColumnDef<ContactRequest, unknown>>>(() => [
    {
      header: t('admin.customer'),
      meta: { mobileLabel: t('admin.customer') },
      cell: ({ row }) => (
        <div className="grid gap-1">
          <strong>{row.original.name}</strong>
          <small className="font-semibold text-muted">{row.original.email}</small>
          <small className="font-semibold text-muted">{row.original.phone || t('admin.noPhone')}</small>
        </div>
      ),
    },
    { header: t('admin.topic'), meta: { mobileLabel: t('admin.topic') }, cell: ({ row }) => row.original.topic },
    { header: t('admin.message'), meta: { mobileLabel: t('admin.message') }, cell: ({ row }) => <p className="max-w-md leading-6">{row.original.message}</p> },
    {
      header: t('admin.sentAt'),
      meta: { mobileLabel: t('admin.sentAt') },
      cell: ({ row }) => formatAdminDate(row.original.createdAt, language, t('admin.noInfo')),
    },
    {
      header: t('admin.status'),
      meta: { mobileLabel: t('admin.status') },
      cell: ({ row }) => (
        <select value={row.original.status} onChange={(event) => handleContactStatus(row.original.id, event.target.value)}>
          {contactStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
          ))}
        </select>
      ),
    },
  ], [language, t])

  const reviewColumns = useMemo<Array<ColumnDef<Review, unknown>>>(() => [
    {
      header: t('admin.product'),
      meta: { mobileLabel: t('admin.product') },
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.productImage && <AdminImagePreview alt={row.original.productName || t('admin.product')} href={row.original.productImage} size="sm" src={row.original.productImage} />}
          <span className="grid gap-1">
            <strong>{row.original.productName}</strong>
            <small className="font-semibold text-muted">#{row.original.productId}</small>
          </span>
        </div>
      ),
    },
    {
      header: t('admin.customer'),
      meta: { mobileLabel: t('admin.customer') },
      cell: ({ row }) => (
        <div className="grid gap-1">
          <strong>{row.original.name}</strong>
          <small className="font-semibold text-muted">{row.original.userEmail || t('admin.noInfo')}</small>
        </div>
      ),
    },
    {
      header: t('admin.rating'),
      meta: { mobileLabel: t('admin.rating') },
      cell: ({ row }) => (
        <span className="flex items-center gap-1" aria-label={t('product.star', { count: row.original.rating })}>
          {Array.from({ length: 5 }, (_, index) => (
            <Star key={index} size={15} fill="currentColor" className={index < row.original.rating ? 'text-amber-400' : 'text-slate-300'} />
          ))}
        </span>
      ),
    },
    { header: t('admin.message'), meta: { mobileLabel: t('admin.message') }, cell: ({ row }) => <p className="max-w-md leading-6">{row.original.comment}</p> },
    {
      header: t('admin.reviewImages'),
      meta: { mobileLabel: t('admin.reviewImages') },
      cell: ({ row }) => (row.original.images?.length || 0) > 0 ? (
        <AdminImageMosaic alt={row.original.name || t('admin.reviewImages')} images={row.original.images || []} max={3} size="sm" />
      ) : (
        <span className="text-sm font-semibold text-muted">{t('admin.noInfo')}</span>
      ),
    },
    {
      header: t('admin.createdAt'),
      meta: { mobileLabel: t('admin.createdAt') },
      cell: ({ row }) => formatAdminDate(row.original.createdAt, language, t('admin.noInfo')),
    },
    {
      header: t('admin.tableActions'),
      meta: { mobileLabel: t('admin.tableActions') },
      cell: ({ row }) => (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="border-red-200 bg-red-50 text-red-700 hover:border-red-400 hover:bg-red-100" onClick={() => setDeleteReviewTarget(row.original)}>
            <Trash2 size={15} />
            {t('admin.delete')}
          </button>
          <button type="button" onClick={() => setSelectedReview(row.original)}>
            <Eye size={15} />
            {t('admin.detail')}
          </button>
        </div>
      ),
    },
  ], [language, t])

  const lowStockColumns = useMemo<Array<ColumnDef<Product, unknown>>>(() => [
    {
      header: t('admin.product'),
      meta: { mobileLabel: t('admin.product') },
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <AdminImagePreview alt={row.original.name} href={row.original.image} size="sm" src={row.original.image} />
          <strong>{row.original.name}</strong>
        </div>
      ),
    },
    {
      header: t('admin.category'),
      meta: { mobileLabel: t('admin.category') },
      cell: ({ row }) => formatCategoryLabel(row.original.category),
    },
    {
      header: t('admin.price'),
      meta: { mobileLabel: t('admin.price') },
      cell: ({ row }) => <strong className="text-primaryDark">{formatCurrency(row.original.price)}</strong>,
    },
    {
      header: t('admin.stock'),
      meta: { mobileLabel: t('admin.stock') },
      cell: ({ row }) => <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-800">{row.original.stock}</span>,
    },
  ], [t])

  const adminQuickStats = [
    {
      key: 'revenue',
      icon: ShoppingBag,
      label: t('admin.revenue'),
      value: formatCurrency(summary.revenue || 0),
      tone: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    {
      key: 'orders',
      icon: ClipboardList,
      label: t('admin.orders'),
      value: summary.orderCount || 0,
      tone: 'border-blue-200 bg-blue-50 text-blue-700',
    },
    {
      key: 'pending',
      icon: Truck,
      label: t('admin.pending'),
      value: displayedPendingOrders,
      tone: 'border-amber-200 bg-amber-50 text-amber-800',
    },
    {
      key: 'users',
      icon: Users,
      label: t('admin.users'),
      value: summary.userCount || 0,
      tone: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    },
    {
      key: 'products',
      icon: Boxes,
      label: t('admin.products'),
      value: summary.productCount || 0,
      tone: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    },
    {
      key: 'low-stock',
      icon: AlertTriangle,
      label: t('admin.lowStock'),
      value: summary.lowStockCount || 0,
      tone: 'border-red-200 bg-red-50 text-red-700',
    },
  ]

  return (
    <section className="grid min-h-[calc(100vh-72px)] w-full max-w-none gap-6 bg-slate-50 p-4 md:p-6 lg:pl-[17.5rem]">
      <div className="overflow-hidden rounded-md border border-line bg-gradient-to-br from-white via-surfaceMuted to-blue-50 p-5 shadow-liquid md:p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="grid gap-3">
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-primaryDark">
              <ShieldCheck size={15} />
              {t('admin.kicker')}
            </p>
            <div className="grid gap-2">
              <h1 className="text-3xl font-black leading-tight text-ink md:text-4xl">{t('admin.heroTitle')}</h1>
              <p className="max-w-3xl text-sm font-semibold leading-6 text-muted md:text-base">{t('admin.heroText')}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-64 lg:grid-cols-1">
            <div className="rounded-md border border-white/80 bg-white/80 p-3 shadow-soft backdrop-blur">
              <span className="text-xs font-black uppercase tracking-wide text-muted">{t('admin.pending')}</span>
              <strong className="mt-1 block text-2xl font-black text-amber-700">{displayedPendingOrders}</strong>
            </div>
            <button
              className="w-full justify-center border-primary bg-primary text-white hover:border-primaryDark hover:bg-primaryDark"
              onClick={() => loadAdminData({ refreshCustomers: section === 'customers', refreshInventory: section === 'products' })}
              disabled={isLoading}
            >
              <RefreshCw size={17} />
              {t('admin.refresh')}
            </button>
          </div>
        </div>
      </div>

      {(adminAlerts.length > 0 || toast.message) && (
        <div className="fixed right-4 top-20 z-[80] grid w-[min(380px,calc(100vw-2rem))] gap-3">
          {adminAlerts.map((alert) => (
            <AdminToast
              key={alert.id}
              toast={{
                message: t(alert.target === 'orders' ? 'admin.pendingOrdersText' : 'admin.pendingContactsText', { count: alert.count }),
                title: t(alert.target === 'orders' ? 'admin.pendingOrdersTitle' : 'admin.pendingContactsTitle'),
                type: 'info',
              }}
              closeLabel={t('admin.closeToast')}
              onClose={() => dismissAdminAlert(alert.id)}
              onOpen={() => openAdminAlert(alert)}
            />
          ))}
          <AdminToast
            toast={toast}
            closeLabel={t('admin.closeToast')}
            onClose={() => setToast({ message: '', title: '', type: 'success' })}
          />
        </div>
      )}

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
        {adminQuickStats.map((stat) => {
          const Icon = stat.icon
          return (
            <article key={stat.key} className="group grid min-w-0 gap-3 rounded-md border border-line bg-white p-4 shadow-liquid transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-liquidHover">
              <div className="flex items-center justify-between gap-3">
                <span className={`inline-flex size-11 items-center justify-center rounded-md border ${stat.tone}`}>
                  <Icon size={21} />
                </span>
              </div>
              <div className="grid gap-1">
                <span className="text-xs font-black uppercase tracking-wide text-muted">{stat.label}</span>
                <strong className="min-w-0 break-words text-[clamp(1.05rem,2.2vw,1.5rem)] font-black leading-tight text-ink">{stat.value}</strong>
              </div>
            </article>
          )
        })}
      </div>

      <nav className="sticky top-[72px] z-30 grid gap-3 rounded-md border border-line bg-white/95 p-3 shadow-panel backdrop-blur lg:fixed lg:bottom-0 lg:left-0 lg:top-0 lg:w-64 lg:content-start lg:overflow-y-auto lg:rounded-none lg:border-y-0 lg:border-l-0 lg:bg-white lg:p-4" aria-label={t('admin.kicker')}>
        <div className="hidden border-b border-line pb-4 lg:grid">
          <span className="text-lg font-black text-primaryDark">Marseille04</span>
          <span className="text-xs font-black uppercase tracking-wide text-muted">{t('admin.kicker')}</span>
        </div>
        {adminTabs.map((tab) => {
          const Icon = tab.icon
          const baseTabClass = 'flex min-h-12 items-center gap-3 rounded-md border border-transparent px-3 py-2 text-sm font-black text-muted transition hover:border-line hover:bg-surfaceMuted hover:text-primaryDark'
          const tabLink = (
            <NavLink
              key={tab.id}
              to={tab.path || `/admin/${tab.id}`}
              className={({ isActive }) => `${baseTabClass} ${isActive || section === tab.id ? 'border-primary/30 bg-primary/10 text-primaryDark shadow-soft' : ''}`}
              onClick={tab.id === 'products' ? () => setInventoryActiveTab('items') : undefined}
            >
              <Icon size={17} />
              <span>{t(tab.labelKey)}</span>
            </NavLink>
          )

          if (tab.id !== 'products') return tabLink

          return (
            <div key={tab.id} className="grid gap-2">
              {tabLink}
              {section === 'products' && (
                <InventoryTabsNav
                  activeTab={inventoryActiveTab}
                  categoryCount={inventoryNavStats.categoryCount}
                  historyCount={inventoryNavStats.historyCount}
                  onChangeTab={setInventoryActiveTab}
                  t={t}
                />
              )}
            </div>
          )
        })}
      </nav>

      {section === 'overview' && (
        <AdminOverviewSection
          handleStatsFilterSubmit={handleStatsFilterSubmit}
          isLoading={isOverviewLoading}
          leastProducts={leastProducts}
          monthlyRevenue={monthlyRevenue}
          overviewView={overviewView}
          resetStatsFilters={resetStatsFilters}
          setOverviewView={setOverviewView}
          setStatsFilters={setStatsFilters}
          statsFilters={statsFilters}
          summary={summary}
          summaryData={summaryData}
          t={t}
          onOpenContacts={openAdminContacts}
          onOpenCustomer={openAdminCustomer}
          onOpenCustomers={openAdminCustomers}
          onOpenOrders={openAdminOrders}
          onOpenProduct={openAdminProduct}
          onOpenProducts={openAdminInventory}
          onOpenUsers={openAdminUsers}
          topCustomers={topCustomers}
          topProducts={topProducts}
        />
      )}
      {section === 'orders' && (
        <section className="grid gap-4 rounded-md border border-line bg-white p-4 shadow-liquid">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-primaryDark"><ClipboardList size={15} /> {t('admin.orders')}</p>
              <h2>{t('admin.manageOrders')}</h2>
            </div>
            <span>{t('admin.filteredCount', { shown: filteredOrders.length, total: orders.length })}</span>
          </div>
          <AdminFilterPanel
            title={t('admin.filters')}
            clearLabel={t('admin.clearFilters')}
            onClear={() => resetAdminFilter('orders')}
          >
            <AdminSearchInput
              value={adminFilters.orders.query}
              placeholder={t('admin.searchOrders')}
              onChange={(value) => updateAdminFilter('orders', 'query', value)}
            />
            <label>
              {t('admin.status')}
              <select
                value={adminFilters.orders.status}
                onChange={(event) => updateAdminFilter('orders', 'status', event.target.value)}
              >
                <option value="all">{t('admin.allStatuses')}</option>
                <option value="pending">{t('admin.pendingOrders')}</option>
                <option value="revenue">{t('admin.revenueOrders')}</option>
                {orderStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
                ))}
              </select>
            </label>
            <label>
              {t('admin.dateField')}
              <select
                value={adminFilters.orders.dateField}
                onChange={(event) => updateAdminFilter('orders', 'dateField', event.target.value)}
              >
                <option value="createdAt">{t('admin.createdDate')}</option>
                <option value="updatedAt">{t('admin.updatedDate')}</option>
              </select>
            </label>
            <label>
              {t('admin.paymentMethod')}
              <select
                value={adminFilters.orders.payment}
                onChange={(event) => updateAdminFilter('orders', 'payment', event.target.value)}
              >
                <option value="all">{t('admin.allPayments')}</option>
                {paymentOptions.map((payment) => (
                  <option key={payment} value={payment}>{payment}</option>
                ))}
              </select>
            </label>
            <label>
              {t('admin.customerType')}
              <select
                value={adminFilters.orders.customerType}
                onChange={(event) => updateAdminFilter('orders', 'customerType', event.target.value)}
              >
                <option value="all">{t('admin.allCustomerTypes')}</option>
                {orderCustomerTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
                ))}
              </select>
            </label>
            <label>
              {t('admin.minTotal')}
              <input
                type="number"
                min="0"
                value={adminFilters.orders.minTotal}
                onChange={(event) => updateAdminFilter('orders', 'minTotal', event.target.value)}
              />
            </label>
            <label>
              {t('admin.maxTotal')}
              <input
                type="number"
                min="0"
                value={adminFilters.orders.maxTotal}
                onChange={(event) => updateAdminFilter('orders', 'maxTotal', event.target.value)}
              />
            </label>
            <label>
              {t('admin.startDate')}
              <input
                type="date"
                value={adminFilters.orders.startDate}
                onChange={(event) => updateAdminFilter('orders', 'startDate', event.target.value)}
              />
            </label>
            <label>
              {t('admin.endDate')}
              <input
                type="date"
                value={adminFilters.orders.endDate}
                onChange={(event) => updateAdminFilter('orders', 'endDate', event.target.value)}
              />
            </label>
          </AdminFilterPanel>
          <LazyViewport
            fallback={<DataTable columns={orderColumns} data={[]} isLoading loadingMessage={t('admin.loading')} loadingRows={6} />}
            minHeight={360}
            onEnter={() => {
              if (!loadedAdminSections.orders) void loadAdminData({ silent: true })
            }}
          >
            <DataTable
              columns={orderColumns}
              data={isOrdersLoading ? [] : filteredOrders}
              emptyMessage={isOrdersLoading ? t('admin.loading') : orders.length === 0 ? t('admin.noOrders') : t('admin.noFilterResults')}
              getRowId={(order) => String(order.id)}
              isLoading={isOrdersLoading}
              loadingMessage={t('admin.loading')}
              loadingRows={6}
              onRowClick={(order) => setSelectedOrder(order)}
            />
          </LazyViewport>
        </section>
      )}

      {section === 'products' && (
        <InventoryAdminSection
          activeTab={inventoryActiveTab}
          onNavStatsChange={setInventoryNavStats}
          reloadKey={inventoryReloadKey}
          setActiveTab={setInventoryActiveTab}
          showAdminToast={showAdminToast}
        />
      )}

      {section === 'customers' && (
        <AdminCustomersSection
          language={language}
          reloadKey={customersReloadKey}
          showAdminToast={showAdminToast}
          t={t}
        />
      )}

      {section === 'users' && (
        <section className="grid gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-primaryDark"><UserCog size={15} /> {t('admin.users')}</p>
              <h2>{t('admin.users')}</h2>
            </div>
            <span>{t('admin.filteredCount', { shown: filteredUsers.length, total: users.length })}</span>
          </div>
          <AdminFilterPanel
            title={t('admin.filters')}
            clearLabel={t('admin.clearFilters')}
            onClear={() => resetAdminFilter('users')}
          >
            <AdminSearchInput
              value={adminFilters.users.query}
              placeholder={t('admin.searchUsers')}
              onChange={(value) => updateAdminFilter('users', 'query', value)}
            />
            <label>
              {t('admin.role')}
              <select
                value={adminFilters.users.role}
                onChange={(event) => updateAdminFilter('users', 'role', event.target.value)}
              >
                <option value="all">{t('admin.allRoles')}</option>
                <option value="customer">{t('admin.roleCustomer')}</option>
                <option value="admin">{t('admin.roleAdmin')}</option>
              </select>
            </label>
            <label>
              {t('account.address')}
              <select
                value={adminFilters.users.address}
                onChange={(event) => updateAdminFilter('users', 'address', event.target.value)}
              >
                <option value="all">{t('admin.allAddresses')}</option>
                <option value="hasAddress">{t('admin.hasAddress')}</option>
                <option value="missingAddress">{t('admin.missingAddress')}</option>
              </select>
            </label>
          </AdminFilterPanel>
          <LazyViewport
            fallback={<DataTable columns={userColumns} data={[]} isLoading loadingMessage={t('admin.loading')} loadingRows={6} />}
            minHeight={360}
            onEnter={() => {
              if (!loadedAdminSections.users) void loadAdminData({ silent: true })
            }}
          >
            <DataTable
              columns={userColumns}
              data={isUsersLoading ? [] : filteredUsers}
              emptyMessage={isUsersLoading ? t('admin.loading') : users.length === 0 ? t('admin.noUsers') : t('admin.noFilterResults')}
              getRowId={(user) => String(user.id)}
              isLoading={isUsersLoading}
              loadingMessage={t('admin.loading')}
              loadingRows={6}
            />
          </LazyViewport>
        </section>
      )}

      {section === 'contacts' && (
        <section className="grid gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-primaryDark"><Inbox size={15} /> {t('admin.contacts')}</p>
              <h2>{t('admin.contactTable')}</h2>
            </div>
            <span>{t('admin.filteredCount', { shown: filteredContacts.length, total: contacts.length })}</span>
          </div>
          <AdminFilterPanel
            title={t('admin.filters')}
            clearLabel={t('admin.clearFilters')}
            onClear={() => resetAdminFilter('contacts')}
          >
            <AdminSearchInput
              value={adminFilters.contacts.query}
              placeholder={t('admin.searchContacts')}
              onChange={(value) => updateAdminFilter('contacts', 'query', value)}
            />
            <label>
              {t('admin.status')}
              <select
                value={adminFilters.contacts.status}
                onChange={(event) => updateAdminFilter('contacts', 'status', event.target.value)}
              >
                <option value="all">{t('admin.allStatuses')}</option>
                <option value="pending">{t('admin.pendingContacts')}</option>
                {contactStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
                ))}
              </select>
            </label>
            <label>
              {t('admin.startDate')}
              <input
                type="date"
                value={adminFilters.contacts.startDate}
                onChange={(event) => updateAdminFilter('contacts', 'startDate', event.target.value)}
              />
            </label>
            <label>
              {t('admin.endDate')}
              <input
                type="date"
                value={adminFilters.contacts.endDate}
                onChange={(event) => updateAdminFilter('contacts', 'endDate', event.target.value)}
              />
            </label>
          </AdminFilterPanel>
          <LazyViewport
            fallback={<DataTable columns={contactColumns} data={[]} isLoading loadingMessage={t('admin.loading')} loadingRows={6} />}
            minHeight={360}
            onEnter={() => {
              if (!loadedAdminSections.contacts) void loadAdminData({ silent: true })
            }}
          >
            <DataTable
              columns={contactColumns}
              data={isContactsLoading ? [] : filteredContacts}
              emptyMessage={isContactsLoading ? t('admin.loading') : contacts.length === 0 ? t('admin.noContacts') : t('admin.noFilterResults')}
              getRowId={(contact) => String(contact.id)}
              isLoading={isContactsLoading}
              loadingMessage={t('admin.loading')}
              loadingRows={6}
            />
          </LazyViewport>
        </section>
      )}

      {section === 'reviews' && (
        <section className="grid gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-primaryDark"><MessageSquare size={15} /> {t('admin.reviews')}</p>
              <h2>{t('admin.reviewTable')}</h2>
            </div>
            <span>{t('admin.filteredCount', { shown: filteredReviews.length, total: adminReviews.length })}</span>
          </div>
          <AdminFilterPanel
            title={t('admin.filters')}
            clearLabel={t('admin.clearFilters')}
            onClear={() => resetAdminFilter('reviews')}
          >
            <AdminSearchInput
              value={adminFilters.reviews.query}
              placeholder={t('admin.searchReviews')}
              onChange={(value) => updateAdminFilter('reviews', 'query', value)}
            />
            <label>
              {t('admin.rating')}
              <select
                value={adminFilters.reviews.rating}
                onChange={(event) => updateAdminFilter('reviews', 'rating', event.target.value)}
              >
                <option value="all">{t('admin.allRatings')}</option>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>{t('product.star', { count: rating })}</option>
                ))}
              </select>
            </label>
            <label>
              {t('admin.reviewImages')}
              <select
                value={adminFilters.reviews.hasImages}
                onChange={(event) => updateAdminFilter('reviews', 'hasImages', event.target.value)}
              >
                <option value="all">{t('admin.allReviewImages')}</option>
                <option value="yes">{t('admin.withReviewImages')}</option>
                <option value="no">{t('admin.withoutReviewImages')}</option>
              </select>
            </label>
            <label>
              {t('admin.startDate')}
              <input
                type="date"
                value={adminFilters.reviews.startDate}
                onChange={(event) => updateAdminFilter('reviews', 'startDate', event.target.value)}
              />
            </label>
            <label>
              {t('admin.endDate')}
              <input
                type="date"
                value={adminFilters.reviews.endDate}
                onChange={(event) => updateAdminFilter('reviews', 'endDate', event.target.value)}
              />
            </label>
          </AdminFilterPanel>
          <LazyViewport
            fallback={<DataTable columns={reviewColumns} data={[]} isLoading loadingMessage={t('admin.loading')} loadingRows={6} />}
            minHeight={360}
            onEnter={() => {
              if (!loadedAdminSections.reviews) void loadAdminData({ silent: true })
            }}
          >
            <DataTable
              columns={reviewColumns}
              data={isReviewsLoading ? [] : filteredReviews}
              emptyMessage={isReviewsLoading ? t('admin.loading') : adminReviews.length === 0 ? t('admin.noReviews') : t('admin.noFilterResults')}
              getRowId={(review) => String(review.id)}
              isLoading={isReviewsLoading}
              loadingMessage={t('admin.loading')}
              loadingRows={6}
            />
          </LazyViewport>
        </section>
      )}

      {selectedReview && (
        <AppDialog
          isOpen={Boolean(selectedReview)}
          onClose={() => setSelectedReview(null)}
          title={t('admin.reviewDetail')}
          description={(
            <span className="inline-flex items-center gap-2">
              <MessageSquare size={15} />
              {t('admin.reviews')}
            </span>
          )}
        >
            <div className="grid gap-3 rounded-md border border-lineStrong/60 bg-gradient-to-br from-white via-sky-50 to-surfaceMuted p-4 shadow-soft sm:grid-cols-[auto_1fr] sm:items-center">
              {selectedReview.productImage && <AdminImagePreview alt={selectedReview.productName || t('admin.product')} href={selectedReview.productImage} size="lg" src={selectedReview.productImage} />}
              <div className="grid gap-1">
                <strong className="text-xl font-black text-ink">{selectedReview.productName}</strong>
                <span className="text-sm font-bold text-muted">#{selectedReview.productId}</span>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <article>
                <span>{t('admin.customer')}</span>
                <strong>{selectedReview.name}</strong>
                <small>{selectedReview.userEmail || t('admin.noInfo')}</small>
              </article>
              <article>
                <span>{t('admin.rating')}</span>
                <strong>{t('product.star', { count: selectedReview.rating })}</strong>
              </article>
              <article>
                <span>{t('admin.createdAt')}</span>
                <strong>{formatAdminDate(selectedReview.createdAt, language, t('admin.noInfo'))}</strong>
              </article>
            </div>
            <div className="rounded-md border border-line bg-surfaceMuted p-3">
              <span>{t('admin.message')}</span>
              <p>{selectedReview.comment}</p>
            </div>
            {(selectedReview.images?.length || 0) > 0 && (
              <div className="grid gap-2 rounded-md border border-lineStrong/60 bg-white p-4 shadow-soft">
                <span className="text-xs font-black uppercase tracking-wide text-primaryDark">{t('admin.reviewImages')}</span>
                <AdminImageMosaic alt={selectedReview.name || t('admin.reviewImages')} images={selectedReview.images || []} max={8} size="lg" />
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => setSelectedReview(null)}>{t('admin.close')}</button>
              <button
                type="button"
                className="border-red-200 bg-red-50 text-red-700 hover:border-red-400 hover:bg-red-100"
                onClick={() => {
                  setDeleteReviewTarget(selectedReview)
                  setSelectedReview(null)
                }}
              >
                <Trash2 size={16} />
                {t('admin.delete')}
              </button>
            </div>
        </AppDialog>
      )}

      {section === 'overview' && !isOverviewLoading && lowStockProducts.length > 0 && (
        <section className="grid gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-primaryDark"><AlertTriangle size={15} /> {t('admin.stock')}</p>
              <h2>{t('admin.lowStock')}</h2>
            </div>
            <span>{t('admin.filteredCount', { shown: filteredLowStockProducts.length, total: lowStockProducts.length })}</span>
          </div>
          <AdminFilterPanel
            title={t('admin.filters')}
            clearLabel={t('admin.clearFilters')}
            onClear={() => resetAdminFilter('lowStock')}
          >
            <AdminSearchInput
              value={adminFilters.lowStock.query}
              placeholder={t('admin.searchLowStock')}
              onChange={(value) => updateAdminFilter('lowStock', 'query', value)}
            />
            <label>
              {t('admin.category')}
              <select
                value={adminFilters.lowStock.category}
                onChange={(event) => updateAdminFilter('lowStock', 'category', event.target.value)}
              >
                <option value="all">{t('shop.allCategories')}</option>
                {lowStockCategories.map((category) => (
                  <option key={category} value={category}>{formatCategoryLabel(category)}</option>
                ))}
              </select>
            </label>
          </AdminFilterPanel>
          <LazyViewport fallback={<DataTable columns={lowStockColumns} data={[]} isLoading loadingMessage={t('admin.loading')} loadingRows={5} />} minHeight={320}>
            <DataTable
              columns={lowStockColumns}
              data={filteredLowStockProducts}
              emptyMessage={t('admin.noFilterResults')}
              getRowId={(product) => String(product.id)}
            />
          </LazyViewport>
        </section>
      )}

      {deleteReviewTarget && (
        <AppDialog
          className="max-w-xl"
          isOpen={Boolean(deleteReviewTarget)}
          onClose={() => setDeleteReviewTarget(null)}
          title={(
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-700">
                <AlertTriangle size={20} />
              </span>
              {t('admin.deleteReviewQuestion')}
            </span>
          )}
        >
            <div className="grid gap-2">
              <p>
                {t('admin.deleteReviewText', { name: deleteReviewTarget.productName || deleteReviewTarget.name })}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => setDeleteReviewTarget(null)}>{t('admin.cancelDelete')}</button>
              <button type="button" className="border-red-200 bg-red-50 text-red-700 hover:border-red-400 hover:bg-red-100" onClick={confirmDeleteReview}>
                <Trash2 size={16} />
                {t('admin.delete')}
              </button>
            </div>
        </AppDialog>
      )}

      <AdminOrderDetailDialog
        language={language}
        order={selectedOrder}
        t={t}
        onClose={() => setSelectedOrder(null)}
        onOpenCustomer={openAdminCustomer}
        onOpenProduct={openAdminProduct}
      />
    </section>
  )
}

export default StoreAdminPage
