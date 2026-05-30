import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Inbox,
  Info,
  MessageSquare,
  PackagePlus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  ShoppingBag,
  Star,
  Trash2,
  Truck,
  UserCog,
  Users,
  X,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'

import { useLanguage } from '../i18n/LanguageContext'
import { shopApi } from '../services/shopApi'
import { formatCategoryLabel } from '../utils/categoryLabel'
import { formatCurrency } from '../utils/currency'

const orderStatusOptions = [
  { value: 'confirmed', labelKey: 'admin.orderStatus.confirmed' },
  { value: 'paid', labelKey: 'admin.orderStatus.paid' },
  { value: 'shipping', labelKey: 'admin.orderStatus.shipping' },
  { value: 'completed', labelKey: 'admin.orderStatus.completed' },
  { value: 'cancelled', labelKey: 'admin.orderStatus.cancelled' },
]

const contactStatusOptions = [
  { value: 'new', labelKey: 'admin.contactStatus.new' },
  { value: 'processing', labelKey: 'admin.contactStatus.processing' },
  { value: 'done', labelKey: 'admin.contactStatus.done' },
]

const adminTabs = [
  { id: 'overview', labelKey: 'admin.overview', icon: BarChart3 },
  { id: 'orders', labelKey: 'admin.orders', icon: ClipboardList },
  { id: 'products', labelKey: 'admin.products', icon: Boxes },
  { id: 'users', labelKey: 'admin.users', icon: Users },
  { id: 'contacts', labelKey: 'admin.contacts', icon: Inbox },
  { id: 'reviews', labelKey: 'admin.reviews', icon: MessageSquare },
]

const emptyProductForm = {
  name: '',
  category: '',
  newCategory: '',
  price: '',
  stock: '',
  image: '',
  description: '',
}
const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024

const emptyStatsFilters = {
  mode: 'month',
  month: '',
  startDate: '',
  endDate: '',
}

const emptyAdminFilters = {
  orders: { query: '', status: 'all', minTotal: '', maxTotal: '' },
  products: { query: '', category: 'all', stock: 'all', minPrice: '', maxPrice: '' },
  users: { query: '', role: 'all', address: 'all' },
  contacts: { query: '', status: 'all' },
  reviews: { query: '', rating: 'all' },
  lowStock: { query: '', category: 'all' },
}

function formatDate(value, language, emptyText) {
  if (!value) return emptyText
  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function matchesSearch(fields, query) {
  const keyword = normalizeText(query).trim()
  if (!keyword) return true
  return fields.some((field) => normalizeText(field).includes(keyword))
}

function isWithinNumberRange(value, minValue, maxValue) {
  const number = Number(value) || 0
  const min = minValue === '' ? null : Number(minValue)
  const max = maxValue === '' ? null : Number(maxValue)

  return (min === null || number >= min) && (max === null || number <= max)
}

function notifyCatalogChanged() {
  window.dispatchEvent(new Event('marseille04:catalog-changed'))
}

function notifyReviewsChanged() {
  window.dispatchEvent(new Event('marseille04:reviews-changed'))
}

function buildSummaryParams(filters) {
  if (filters.mode === 'month') {
    return filters.month ? { month: filters.month } : {}
  }

  return {
    startDate: filters.startDate,
    endDate: filters.endDate,
  }
}

function maxValue(items, key) {
  return Math.max(1, ...items.map((item) => Number(item[key]) || 0))
}

function BarChartList({ items, valueKey, labelKey, valueFormatter, emptyText }) {
  if (items.length === 0) {
    return <div className="admin-empty">{emptyText}</div>
  }

  const max = maxValue(items, valueKey)

  return (
    <div className="admin-bar-chart">
      {items.slice(0, 5).map((item) => {
        const value = Number(item[valueKey]) || 0
        const width = Math.max(6, Math.round((value / max) * 100))
        return (
          <article key={item[labelKey]}>
            <div>
              <span>{item[labelKey]}</span>
              <strong>{valueFormatter(value, item)}</strong>
            </div>
            <div className="admin-bar-track" aria-hidden="true">
              <i style={{ width: `${width}%` }} />
            </div>
          </article>
        )
      })}
    </div>
  )
}

function AdminToast({ toast, onClose, closeLabel }) {
  if (!toast.message) return null

  const Icon = toast.type === 'error' ? AlertTriangle : toast.type === 'info' ? Info : CheckCircle2

  return (
    <div className={`admin-toast admin-toast-${toast.type}`} role="status" aria-live="polite">
      <Icon size={22} />
      <div>
        <strong>{toast.title}</strong>
        <p>{toast.message}</p>
      </div>
      <button type="button" aria-label={closeLabel} onClick={onClose}>
        <X size={18} />
      </button>
    </div>
  )
}

function AdminFilterPanel({ children, className = '', clearLabel, onClear, title }) {
  return (
    <div className={`admin-filter-panel ${className}`.trim()}>
      <div className="admin-filter-title">
        <SlidersHorizontal size={16} />
        <strong>{title}</strong>
      </div>
      <div className="admin-filter-controls">
        {children}
      </div>
      <button type="button" className="admin-filter-clear" onClick={onClear}>
        <X size={15} />
        {clearLabel}
      </button>
    </div>
  )
}

function AdminSearchInput({ onChange, placeholder, value }) {
  return (
    <label className="admin-filter-search">
      <span>{placeholder}</span>
      <div>
        <Search size={16} />
        <input
          type="search"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </label>
  )
}

function StoreAdminPage({ section = 'overview' }) {
  const { language, t } = useLanguage()
  const navigate = useNavigate()
  const [summaryData, setSummaryData] = useState(null)
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [users, setUsers] = useState([])
  const [contacts, setContacts] = useState([])
  const [adminReviews, setAdminReviews] = useState([])
  const [productForm, setProductForm] = useState(emptyProductForm)
  const [productImageFile, setProductImageFile] = useState(null)
  const [productImagePreview, setProductImagePreview] = useState('')
  const [editingProductId, setEditingProductId] = useState(null)
  const [deleteProductTarget, setDeleteProductTarget] = useState(null)
  const [deleteReviewTarget, setDeleteReviewTarget] = useState(null)
  const [toast, setToast] = useState({ message: '', title: '', type: 'success' })
  const [isLoading, setIsLoading] = useState(true)
  const [statsFilters, setStatsFilters] = useState(emptyStatsFilters)
  const [summaryParams, setSummaryParams] = useState({})
  const [overviewView, setOverviewView] = useState('list')
  const [adminFilters, setAdminFilters] = useState(emptyAdminFilters)
  const productFormPanelRef = useRef(null)

  const summary = summaryData?.summary || {}
  const lowStockProducts = summaryData?.lowStockProducts || []
  const monthlyRevenue = summaryData?.monthlyRevenue || []
  const topProducts = summaryData?.topProducts || []
  const leastProducts = summaryData?.leastProducts || []
  const topCustomers = summaryData?.topCustomers || []
  const productCategories = useMemo(
    () => [...new Set(products.map((product) => product.category).filter(Boolean))].sort(),
    [products],
  )
  const lowStockCategories = useMemo(
    () => [...new Set(lowStockProducts.map((product) => product.category).filter(Boolean))].sort(),
    [lowStockProducts],
  )

  const awaitingOrders = useMemo(
    () => orders.filter((order) => ['confirmed', 'paid', 'shipping'].includes(order.status)).length,
    [orders],
  )

  const filteredOrders = useMemo(() => {
    const filters = adminFilters.orders
    return orders.filter((order) => {
      const orderItems = order.items?.map((item) => item.name || item.productName || item.product?.name).join(' ') || ''
      return (
        matchesSearch([
          order.id,
          order.customer?.name,
          order.customer?.email,
          order.customer?.address,
          order.status,
          orderItems,
          formatDate(order.createdAt, language, ''),
        ], filters.query) &&
        (filters.status === 'all' || order.status === filters.status) &&
        isWithinNumberRange(order.total, filters.minTotal, filters.maxTotal)
      )
    })
  }, [adminFilters.orders, language, orders])

  const filteredProducts = useMemo(() => {
    const filters = adminFilters.products
    return products.filter((product) => {
      const matchesStock =
        filters.stock === 'all' ||
        (filters.stock === 'inStock' && Number(product.stock) > 5) ||
        (filters.stock === 'lowStock' && Number(product.stock) > 0 && Number(product.stock) <= 5) ||
        (filters.stock === 'outOfStock' && Number(product.stock) <= 0)

      return (
        matchesSearch([product.id, product.name, product.category, product.description], filters.query) &&
        (filters.category === 'all' || product.category === filters.category) &&
        matchesStock &&
        isWithinNumberRange(product.price, filters.minPrice, filters.maxPrice)
      )
    })
  }, [adminFilters.products, products])

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
    return contacts.filter((contact) => (
      matchesSearch([contact.name, contact.email, contact.phone, contact.topic, contact.message, contact.status], filters.query) &&
      (filters.status === 'all' || contact.status === filters.status)
    ))
  }, [adminFilters.contacts, contacts])

  const filteredReviews = useMemo(() => {
    const filters = adminFilters.reviews
    return adminReviews.filter((review) => (
      matchesSearch([review.productId, review.productName, review.name, review.userEmail, review.comment], filters.query) &&
      (filters.rating === 'all' || Number(review.rating) === Number(filters.rating))
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

  async function loadAdminData() {
    setIsLoading(true)
    try {
      const summaryResponse = await shopApi.getAdminSummary(summaryParams)
      setSummaryData(summaryResponse)

      if (section === 'orders') {
        const ordersResponse = await shopApi.listAdminOrders()
        setOrders(ordersResponse.orders)
      }

      if (section === 'products') {
        const productsResponse = await shopApi.listAdminProducts()
        setProducts(productsResponse.products)
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
    }
  }

  useEffect(() => {
    loadAdminData()
  }, [section, summaryParams])

  useEffect(() => {
    return () => {
      if (productImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(productImagePreview)
      }
    }
  }, [productImagePreview])

  useEffect(() => {
    if (!toast.message) return undefined

    const timer = window.setTimeout(() => {
      setToast({ message: '', title: '', type: 'success' })
    }, 3600)

    return () => window.clearTimeout(timer)
  }, [toast])

  function resetProductForm() {
    setEditingProductId(null)
    setProductForm(emptyProductForm)
    setProductImageFile(null)
    setProductImagePreview('')
  }

  function handleStatsFilterSubmit(event) {
    event.preventDefault()
    setSummaryParams(buildSummaryParams(statsFilters))
  }

  function resetStatsFilters() {
    setStatsFilters(emptyStatsFilters)
    setSummaryParams({})
  }

  function editProduct(product) {
    setEditingProductId(product.id)
    setProductForm({
      name: product.name,
      category: product.category,
      newCategory: '',
      price: product.price,
      stock: product.stock,
      image: product.image,
      description: product.description,
    })
    setProductImageFile(null)
    setProductImagePreview(product.image)

    if (window.matchMedia('(max-width: 680px)').matches) {
      window.requestAnimationFrame(() => {
        productFormPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }

  function handleProductImageChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
      event.target.value = ''
      showAdminToast(t('admin.imageTooLarge'), 'error')
      return
    }

    setProductImageFile(file)
    setProductImagePreview(URL.createObjectURL(file))
  }

  async function handleProductSubmit(event) {
    event.preventDefault()
    try {
      let image = productForm.image
      if (productImageFile) {
        const upload = await shopApi.uploadProductImage(productImageFile)
        image = upload.url
      }

      const payload = {
        ...productForm,
        category: productForm.category === '__new__' ? productForm.newCategory.trim() : productForm.category,
        image,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
      }
      delete payload.newCategory

      const data = editingProductId
        ? await shopApi.updateAdminProduct(editingProductId, payload)
        : await shopApi.createAdminProduct(payload)

      setProducts((current) => {
        if (!editingProductId) return [...current, data.product].sort((first, second) => first.id - second.id)
        return current.map((product) => (product.id === data.product.id ? data.product : product))
      })
      showAdminToast(data.message)
      resetProductForm()
      notifyCatalogChanged()
    } catch (error) {
      showAdminToast(error.message, 'error')
    }
  }

  async function confirmDeleteProduct() {
    if (!deleteProductTarget) return
    try {
      const data = await shopApi.deleteAdminProduct(deleteProductTarget.id)
      setProducts((current) => current.filter((product) => product.id !== deleteProductTarget.id))
      showAdminToast(data.message)
      setDeleteProductTarget(null)
      notifyCatalogChanged()
    } catch (error) {
      showAdminToast(error.message, 'error')
    }
  }

  async function handleOrderStatus(orderCode, status) {
    try {
      const data = await shopApi.updateOrderStatus(orderCode, status)
      setOrders((current) => current.map((order) => (order.id === orderCode ? data.order : order)))
      showAdminToast(data.message)
    } catch (error) {
      showAdminToast(error.message, 'error')
    }
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
        <button className="admin-refresh" onClick={loadAdminData} disabled={isLoading}>
          <RefreshCw size={17} />
          {t('admin.refresh')}
        </button>
      </div>

      <AdminToast
        toast={toast}
        closeLabel={t('admin.closeToast')}
        onClose={() => setToast({ message: '', title: '', type: 'success' })}
      />

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
          <strong>{awaitingOrders || summary.pendingOrderCount || 0}</strong>
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
              to={`/admin/${tab.id}`}
              className={({ isActive }) => (isActive || section === tab.id ? 'is-active' : '')}
            >
              <Icon size={17} />
              {t(tab.labelKey)}
            </NavLink>
          )
        })}
      </nav>

      {section === 'overview' && (
        <section className="admin-panel admin-report-filter">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-kicker"><BarChart3 size={15} /> {t('admin.reportFilter')}</p>
              <h2>{t('admin.periodStats')}</h2>
            </div>
            <span>{summaryData?.period?.hasFilter ? summaryData.period.label : t('admin.periodAll')}</span>
          </div>
          <form className="admin-report-form" onSubmit={handleStatsFilterSubmit}>
            <label>
              {t('admin.periodType')}
              <select
                value={statsFilters.mode}
                onChange={(event) => setStatsFilters((current) => ({ ...current, mode: event.target.value }))}
              >
                <option value="month">{t('admin.periodMonth')}</option>
                <option value="range">{t('admin.periodRange')}</option>
              </select>
            </label>
            {statsFilters.mode === 'month' ? (
              <label>
                {t('admin.month')}
                <input
                  type="month"
                  value={statsFilters.month}
                  onChange={(event) => setStatsFilters((current) => ({ ...current, month: event.target.value }))}
                />
              </label>
            ) : (
              <>
                <label>
                  {t('admin.startDate')}
                  <input
                    type="date"
                    value={statsFilters.startDate}
                    onChange={(event) => setStatsFilters((current) => ({ ...current, startDate: event.target.value }))}
                  />
                </label>
                <label>
                  {t('admin.endDate')}
                  <input
                    type="date"
                    value={statsFilters.endDate}
                    onChange={(event) => setStatsFilters((current) => ({ ...current, endDate: event.target.value }))}
                  />
                </label>
              </>
            )}
            <div className="admin-report-actions">
              <button className="primary-action" type="submit">{t('admin.applyStats')}</button>
              <button type="button" onClick={resetStatsFilters}>{t('admin.clearStats')}</button>
            </div>
          </form>
        </section>
      )}

      {section === 'overview' && (
        <div className="admin-overview-grid">
          <div className="admin-view-toggle" role="group" aria-label={t('admin.chartView')}>
            <button
              type="button"
              className={overviewView === 'list' ? 'is-active' : ''}
              onClick={() => setOverviewView('list')}
            >
              {t('admin.listView')}
            </button>
            <button
              type="button"
              className={overviewView === 'chart' ? 'is-active' : ''}
              onClick={() => setOverviewView('chart')}
            >
              {t('admin.chartView')}
            </button>
          </div>
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <p className="admin-kicker"><BarChart3 size={15} /> {t('admin.stats')}</p>
                <h2>{t('admin.stats')}</h2>
              </div>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t('admin.metric')}</th>
                    <th>{t('admin.value')}</th>
                    <th>{t('admin.note')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td data-label={t('admin.metric')}>{t('admin.averageOrder')}</td>
                    <td data-label={t('admin.value')}>{formatCurrency(summary.averageOrder || 0)}</td>
                    <td data-label={t('admin.note')}>{t('admin.noCancelled')}</td>
                  </tr>
                  <tr>
                    <td data-label={t('admin.metric')}>Admin</td>
                    <td data-label={t('admin.value')}>{summary.adminCount || 0}</td>
                    <td data-label={t('admin.note')}>{t('admin.adminCountNote')}</td>
                  </tr>
                  <tr>
                    <td data-label={t('admin.metric')}>{t('admin.newContact')}</td>
                    <td data-label={t('admin.value')}>{summary.newContactCount || 0}</td>
                    <td data-label={t('admin.note')}>{t('admin.newContactNote')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <div className="admin-overview-insights">
            <section className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <p className="admin-kicker"><ShoppingBag size={15} /> {t('admin.revenue')}</p>
                  <h2>{t('admin.revenueByMonth')}</h2>
                </div>
              </div>
              <div className="admin-mini-list">
                {monthlyRevenue.length === 0 ? (
                  <div className="admin-empty">{t('admin.noRevenue')}</div>
                ) : overviewView === 'chart' ? (
                  <BarChartList
                    items={monthlyRevenue}
                    valueKey="revenue"
                    labelKey="month"
                    valueFormatter={(value) => formatCurrency(value)}
                    emptyText={t('admin.noRevenue')}
                  />
                ) : (
                  monthlyRevenue.slice(0, 5).map((item, index) => (
                    <article key={item.month} className="admin-rank-item">
                      <b>{index + 1}</b>
                      <div>
                        <span>{item.month}</span>
                        <strong>{formatCurrency(item.revenue)}</strong>
                        <p>{t('admin.orderCount', { count: item.count })}</p>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <p className="admin-kicker"><Boxes size={15} /> {t('admin.topSelling')}</p>
                  <h2>{t('admin.topProducts')}</h2>
                </div>
              </div>
              <div className="admin-mini-list">
                {topProducts.length === 0 ? (
                  <div className="admin-empty">{t('admin.noTopProducts')}</div>
                ) : overviewView === 'chart' ? (
                  <BarChartList
                    items={topProducts}
                    valueKey="quantity"
                    labelKey="name"
                    valueFormatter={(value, item) => `${t('admin.soldCount', { count: value })} | ${formatCurrency(item.revenue)}`}
                    emptyText={t('admin.noTopProducts')}
                  />
                ) : (
                  topProducts.slice(0, 5).map((product, index) => (
                    <article key={product.productId} className="admin-rank-item">
                      <b>{index + 1}</b>
                      <div>
                        <span>{t('admin.soldCount', { count: product.quantity })}</span>
                        <strong>{product.name}</strong>
                        <p>{formatCurrency(product.revenue)}</p>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <p className="admin-kicker"><Boxes size={15} /> {t('admin.lowSelling')}</p>
                  <h2>{t('admin.leastProducts')}</h2>
                </div>
              </div>
              <div className="admin-mini-list">
                {leastProducts.length === 0 ? (
                  <div className="admin-empty">{t('admin.noLowProducts')}</div>
                ) : overviewView === 'chart' ? (
                  <BarChartList
                    items={leastProducts}
                    valueKey="quantity"
                    labelKey="name"
                    valueFormatter={(value, item) => `${t('admin.soldCount', { count: value })} | ${formatCurrency(item.revenue)}`}
                    emptyText={t('admin.noLowProducts')}
                  />
                ) : (
                  leastProducts.slice(0, 5).map((product, index) => (
                    <article key={product.productId} className="admin-rank-item">
                      <b>{index + 1}</b>
                      <div>
                        <span>{t('admin.soldCount', { count: product.quantity })}</span>
                        <strong>{product.name}</strong>
                        <p>{formatCurrency(product.revenue)}</p>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <p className="admin-kicker"><Users size={15} /> {t('admin.topCustomers')}</p>
                  <h2>{t('admin.topCustomers')}</h2>
                </div>
              </div>
              <div className="admin-mini-list">
                {topCustomers.length === 0 ? (
                  <div className="admin-empty">{t('admin.noTopCustomers')}</div>
                ) : overviewView === 'chart' ? (
                  <BarChartList
                    items={topCustomers}
                    valueKey="totalSpent"
                    labelKey="name"
                    valueFormatter={(value, item) => `${formatCurrency(value)} | ${t('admin.orderCount', { count: item.orderCount })}`}
                    emptyText={t('admin.noTopCustomers')}
                  />
                ) : (
                  topCustomers.slice(0, 5).map((customer, index) => (
                    <article key={customer.email} className="admin-rank-item">
                      <b>{index + 1}</b>
                      <div>
                        <span>{t('admin.customerSpent')}</span>
                        <strong>{customer.name}</strong>
                        <p>{customer.email}</p>
                        <p>{formatCurrency(customer.totalSpent)} | {t('admin.orderCount', { count: customer.orderCount })} | {t('admin.itemCount', { count: customer.itemCount })}</p>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
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
                {orderStatusOptions.map((option) => (
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
          </AdminFilterPanel>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin.orderCode')}</th>
                  <th>{t('admin.customer')}</th>
                  <th>{t('admin.createdAt')}</th>
                  <th>{t('admin.items')}</th>
                  <th>{t('admin.total')}</th>
                  <th>{t('admin.status')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td data-label={t('admin.orderCode')}><strong>{order.id}</strong></td>
                    <td data-label={t('admin.customer')}>
                      <strong>{order.customer.name}</strong>
                      <small>{order.customer.email}</small>
                      <small>{order.customer.address}</small>
                    </td>
                    <td data-label={t('admin.createdAt')}>{formatDate(order.createdAt, language, t('admin.noInfo'))}</td>
                    <td data-label={t('admin.items')}>{t('admin.productCount', { count: order.items.length })}</td>
                    <td data-label={t('admin.total')}>{formatCurrency(order.total)}</td>
                    <td data-label={t('admin.status')}>
                      <select value={order.status} onChange={(event) => handleOrderStatus(order.id, event.target.value)}>
                        {orderStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr className="admin-empty-row">
                    <td colSpan="6" data-label="">{orders.length === 0 ? t('admin.noOrders') : t('admin.noFilterResults')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {section === 'products' && (
        <div className="admin-grid">
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <p className="admin-kicker"><Boxes size={15} /> {t('admin.products')}</p>
                <h2>{t('admin.catalogTable')}</h2>
              </div>
              <span>{t('admin.filteredCount', { shown: filteredProducts.length, total: products.length })}</span>
            </div>
            <AdminFilterPanel
              className="admin-product-filter"
              title={t('admin.filters')}
              clearLabel={t('admin.clearFilters')}
              onClear={() => resetAdminFilter('products')}
            >
              <AdminSearchInput
                value={adminFilters.products.query}
                placeholder={t('admin.searchProducts')}
                onChange={(value) => updateAdminFilter('products', 'query', value)}
              />
              <label>
                {t('admin.category')}
                <select
                  value={adminFilters.products.category}
                  onChange={(event) => updateAdminFilter('products', 'category', event.target.value)}
                >
                  <option value="all">{t('shop.allCategories')}</option>
                  {productCategories.map((category) => (
                    <option key={category} value={category}>{formatCategoryLabel(category)}</option>
                  ))}
                </select>
              </label>
              <label>
                {t('admin.stock')}
                <select
                  value={adminFilters.products.stock}
                  onChange={(event) => updateAdminFilter('products', 'stock', event.target.value)}
                >
                  <option value="all">{t('admin.allStock')}</option>
                  <option value="inStock">{t('admin.stockInStock')}</option>
                  <option value="lowStock">{t('admin.stockLow')}</option>
                  <option value="outOfStock">{t('admin.stockOut')}</option>
                </select>
              </label>
              <label>
                {t('admin.minPrice')}
                <input
                  type="number"
                  min="0"
                  value={adminFilters.products.minPrice}
                  onChange={(event) => updateAdminFilter('products', 'minPrice', event.target.value)}
                />
              </label>
              <label>
                {t('admin.maxPrice')}
                <input
                  type="number"
                  min="0"
                  value={adminFilters.products.maxPrice}
                  onChange={(event) => updateAdminFilter('products', 'maxPrice', event.target.value)}
                />
              </label>
            </AdminFilterPanel>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t('admin.product')}</th>
                    <th>{t('admin.category')}</th>
                    <th>{t('admin.price')}</th>
                    <th>{t('admin.stockShort')}</th>
                    <th>{t('admin.rating')}</th>
                    <th>{t('admin.tableActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td data-label={t('admin.product')}>
                        <div className="admin-product-cell">
                          <img src={product.image} alt={product.name} />
                          <strong>{product.name}</strong>
                        </div>
                      </td>
                      <td data-label={t('admin.category')}>{formatCategoryLabel(product.category)}</td>
                      <td data-label={t('admin.price')}>{formatCurrency(product.price)}</td>
                      <td data-label={t('admin.stockShort')}>{product.stock}</td>
                      <td data-label={t('admin.rating')}>{product.rating}</td>
                      <td data-label={t('admin.tableActions')}>
                        <div className="admin-actions">
                          <button type="button" onClick={() => editProduct(product)}><Save size={15} /> {t('admin.edit')}</button>
                          <button type="button" className="danger" onClick={() => setDeleteProductTarget(product)}>
                            <Trash2 size={15} />
                            {t('admin.delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr className="admin-empty-row">
                      <td colSpan="6" data-label="">{products.length === 0 ? t('admin.noProducts') : t('admin.noFilterResults')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="admin-panel admin-product-form-panel" ref={productFormPanelRef}>
            <div className="admin-panel-heading">
              <div>
                <p className="admin-kicker"><PackagePlus size={15} /> {t('admin.formCatalog')}</p>
                <h2>{editingProductId ? t('admin.editProduct') : t('admin.addProduct')}</h2>
              </div>
              {editingProductId && (
                <button className="admin-icon-button" type="button" onClick={resetProductForm} aria-label={t('admin.cancelEdit')}>
                  <X size={17} />
                </button>
              )}
            </div>
            <form className="admin-form" onSubmit={handleProductSubmit}>
              <label>
                {t('admin.productName')}
                <input
                  value={productForm.name}
                  onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </label>
              <label>
                {t('admin.category')}
                <select
                  value={productForm.category}
                  onChange={(event) => setProductForm((current) => ({ ...current, category: event.target.value }))}
                  required
                >
                  <option value="">{t('admin.chooseCategory')}</option>
                  {productCategories.map((category) => (
                    <option key={category} value={category}>{formatCategoryLabel(category)}</option>
                  ))}
                  <option value="__new__">+ {t('admin.newCategory')}</option>
                </select>
              </label>
              {productForm.category === '__new__' && (
                <label>
                  {t('admin.newCategory')}
                  <input
                    value={productForm.newCategory}
                    onChange={(event) => setProductForm((current) => ({ ...current, newCategory: event.target.value }))}
                    required
                  />
                </label>
              )}
              <label>
                {t('admin.price')}
                <input
                  type="number"
                  min="0"
                  value={productForm.price}
                  onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))}
                  required
                />
              </label>
              <label>
                {t('admin.stock')}
                <input
                  type="number"
                  min="0"
                  value={productForm.stock}
                  onChange={(event) => setProductForm((current) => ({ ...current, stock: event.target.value }))}
                  required
                />
              </label>
              <label>
                {t('admin.productImage')}
                <input type="file" accept="image/*" onChange={handleProductImageChange} required={!editingProductId && !productForm.image} />
              </label>
              {(productImagePreview || productForm.image) && (
                <div className="admin-image-preview">
                  <img src={productImagePreview || productForm.image} alt={t('admin.productImage')} />
                  <span>{productImageFile ? productImageFile.name : t('admin.savedImage')}</span>
                </div>
              )}
              <label>
                {t('admin.description')}
                <textarea
                  value={productForm.description}
                  onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))}
                  required
                />
              </label>
              <button className="primary-action"><Save size={17} /> {editingProductId ? t('admin.saveProduct') : t('admin.addProduct')}</button>
            </form>
          </aside>
        </div>
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
                    <td data-label={t('admin.customer')}><strong>{user.name}</strong></td>
                    <td data-label="Email">{user.email}</td>
                    <td data-label={t('admin.phone')}>{user.phone || t('admin.noInfo')}</td>
                    <td data-label={t('account.address')}>
                      <strong>{user.address || t('admin.noInfo')}</strong>
                      <small>{t('account.addressCount', { count: user.shippingAddresses?.length || 0 })}</small>
                    </td>
                    <td data-label={t('admin.createdAt')}>{formatDate(user.createdAt, language, t('admin.noInfo'))}</td>
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
                {contactStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
                ))}
              </select>
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
                    <td data-label={t('admin.sentAt')}>{formatDate(contact.createdAt, language, t('admin.noInfo'))}</td>
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
                    <td data-label={t('admin.createdAt')}>{formatDate(review.createdAt, language, t('admin.noInfo'))}</td>
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

      {deleteProductTarget && (
        <div className="admin-dialog-backdrop" role="presentation">
          <section className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-product-title">
            <div className="admin-dialog-icon">
              <AlertTriangle size={24} />
            </div>
            <div className="admin-dialog-copy">
              <h2 id="delete-product-title">{t('admin.deleteProductQuestion')}</h2>
              <p>
                {t('admin.deleteProductText', { name: deleteProductTarget.name })}
              </p>
            </div>
            <div className="admin-dialog-actions">
              <button type="button" onClick={() => setDeleteProductTarget(null)}>{t('admin.cancelDelete')}</button>
              <button type="button" className="danger" onClick={confirmDeleteProduct}>
                <Trash2 size={16} />
                {t('admin.deleteProduct')}
              </button>
            </div>
          </section>
        </div>
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
    </section>
  )
}

export default StoreAdminPage
