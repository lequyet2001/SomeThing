import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  ClipboardList,
  Inbox,
  MessageSquare,
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
import AdminCustomersSection from './admin/AdminCustomersSection'
import AdminOrderDetailDialog from '../components/admin/AdminOrderDetailDialog'
import AdminOverviewSection from './admin/AdminOverviewSection'
import AdminSearchInput from '../components/admin/AdminSearchInput'
import AdminToast from '../components/admin/AdminToast'
import InventoryAdminSection from './admin/InventoryAdminSection'
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
  orderStatusOptions,
  pendingContactStatuses,
  pendingOrderStatuses,
  revenueOrderStatuses,
} from './admin/adminUtils'
import { createAdminEventStream, shopApi } from '../services/shopApi'
import { formatCategoryLabel } from '../utils/categoryLabel'
import { formatCurrency } from '../utils/currency'

const adminTabs = [
  { id: 'overview', labelKey: 'admin.overview', icon: BarChart3 },
  { id: 'orders', labelKey: 'admin.orders', icon: ClipboardList },
  { id: 'products', labelKey: 'admin.products', icon: Boxes, path: '/admin/inventory' },
  { id: 'customers', labelKey: 'admin.customers', icon: Users },
  { id: 'users', labelKey: 'admin.users', icon: UserCog },
  { id: 'contacts', labelKey: 'admin.contacts', icon: Inbox },
  { id: 'reviews', labelKey: 'admin.reviews', icon: MessageSquare },
]

function getMonthDateRange(monthValue) {
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


function StoreAdminPage({ section = 'overview' }) {
  const { language, t } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const routeFilterKey = searchParams.toString()
  const [summaryData, setSummaryData] = useState(null)
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [contacts, setContacts] = useState([])
  const [adminReviews, setAdminReviews] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [deleteReviewTarget, setDeleteReviewTarget] = useState(null)
  const [toast, setToast] = useState({ message: '', title: '', type: 'success' })
  const [adminAlerts, setAdminAlerts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [inventoryReloadKey, setInventoryReloadKey] = useState(0)
  const [customersReloadKey, setCustomersReloadKey] = useState(0)
  const [statsFilters, setStatsFilters] = useState(emptyStatsFilters)
  const [summaryParams, setSummaryParams] = useState({})
  const [overviewView, setOverviewView] = useState('list')
  const [adminFilters, setAdminFilters] = useState(emptyAdminFilters)
  const adminAlertShownRef = useRef(false)

  const summary = summaryData?.summary || {}
  const pendingOrderCount = Number(summary.pendingOrderCount) || 0
  const newContactCount = Number(summary.newContactCount) || 0
  const pendingContactCount = countStatuses(summary.contactStats, pendingContactStatuses) || newContactCount
  const lowStockProducts = summaryData?.lowStockProducts || []
  const monthlyRevenue = summaryData?.monthlyRevenue || []
  const topProducts = summaryData?.topProducts || []
  const leastProducts = summaryData?.leastProducts || []
  const topCustomers = summaryData?.topCustomers || []
  const lowStockCategories = useMemo(
    () => [...new Set(lowStockProducts.map((product) => product.category).filter(Boolean))].sort(),
    [lowStockProducts],
  )
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
          orderItems,
          formatAdminDate(filterDate, language, ''),
        ], filters.query) &&
        matchesStatus &&
        (filters.payment === 'all' || order.payment === filters.payment) &&
        isWithinNumberRange(order.total, filters.minTotal, filters.maxTotal) &&
        isWithinDateRange(filterDate, filters.startDate, filters.endDate)
      )
    })
  }, [adminFilters.orders, language, orders])

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
        (filters.status === 'pending' ? pendingContactStatuses.includes(contact.status) : contact.status === filters.status)

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

  function showAdminToast(message, type = 'success', title = type === 'error' ? t('admin.toastError') : t('admin.toastSuccess')) {
    setToast({ message, title, type })
  }

  function updateAdminFilter(filterKey, field, value) {
    setAdminFilters((current) => ({
      ...current,
      [filterKey]: {
        ...current[filterKey],
        [field]: value,
      },
    }))
  }

  function resetAdminFilter(filterKey) {
    setAdminFilters((current) => ({
      ...current,
      [filterKey]: emptyAdminFilters[filterKey],
    }))
  }

  function dismissAdminAlert(alertId) {
    setAdminAlerts((current) => current.filter((alert) => alert.id !== alertId))
  }

  function openAdminAlert(alert) {
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

  async function loadAdminData({ refreshCustomers = false, refreshInventory = false } = {}) {
    setIsLoading(true)
    try {
      const summaryResponse = await shopApi.getAdminSummary(summaryParams)
      setSummaryData(summaryResponse)

      if (section === 'orders') {
        const ordersResponse = await shopApi.listAdminOrders()
        setOrders(ordersResponse.orders)
      }

      if (section === 'users') {
        const usersResponse = await shopApi.listAdminUsers()
        setUsers(usersResponse.users)
      }

      if (section === 'contacts') {
        const contactsResponse = await shopApi.listAdminContacts()
        setContacts(contactsResponse.contacts)
      }

      if (section === 'reviews') {
        const reviewsResponse = await shopApi.listAdminReviews()
        setAdminReviews(reviewsResponse.reviews)
      }
    } catch (error) {
      showAdminToast(error.message, 'error')
      const message = error.message.toLowerCase()
      if (message.includes('admin') || message.includes('dang nhap') || message.includes('đăng nhập')) {
        navigate('/login')
      }
    } finally {
      setIsLoading(false)
      if (refreshInventory) {
        setInventoryReloadKey((current) => current + 1)
      }
      if (refreshCustomers) {
        setCustomersReloadKey((current) => current + 1)
      }
    }
  }

  useEffect(() => {
    loadAdminData()
  }, [section, summaryParams])

  useEffect(() => {
    const source = createAdminEventStream((event) => {
      if (!['order-created', 'order-updated'].includes(event?.type)) return
      loadAdminData()
    })

    return () => source?.close()
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
      const nextStatus = allowedStatuses.includes(routeStatus) ? routeStatus : 'all'
      const routeDateField = routeParams.get('dateField')
      const nextDateField = ['createdAt', 'updatedAt'].includes(routeDateField) ? routeDateField : 'createdAt'

      setAdminFilters((current) => ({
        ...current,
        orders: {
          ...emptyAdminFilters.orders,
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
      const nextStatus = allowedStatuses.includes(routeStatus) ? routeStatus : 'all'

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
          address: ['all', 'hasAddress', 'missingAddress'].includes(routeAddress) ? routeAddress : 'all',
          query: routeQuery,
          role: ['all', 'customer', 'admin'].includes(routeRole) ? routeRole : 'all',
        },
      }))
    }
  }, [routeFilterKey, section])

  useEffect(() => {
    if (!summaryData || adminAlertShownRef.current) return

    adminAlertShownRef.current = true
    const alerts = []
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

  function handleStatsFilterSubmit(event) {
    event.preventDefault()
    setSummaryParams(buildSummaryParams(statsFilters))
  }

  function resetStatsFilters() {
    setStatsFilters(emptyStatsFilters)
    setSummaryParams({})
  }

  async function handleOrderStatus(orderCode, status) {
    try {
      const data = await shopApi.updateOrderStatus(orderCode, status)
      setOrders((current) => current.map((order) => (order.id === orderCode ? data.order : order)))
      setSelectedOrder((current) => (current?.id === orderCode ? data.order : current))
      showAdminToast(data.message)
    } catch (error) {
      showAdminToast(error.message, 'error')
    }
  }

  function navigateWithParams(path, params) {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.set(key, value)
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

  function openAdminUsers(params = {}) {
    navigateWithParams('/admin/users', params)
  }

  function openAdminInventory(params = {}) {
    navigateWithParams('/admin/inventory', params)
  }

  function openAdminProduct(item) {
    const productId = item?.productId || item?.id || ''
    const query = productId || item?.name || item?.productName || ''

    setSelectedOrder(null)
    navigateWithParams('/admin/inventory', {
      focusProductId: productId,
      query,
    })
  }

  function openAdminCustomer(customer) {
    const email = String(customer?.email || '').trim().toLowerCase()
    const query = email || customer?.name || ''

    setSelectedOrder(null)
    navigateWithParams('/admin/customers', {
      ...getSummaryDateParams(),
      focusEmail: email,
      query,
    })
  }

  function openAdminCustomers(params = {}) {
    navigateWithParams('/admin/customers', {
      ...getSummaryDateParams(),
      ...params,
    })
  }

  async function handleContactStatus(contactId, status) {
    try {
      const data = await shopApi.updateContactStatus(contactId, status)
      setContacts((current) => current.map((contact) => (contact.id === contactId ? data.contact : contact)))
      showAdminToast(data.message)
    } catch (error) {
      showAdminToast(error.message, 'error')
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
      showAdminToast(error.message, 'error')
    }
  }

  async function handleUserRole(userId, role) {
    try {
      const data = await shopApi.updateUserRole(userId, role)
      setUsers((current) => current.map((user) => (user.id === userId ? data.user : user)))
      showAdminToast(data.message)
    } catch (error) {
      showAdminToast(error.message, 'error')
    }
  }

  return (
    <section className={`admin-page admin-page-${section}`}>
      <div className="admin-hero">
        <div>
          <p className="admin-kicker"><ShieldCheck size={15} /> {t('admin.kicker')}</p>
          <h1>{t('admin.heroTitle')}</h1>
          <p>{t('admin.heroText')}</p>
        </div>
        <button
          className="admin-refresh"
          onClick={() => loadAdminData({ refreshCustomers: section === 'customers', refreshInventory: section === 'products' })}
          disabled={isLoading}
        >
          <RefreshCw size={17} />
          {t('admin.refresh')}
        </button>
      </div>

      {(adminAlerts.length > 0 || toast.message) && (
        <div className="admin-toast-stack">
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

      <div className="admin-metrics">
        <article>
          <ShoppingBag size={22} />
          <span>{t('admin.revenue')}</span>
          <strong>{formatCurrency(summary.revenue || 0)}</strong>
        </article>
        <article>
          <ClipboardList size={22} />
          <span>{t('admin.orders')}</span>
          <strong>{summary.orderCount || 0}</strong>
        </article>
        <article>
          <Truck size={22} />
          <span>{t('admin.pending')}</span>
          <strong>{displayedPendingOrders}</strong>
        </article>
        <article>
          <Users size={22} />
          <span>{t('admin.users')}</span>
          <strong>{summary.userCount || 0}</strong>
        </article>
        <article>
          <Boxes size={22} />
          <span>{t('admin.products')}</span>
          <strong>{summary.productCount || 0}</strong>
        </article>
        <article>
          <AlertTriangle size={22} />
          <span>{t('admin.lowStock')}</span>
          <strong>{summary.lowStockCount || 0}</strong>
        </article>
      </div>

      <nav className="admin-tabs" aria-label={t('admin.kicker')}>
        {adminTabs.map((tab) => {
          const Icon = tab.icon
          return (
            <NavLink
              key={tab.id}
              to={tab.path || `/admin/${tab.id}`}
              className={({ isActive }) => (isActive || section === tab.id ? 'is-active' : '')}
            >
              <Icon size={17} />
              {t(tab.labelKey)}
            </NavLink>
          )
        })}
      </nav>

      {section === 'overview' && (
        <AdminOverviewSection
          handleStatsFilterSubmit={handleStatsFilterSubmit}
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
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-kicker"><ClipboardList size={15} /> {t('admin.orders')}</p>
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
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin.orderCode')}</th>
                  <th>{t('admin.customer')}</th>
                  <th>{t('admin.createdAt')}</th>
                  <th>{t('admin.items')}</th>
                  <th>{t('admin.paymentMethod')}</th>
                  <th>{t('admin.total')}</th>
                  <th>{t('admin.status')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="admin-clickable-row" onClick={() => setSelectedOrder(order)}>
                    <td data-label={t('admin.orderCode')}>
                      <button
                        type="button"
                        className="admin-inline-link"
                        onClick={(event) => {
                          event.stopPropagation()
                          setSelectedOrder(order)
                        }}
                      >
                        {order.id}
                      </button>
                    </td>
                    <td data-label={t('admin.customer')}>
                      <button
                        type="button"
                        className="admin-customer-link-cell"
                        onClick={(event) => {
                          event.stopPropagation()
                          openAdminCustomer(order.customer)
                        }}
                      >
                        <strong>{order.customer.name}</strong>
                        <small>{order.customer.email}</small>
                        <small>{order.customer.address}</small>
                      </button>
                    </td>
                    <td data-label={t('admin.createdAt')}>{formatAdminDate(order.createdAt, language, t('admin.noInfo'))}</td>
                    <td data-label={t('admin.items')}>
                      <button
                        type="button"
                        className="admin-inline-link"
                        onClick={(event) => {
                          event.stopPropagation()
                          setSelectedOrder(order)
                        }}
                      >
                        {t('admin.productCount', { count: order.items.length })}
                      </button>
                    </td>
                    <td data-label={t('admin.paymentMethod')}><strong>{order.payment || t('admin.noInfo')}</strong></td>
                    <td data-label={t('admin.total')}>{formatCurrency(order.total)}</td>
                    <td data-label={t('admin.status')}>
                      <select
                        value={order.status}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => handleOrderStatus(order.id, event.target.value)}
                      >
                        {orderStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr className="admin-empty-row">
                    <td colSpan="7" data-label="">{orders.length === 0 ? t('admin.noOrders') : t('admin.noFilterResults')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {section === 'products' && (
        <InventoryAdminSection reloadKey={inventoryReloadKey} showAdminToast={showAdminToast} />
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
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-kicker"><UserCog size={15} /> {t('admin.users')}</p>
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
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin.customer')}</th>
                  <th>Email</th>
                  <th>{t('admin.phone')}</th>
                  <th>{t('account.address')}</th>
                  <th>{t('admin.createdAt')}</th>
                  <th>{t('admin.role')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td data-label={t('admin.customer')}>
                      <div className="admin-user-cell">
                        <span className="admin-user-avatar" aria-hidden="true">
                          {user.avatar ? <img src={user.avatar} alt="" /> : user.name?.slice(0, 1).toUpperCase() || '?'}
                        </span>
                        <strong>{user.name}</strong>
                      </div>
                    </td>
                    <td data-label="Email">{user.email}</td>
                    <td data-label={t('admin.phone')}>{user.phone || t('admin.noInfo')}</td>
                    <td data-label={t('account.address')}>
                      <strong>{user.address || t('admin.noInfo')}</strong>
                      <small>{t('account.addressCount', { count: user.shippingAddresses?.length || 0 })}</small>
                    </td>
                    <td data-label={t('admin.createdAt')}>{formatAdminDate(user.createdAt, language, t('admin.noInfo'))}</td>
                    <td data-label={t('admin.role')}>
                      <select value={user.role} onChange={(event) => handleUserRole(user.id, event.target.value)}>
                        <option value="customer">{t('admin.roleCustomer')}</option>
                        <option value="admin">{t('admin.roleAdmin')}</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr className="admin-empty-row">
                    <td colSpan="6" data-label="">{users.length === 0 ? t('admin.noUsers') : t('admin.noFilterResults')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {section === 'contacts' && (
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-kicker"><Inbox size={15} /> {t('admin.contacts')}</p>
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
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin.customer')}</th>
                  <th>{t('admin.topic')}</th>
                  <th>{t('admin.message')}</th>
                  <th>{t('admin.sentAt')}</th>
                  <th>{t('admin.status')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((contact) => (
                  <tr key={contact.id}>
                    <td data-label={t('admin.customer')}>
                      <strong>{contact.name}</strong>
                      <small>{contact.email}</small>
                      <small>{contact.phone || t('admin.noPhone')}</small>
                    </td>
                    <td data-label={t('admin.topic')}>{contact.topic}</td>
                    <td data-label={t('admin.message')}>{contact.message}</td>
                    <td data-label={t('admin.sentAt')}>{formatAdminDate(contact.createdAt, language, t('admin.noInfo'))}</td>
                    <td data-label={t('admin.status')}>
                      <select value={contact.status} onChange={(event) => handleContactStatus(contact.id, event.target.value)}>
                        {contactStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {filteredContacts.length === 0 && (
                  <tr className="admin-empty-row">
                    <td colSpan="5" data-label="">{contacts.length === 0 ? t('admin.noContacts') : t('admin.noFilterResults')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {section === 'reviews' && (
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-kicker"><MessageSquare size={15} /> {t('admin.reviews')}</p>
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
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin.product')}</th>
                  <th>{t('admin.customer')}</th>
                  <th>{t('admin.rating')}</th>
                  <th>{t('admin.message')}</th>
                  <th>{t('admin.createdAt')}</th>
                  <th>{t('admin.tableActions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.map((review) => (
                  <tr key={review.id}>
                    <td data-label={t('admin.product')}>
                      <div className="admin-product-cell">
                        {review.productImage && <img src={review.productImage} alt={review.productName} />}
                        <strong>{review.productName}</strong>
                        <small>#{review.productId}</small>
                      </div>
                    </td>
                    <td data-label={t('admin.customer')}>
                      <strong>{review.name}</strong>
                      <small>{review.userEmail || t('admin.noInfo')}</small>
                    </td>
                    <td data-label={t('admin.rating')}>
                      <span className="admin-rating-stars" aria-label={t('product.star', { count: review.rating })}>
                        {Array.from({ length: 5 }, (_, index) => (
                          <Star key={index} size={15} fill="currentColor" className={index < review.rating ? 'is-active' : ''} />
                        ))}
                      </span>
                    </td>
                    <td data-label={t('admin.message')}>{review.comment}</td>
                    <td data-label={t('admin.createdAt')}>{formatAdminDate(review.createdAt, language, t('admin.noInfo'))}</td>
                    <td data-label={t('admin.tableActions')}>
                      <div className="admin-actions">
                        <button type="button" className="danger" onClick={() => setDeleteReviewTarget(review)}>
                          <Trash2 size={15} />
                          {t('admin.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredReviews.length === 0 && (
                  <tr className="admin-empty-row">
                    <td colSpan="6" data-label="">{adminReviews.length === 0 ? t('admin.noReviews') : t('admin.noFilterResults')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {section === 'overview' && lowStockProducts.length > 0 && (
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-kicker"><AlertTriangle size={15} /> {t('admin.stock')}</p>
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
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin.product')}</th>
                  <th>{t('admin.category')}</th>
                  <th>{t('admin.price')}</th>
                  <th>{t('admin.stock')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredLowStockProducts.map((product) => (
                  <tr key={product.id}>
                    <td data-label={t('admin.product')}>
                      <div className="admin-product-cell">
                        <img src={product.image} alt={product.name} />
                        <strong>{product.name}</strong>
                      </div>
                    </td>
                    <td data-label={t('admin.category')}>{formatCategoryLabel(product.category)}</td>
                    <td data-label={t('admin.price')}>{formatCurrency(product.price)}</td>
                    <td data-label={t('admin.stock')}>{product.stock}</td>
                  </tr>
                ))}
                {filteredLowStockProducts.length === 0 && (
                  <tr className="admin-empty-row">
                    <td colSpan="4" data-label="">{t('admin.noFilterResults')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {deleteReviewTarget && (
        <div className="admin-dialog-backdrop" role="presentation">
          <section className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-review-title">
            <div className="admin-dialog-icon">
              <AlertTriangle size={24} />
            </div>
            <div className="admin-dialog-copy">
              <h2 id="delete-review-title">{t('admin.deleteReviewQuestion')}</h2>
              <p>
                {t('admin.deleteReviewText', { name: deleteReviewTarget.productName })}
              </p>
            </div>
            <div className="admin-dialog-actions">
              <button type="button" onClick={() => setDeleteReviewTarget(null)}>{t('admin.cancelDelete')}</button>
              <button type="button" className="danger" onClick={confirmDeleteReview}>
                <Trash2 size={16} />
                {t('admin.delete')}
              </button>
            </div>
          </section>
        </div>
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
