import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, ChevronDown, PackageSearch, Search, ShoppingBag, UserRoundCheck, X } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { formatCurrency } from '../../utils/currency'
import { shopApi } from '../../services/shopApi'
import { formatAdminDate } from './adminUtils'

const CUSTOMERS_PAGE_SIZE = 12
const CUSTOMER_ORDERS_PAGE_SIZE = 8
const initialPagination = {
  hasMore: false,
  limit: CUSTOMERS_PAGE_SIZE,
  page: 1,
  total: 0,
  totalPages: 1,
}

function getCurrentMonthValue() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function getMonthRange(monthValue) {
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

function mergeUniqueById(currentItems, nextItems) {
  const knownIds = new Set(currentItems.map((item) => item.id))
  return [...currentItems, ...nextItems.filter((item) => !knownIds.has(item.id))]
}

function getCustomerInitial(customer) {
  return String(customer.name || customer.email || '?').slice(0, 1).toUpperCase()
}

function AdminCustomersSection({ language, reloadKey = 0, showAdminToast, t }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const routeFilterKey = searchParams.toString()
  const [customers, setCustomers] = useState([])
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [periodMode, setPeriodMode] = useState('all')
  const [month, setMonth] = useState(getCurrentMonthValue())
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [focusedEmail, setFocusedEmail] = useState('')
  const [pagination, setPagination] = useState(initialPagination)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customerOrders, setCustomerOrders] = useState([])
  const [customerOrderPagination, setCustomerOrderPagination] = useState({
    ...initialPagination,
    limit: CUSTOMER_ORDERS_PAGE_SIZE,
  })
  const [isLoadingCustomerOrders, setIsLoadingCustomerOrders] = useState(false)
  const [isLoadingMoreCustomerOrders, setIsLoadingMoreCustomerOrders] = useState(false)
  const requestIdRef = useRef(0)
  const ordersRequestIdRef = useRef(0)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 420)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (!routeFilterKey) {
      setFocusedEmail('')
      return
    }

    const params = new URLSearchParams(routeFilterKey)
    const nextQuery = params.get('query') || params.get('focusEmail') || ''
    const nextFocusEmail = params.get('focusEmail') || ''
    setFocusedEmail(nextFocusEmail.toLowerCase())

    if (nextQuery) {
      setQuery(nextQuery)
      setDebouncedQuery(nextQuery.trim())
    }

    if (params.get('month')) {
      setPeriodMode('month')
      setMonth(params.get('month'))
      setStartDate('')
      setEndDate('')
      return
    }

    if (params.get('startDate') || params.get('endDate')) {
      setPeriodMode('range')
      setStartDate(params.get('startDate') || '')
      setEndDate(params.get('endDate') || '')
    }
  }, [routeFilterKey])

  const customerParams = useMemo(() => {
    const params = {
      limit: CUSTOMERS_PAGE_SIZE,
      page: 1,
      query: debouncedQuery,
    }

    if (periodMode === 'month') return { ...params, month }
    if (periodMode === 'range') return { ...params, endDate, startDate }
    return params
  }, [debouncedQuery, endDate, month, periodMode, startDate])

  function getOrderPeriodParams() {
    if (periodMode === 'month') return getMonthRange(month)
    if (periodMode === 'range') return { endDate, startDate }
    return {}
  }

  async function loadCustomers({ append = false, page = 1 } = {}) {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    if (append) setIsLoadingMore(true)
    else setIsLoading(true)

    try {
      const data = await shopApi.listAdminCustomers({ ...customerParams, page })
      if (requestId !== requestIdRef.current) return

      const nextCustomers = data.customers || []
      setCustomers((current) => (append ? mergeUniqueById(current, nextCustomers) : nextCustomers))
      setPagination(data.pagination || initialPagination)
    } catch (error) {
      if (requestId === requestIdRef.current) {
        showAdminToast(error.message, 'error')
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [customerParams, reloadKey])

  async function loadCustomerOrders(customer, { append = false, page = 1 } = {}) {
    const requestId = ordersRequestIdRef.current + 1
    ordersRequestIdRef.current = requestId

    if (append) setIsLoadingMoreCustomerOrders(true)
    else setIsLoadingCustomerOrders(true)

    try {
      const data = await shopApi.listAdminOrders({
        ...getOrderPeriodParams(),
        customerEmail: customer.email,
        dateField: 'updatedAt',
        limit: CUSTOMER_ORDERS_PAGE_SIZE,
        page,
        status: 'revenue',
      })
      if (requestId !== ordersRequestIdRef.current) return

      const nextOrders = data.orders || []
      setCustomerOrders((current) => (append ? mergeUniqueById(current, nextOrders) : nextOrders))
      setCustomerOrderPagination(data.pagination || { ...initialPagination, limit: CUSTOMER_ORDERS_PAGE_SIZE })
    } catch (error) {
      if (requestId === ordersRequestIdRef.current) {
        showAdminToast(error.message, 'error')
      }
    } finally {
      if (requestId === ordersRequestIdRef.current) {
        setIsLoadingCustomerOrders(false)
        setIsLoadingMoreCustomerOrders(false)
      }
    }
  }

  function openCustomer(customer) {
    setSelectedCustomer(customer)
    setCustomerOrders([])
    setCustomerOrderPagination({ ...initialPagination, limit: CUSTOMER_ORDERS_PAGE_SIZE })
    loadCustomerOrders(customer)
  }

  function closeCustomer() {
    setSelectedCustomer(null)
    setCustomerOrders([])
    ordersRequestIdRef.current += 1
  }

  function loadMoreCustomers() {
    if (!pagination.hasMore || isLoading || isLoadingMore) return
    loadCustomers({ append: true, page: Number(pagination.page || 1) + 1 })
  }

  function loadMoreCustomerOrders() {
    if (!selectedCustomer || !customerOrderPagination.hasMore || isLoadingCustomerOrders || isLoadingMoreCustomerOrders) return
    loadCustomerOrders(selectedCustomer, { append: true, page: Number(customerOrderPagination.page || 1) + 1 })
  }

  function openProduct(item) {
    const productId = item?.productId || ''
    const productQuery = productId || item?.name || ''
    const params = new URLSearchParams()
    if (productQuery) params.set('query', productQuery)
    if (productId) params.set('focusProductId', productId)

    closeCustomer()
    navigate(`/admin/inventory${params.toString() ? `?${params.toString()}` : ''}`)
  }

  return (
    <section className="admin-customers-section">
      <section className="admin-panel admin-customers-hero">
        <div>
          <p className="admin-kicker"><UserRoundCheck size={15} /> {t('admin.customers')}</p>
          <h2>{t('admin.customerConsumption')}</h2>
          <p>{t('admin.customerConsumptionText', { shown: customers.length, total: pagination.total || 0 })}</p>
        </div>
        <div className="admin-customer-search">
          <Search size={17} />
          <input
            type="search"
            value={query}
            placeholder={t('admin.searchCustomers')}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </section>

      <section className={`admin-panel admin-customer-filter-panel admin-customer-filter-${periodMode}`}>
        <div className="admin-customer-period-tabs" role="group" aria-label={t('admin.periodType')}>
          {[
            { key: 'all', label: t('admin.periodAll') },
            { key: 'month', label: t('admin.periodMonth') },
            { key: 'range', label: t('admin.periodRange') },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              className={periodMode === option.key ? 'is-active' : ''}
              onClick={() => setPeriodMode(option.key)}
            >
              <CalendarDays size={15} />
              {option.label}
            </button>
          ))}
        </div>
        {periodMode === 'month' && (
          <label>
            {t('admin.month')}
            <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          </label>
        )}
        {periodMode === 'range' && (
          <div className="admin-customer-date-grid">
            <label>
              {t('admin.startDate')}
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </label>
            <label>
              {t('admin.endDate')}
              <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </label>
          </div>
        )}
      </section>

      <div className="admin-customer-grid" aria-busy={isLoading}>
        {customers.map((customer, index) => {
          const isFocused = focusedEmail && String(customer.email || '').toLowerCase() === focusedEmail

          return (
          <article key={customer.id || customer.email} className={`admin-customer-card ${isFocused ? 'is-focused' : ''}`}>
            <button type="button" className="admin-customer-card-main" onClick={() => openCustomer(customer)}>
              <span className="admin-customer-rank">{index + 1}</span>
              <span className="admin-customer-avatar">
                {customer.avatar ? <img src={customer.avatar} alt="" /> : getCustomerInitial(customer)}
              </span>
              <span>
                <strong>{customer.name}</strong>
                <small>{customer.email}</small>
              </span>
            </button>
            <div className="admin-customer-info">
              <p>{customer.phone || t('admin.noPhone')}</p>
              <p>{customer.address || t('admin.noInfo')}</p>
              <p>{t('admin.latestOrder')}: {formatAdminDate(customer.latestOrderAt, language, t('admin.noInfo'))}</p>
            </div>
            <div className="admin-customer-stats">
              <span><b>{customer.orderCount || 0}</b>{t('admin.orders')}</span>
              <span><b>{customer.itemCount || 0}</b>{t('admin.items')}</span>
              <span><b>{formatCurrency(customer.totalSpent || 0)}</b>{t('admin.customerSpent')}</span>
            </div>
          </article>
          )
        })}
        {!isLoading && customers.length === 0 && (
          <div className="admin-empty admin-customer-empty">{t('admin.noCustomers')}</div>
        )}
      </div>

      {(pagination.hasMore || isLoading || isLoadingMore) && (
        <div className="admin-load-more">
          <button type="button" disabled={isLoading || isLoadingMore} onClick={loadMoreCustomers}>
            <ChevronDown size={16} />
            {isLoading || isLoadingMore ? t('admin.loading') : t('admin.loadMore')}
          </button>
        </div>
      )}

      {selectedCustomer && (
        <div className="admin-dialog-backdrop" role="presentation">
          <section className="admin-dialog admin-customer-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="customer-detail-title">
            <div className="admin-dialog-copy">
              <div className="admin-customer-detail-heading">
                <div>
                  <p className="admin-kicker"><ShoppingBag size={15} /> {t('admin.customerOrders')}</p>
                  <h2 id="customer-detail-title">{selectedCustomer.name}</h2>
                  <p>{selectedCustomer.email}</p>
                </div>
                <button type="button" className="admin-icon-button" aria-label={t('admin.close')} onClick={closeCustomer}>
                  <X size={18} />
                </button>
              </div>
              <div className="admin-customer-detail-stats">
                <article>
                  <span>{t('admin.customerSpent')}</span>
                  <strong>{formatCurrency(selectedCustomer.totalSpent || 0)}</strong>
                </article>
                <article>
                  <span>{t('admin.orders')}</span>
                  <strong>{selectedCustomer.orderCount || 0}</strong>
                </article>
                <article>
                  <span>{t('admin.items')}</span>
                  <strong>{selectedCustomer.itemCount || 0}</strong>
                </article>
              </div>
            </div>

            <div className="admin-customer-order-list">
              {customerOrders.map((order) => (
                <article key={order.id} className="admin-customer-order-card">
                  <div className="admin-customer-order-top">
                    <div>
                      <strong>{order.id}</strong>
                      <small>{formatAdminDate(order.updatedAt || order.createdAt, language, t('admin.noInfo'))} · {order.payment || t('admin.noInfo')}</small>
                    </div>
                    <span>{order.statusLabel}</span>
                  </div>
                  <div className="admin-customer-order-money">
                    <span>{t('admin.total')}</span>
                    <strong>{formatCurrency(order.total || 0)}</strong>
                  </div>
                  <div className="admin-customer-order-items">
                    {(order.items || []).map((item, index) => (
                      <button
                        key={`${order.id}-${item.productId || item.name}-${index}`}
                        type="button"
                        className="admin-customer-order-product"
                        onClick={() => openProduct(item)}
                      >
                        <PackageSearch size={15} />
                        <span>{item.name}</span>
                        <small>{item.quantity} x {formatCurrency(item.price || 0)}</small>
                      </button>
                    ))}
                  </div>
                </article>
              ))}
              {!isLoadingCustomerOrders && customerOrders.length === 0 && (
                <div className="admin-empty">{t('admin.noCustomerOrders')}</div>
              )}
            </div>

            {customerOrderPagination.hasMore && (
              <div className="admin-load-more">
                <button type="button" disabled={isLoadingCustomerOrders || isLoadingMoreCustomerOrders} onClick={loadMoreCustomerOrders}>
                  <ChevronDown size={16} />
                  {isLoadingMoreCustomerOrders ? t('admin.loading') : t('admin.loadMoreOrders')}
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  )
}

export default AdminCustomersSection
