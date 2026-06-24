import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, ChevronDown, Coins, Mail, MapPin, PackageCheck, PackageSearch, Phone, Search, ShoppingBag, UserRoundCheck } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import AppDialog from '../../components/ui/AppDialog'
import AdminImagePreview from '../../components/admin/AdminImagePreview'
import { formatCurrency } from '../../utils/currency'
import { shopApi } from '../../services/shopApi'
import { formatAdminDate } from './adminUtils'
import type {
  AdminCustomer,
  AdminPagination,
  EntityId,
  LanguageCode,
  NoticeType,
  Order,
  OrderItem,
  TranslateFn,
} from '../../types/shop'

const CUSTOMERS_PAGE_SIZE = 12
const CUSTOMER_ORDERS_PAGE_SIZE = 8
const initialPagination: AdminPagination = {
  hasMore: false,
  limit: CUSTOMERS_PAGE_SIZE,
  page: 1,
  total: 0,
  totalPages: 1,
}
type PeriodMode = 'all' | 'month' | 'range'
type DateRangeParams = { endDate?: string; startDate?: string }
type LoadOptions = { append?: boolean; page?: number }
type CustomerQueryParams = {
  endDate?: string
  limit: number
  month?: string
  page: number
  query: string
  startDate?: string
}

interface AdminCustomersSectionProps {
  language: LanguageCode
  reloadKey?: number
  showAdminToast: (message: string, type?: NoticeType) => void
  t: TranslateFn
}

function getCurrentMonthValue() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function getMonthRange(monthValue: string): DateRangeParams {
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

function mergeUniqueById<TItem extends { id?: EntityId }>(currentItems: TItem[], nextItems: TItem[]) {
  const knownIds = new Set(currentItems.map((item) => item.id))
  return [...currentItems, ...nextItems.filter((item) => !knownIds.has(item.id))]
}

function getCustomerInitial(customer: AdminCustomer) {
  return String(customer.name || customer.email || '?').slice(0, 1).toUpperCase()
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Không thể tải dữ liệu.'
}

function CustomerCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <article key={`customer-loading-${index}`} className="rounded-md border border-lineStrong/60 bg-white p-4 shadow-liquid" aria-hidden="true">
          <div className="flex w-full items-center gap-3">
            <span className="size-9 animate-pulse rounded-full bg-slate-200" />
            <span className="size-11 shrink-0 animate-pulse rounded-full bg-slate-200" />
            <span className="grid flex-1 gap-2">
              <span className="h-5 w-36 animate-pulse rounded-full bg-slate-200" />
              <span className="h-4 w-44 animate-pulse rounded-full bg-slate-200" />
            </span>
          </div>
          <div className="mt-4 grid gap-2">
            <span className="h-4 w-32 animate-pulse rounded-full bg-slate-200" />
            <span className="h-4 w-full animate-pulse rounded-full bg-slate-200" />
            <span className="h-4 w-3/4 animate-pulse rounded-full bg-slate-200" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <span className="h-12 animate-pulse rounded-md bg-slate-200" />
            <span className="h-12 animate-pulse rounded-md bg-slate-200" />
            <span className="h-12 animate-pulse rounded-md bg-slate-200" />
          </div>
        </article>
      ))}
    </>
  )
}

function CustomerOrderSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <article key={`customer-order-loading-${index}`} className="rounded-md border border-lineStrong/60 bg-white p-4 shadow-liquid" aria-hidden="true">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="grid gap-2">
              <span className="h-5 w-32 animate-pulse rounded-full bg-slate-200" />
              <span className="h-4 w-48 animate-pulse rounded-full bg-slate-200" />
            </div>
            <span className="h-7 w-24 animate-pulse rounded-full bg-slate-200" />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="h-4 w-20 animate-pulse rounded-full bg-slate-200" />
            <span className="h-5 w-28 animate-pulse rounded-full bg-slate-200" />
          </div>
          <div className="mt-4 grid gap-2">
            <span className="h-12 w-full animate-pulse rounded-md bg-slate-200" />
            <span className="h-12 w-full animate-pulse rounded-md bg-slate-200" />
          </div>
        </article>
      ))}
    </>
  )
}

function AdminCustomersSection({ language, reloadKey = 0, showAdminToast, t }: AdminCustomersSectionProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const routeFilterKey = searchParams.toString()
  const [customers, setCustomers] = useState<AdminCustomer[]>([])
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [periodMode, setPeriodMode] = useState<PeriodMode>('all')
  const [month, setMonth] = useState(getCurrentMonthValue())
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [focusedEmail, setFocusedEmail] = useState('')
  const [pagination, setPagination] = useState<AdminPagination>(initialPagination)
  const [hasLoadedCustomers, setHasLoadedCustomers] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null)
  const [customerOrders, setCustomerOrders] = useState<Order[]>([])
  const [customerOrderPagination, setCustomerOrderPagination] = useState<AdminPagination>({
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
      setMonth(params.get('month') || getCurrentMonthValue())
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
    const params: CustomerQueryParams = {
      limit: CUSTOMERS_PAGE_SIZE,
      page: 1,
      query: debouncedQuery,
    }

    if (periodMode === 'month') return { ...params, month }
    if (periodMode === 'range') return { ...params, endDate, startDate }
    return params
  }, [debouncedQuery, endDate, month, periodMode, startDate])

  function getOrderPeriodParams(): DateRangeParams {
    if (periodMode === 'month') return getMonthRange(month)
    if (periodMode === 'range') return { endDate, startDate }
    return {}
  }

  async function loadCustomers({ append = false, page = 1 }: LoadOptions = {}) {
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
      setHasLoadedCustomers(true)
    } catch (error) {
      if (requestId === requestIdRef.current) {
        showAdminToast(getErrorMessage(error), 'error')
        setHasLoadedCustomers(true)
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

  async function loadCustomerOrders(customer: AdminCustomer, { append = false, page = 1 }: LoadOptions = {}) {
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
        showAdminToast(getErrorMessage(error), 'error')
      }
    } finally {
      if (requestId === ordersRequestIdRef.current) {
        setIsLoadingCustomerOrders(false)
        setIsLoadingMoreCustomerOrders(false)
      }
    }
  }

  function openCustomer(customer: AdminCustomer) {
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

  function openProduct(item: OrderItem) {
    const productId = item.productId
    const productQuery = productId !== undefined && productId !== null ? String(productId) : item.name || ''
    const params = new URLSearchParams()
    if (productQuery) params.set('query', productQuery)
    if (productId !== undefined && productId !== null) params.set('focusProductId', String(productId))

    closeCustomer()
    navigate(`/admin/inventory${params.toString() ? `?${params.toString()}` : ''}`)
  }

  const showCustomerLoading = !hasLoadedCustomers || (isLoading && customers.length === 0)

  return (
    <section className="grid gap-5">
      <section className="grid gap-4 rounded-md border border-lineStrong/60 bg-white p-4 shadow-liquid ring-1 ring-white/80">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-primaryDark"><UserRoundCheck size={15} /> {t('admin.customers')}</p>
          <h2>{t('admin.customerConsumption')}</h2>
          <p>{t('admin.customerConsumptionText', { shown: customers.length, total: pagination.total || 0 })}</p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-lineStrong/60 bg-white px-3 py-2 shadow-soft focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
          <Search className="text-primaryDark" size={17} />
          <input
            type="search"
            value={query}
            placeholder={t('admin.searchCustomers')}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </section>

      <section className="grid gap-4 rounded-md border border-lineStrong/50 bg-gradient-to-br from-white via-sky-50 to-surfaceMuted p-4 shadow-soft">
        <div className="col-span-full flex flex-wrap gap-2" role="group" aria-label={t('admin.periodType')}>
          {([
            { key: 'all', label: t('admin.periodAll') },
            { key: 'month', label: t('admin.periodMonth') },
            { key: 'range', label: t('admin.periodRange') },
          ] as Array<{ key: PeriodMode; label: string }>).map((option) => (
            <button
              key={option.key}
              type="button"
              className={`inline-flex items-center justify-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-extrabold text-muted shadow-soft hover:border-primary hover:text-primaryDark ${periodMode === option.key ? 'border-primary bg-primary/10 text-primaryDark' : ''}`}
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
          <fieldset className="grid gap-3 rounded-md border border-line bg-white p-3 sm:grid-cols-2">
            <legend className="px-1 text-sm font-black text-primaryDark">{t('admin.dateRange')}</legend>
            <label>
              {t('admin.startDate')}
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </label>
            <label>
              {t('admin.endDate')}
              <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </label>
          </fieldset>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy={showCustomerLoading || isLoading}>
        {showCustomerLoading ? (
          <CustomerCardSkeleton />
        ) : customers.map((customer, index) => {
          const isFocused = focusedEmail && String(customer.email || '').toLowerCase() === focusedEmail

          return (
          <article key={customer.id || customer.email} className={`group grid gap-4 rounded-md border border-lineStrong/60 bg-white p-4 shadow-liquid ring-1 ring-white/80 transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-liquidHover ${isFocused ? 'border-primary ring-4 ring-primary/10' : ''}`}>
            <button type="button" className="flex w-full items-start gap-3 border-0 bg-transparent p-0 text-left shadow-none" onClick={() => openCustomer(customer)}>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-sm font-black text-primaryDark">#{index + 1}</span>
              <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-primary/10 text-sm font-black text-primaryDark shadow-soft">
                {customer.avatar ? <img className="h-full w-full object-cover" src={customer.avatar} alt="" /> : getCustomerInitial(customer)}
              </span>
              <span className="grid min-w-0 flex-1 gap-1">
                <strong className="line-clamp-1 text-base font-black text-ink">{customer.name || customer.email}</strong>
                <small className="truncate text-sm font-bold text-muted">{customer.email}</small>
              </span>
            </button>
            <div className="grid gap-2 rounded-md border border-line bg-surfaceMuted p-3 text-sm font-semibold text-muted">
              <p className="inline-flex min-w-0 items-center gap-2"><Phone size={15} className="shrink-0 text-primaryDark" /> <span className="truncate">{customer.phone || t('admin.noPhone')}</span></p>
              <p className="inline-flex min-w-0 items-center gap-2"><MapPin size={15} className="shrink-0 text-primaryDark" /> <span className="line-clamp-2">{customer.address || t('admin.noInfo')}</span></p>
              <p className="inline-flex min-w-0 items-center gap-2"><CalendarDays size={15} className="shrink-0 text-primaryDark" /> <span className="truncate">{t('admin.latestOrder')}: {formatAdminDate(customer.latestOrderAt, language, t('admin.noInfo'))}</span></p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="grid gap-1 rounded-md border border-line bg-white p-3 text-xs font-black uppercase text-muted"><b className="text-xl font-black text-ink">{customer.orderCount || 0}</b>{t('admin.orders')}</span>
              <span className="grid gap-1 rounded-md border border-line bg-white p-3 text-xs font-black uppercase text-muted"><b className="text-xl font-black text-ink">{customer.itemCount || 0}</b>{t('admin.items')}</span>
              <span className="grid gap-1 rounded-md border border-primary/20 bg-primary/5 p-3 text-xs font-black uppercase text-muted"><b className="break-words text-base font-black text-primaryDark">{formatCurrency(customer.totalSpent || 0)}</b>{t('admin.customerSpent')}</span>
            </div>
            <button type="button" className="w-fit border-lineStrong bg-white text-primaryDark hover:border-primary hover:bg-primary/5" onClick={() => openCustomer(customer)}>
              <PackageSearch size={15} />
              {t('common.view')}
            </button>
          </article>
          )
        })}
        {!showCustomerLoading && customers.length === 0 && (
          <div className="rounded-md border border-dashed border-line bg-surfaceMuted p-6 text-center font-extrabold text-muted">{t('admin.noCustomers')}</div>
        )}
      </div>

      {hasLoadedCustomers && (pagination.hasMore || isLoadingMore) && (
        <div className="flex justify-center">
          <button type="button" disabled={isLoading || isLoadingMore} onClick={loadMoreCustomers}>
            <ChevronDown size={16} />
            {isLoading || isLoadingMore ? t('admin.loading') : t('admin.loadMore')}
          </button>
        </div>
      )}

      {selectedCustomer && (
        <AppDialog
          className="max-w-5xl"
          isOpen={Boolean(selectedCustomer)}
          onClose={closeCustomer}
          title={selectedCustomer.name || selectedCustomer.email}
          description={(
            <span className="inline-flex flex-wrap items-center gap-2">
              <ShoppingBag size={15} />
              {t('admin.customerOrders')} · {selectedCustomer.email}
            </span>
          )}
        >
            <div className="grid gap-4 rounded-md border border-lineStrong/60 bg-gradient-to-br from-white via-sky-50 to-surfaceMuted p-4 shadow-soft md:grid-cols-[auto_1fr]">
              <span className="flex size-16 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-primary/10 text-xl font-black text-primaryDark shadow-liquid">
                {selectedCustomer.avatar ? <img className="h-full w-full object-cover" src={selectedCustomer.avatar} alt="" /> : getCustomerInitial(selectedCustomer)}
              </span>
              <div className="grid gap-3">
                <div>
                  <strong className="text-xl font-black text-ink">{selectedCustomer.name || selectedCustomer.email}</strong>
                  <p className="inline-flex min-w-0 items-center gap-2 text-sm font-bold text-muted"><Mail size={15} /> <span className="break-all">{selectedCustomer.email}</span></p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <span className="inline-flex min-w-0 items-center gap-2 rounded-md border border-line bg-white p-3 text-sm font-bold text-muted"><Phone size={15} className="shrink-0 text-primaryDark" /> <span className="truncate">{selectedCustomer.phone || t('admin.noPhone')}</span></span>
                  <span className="inline-flex min-w-0 items-center gap-2 rounded-md border border-line bg-white p-3 text-sm font-bold text-muted"><MapPin size={15} className="shrink-0 text-primaryDark" /> <span className="line-clamp-2">{selectedCustomer.address || t('admin.noInfo')}</span></span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <article className="grid gap-2 rounded-md border border-primary/20 bg-primary/5 p-4 shadow-soft">
                <Coins size={18} className="text-primaryDark" />
                <span className="text-xs font-black uppercase text-muted">{t('admin.customerSpent')}</span>
                <strong className="break-words text-xl font-black text-primaryDark">{formatCurrency(selectedCustomer.totalSpent || 0)}</strong>
              </article>
              <article className="grid gap-2 rounded-md border border-line bg-white p-4 shadow-soft">
                <PackageCheck size={18} className="text-primaryDark" />
                <span className="text-xs font-black uppercase text-muted">{t('admin.orders')}</span>
                <strong className="text-xl font-black text-ink">{selectedCustomer.orderCount || 0}</strong>
              </article>
              <article className="grid gap-2 rounded-md border border-line bg-white p-4 shadow-soft">
                <ShoppingBag size={18} className="text-primaryDark" />
                <span className="text-xs font-black uppercase text-muted">{t('admin.items')}</span>
                <strong className="text-xl font-black text-ink">{selectedCustomer.itemCount || 0}</strong>
              </article>
            </div>

            <div className="grid gap-3">
              {isLoadingCustomerOrders && customerOrders.length === 0 ? (
                <CustomerOrderSkeleton />
              ) : customerOrders.map((order) => (
                <article key={order.id} className="grid gap-4 rounded-md border border-lineStrong/60 bg-white p-4 shadow-liquid ring-1 ring-white/80 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-liquidHover">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="grid gap-1">
                      <strong className="break-all text-lg font-black text-ink">{order.id}</strong>
                      <small className="font-bold text-muted">{formatAdminDate(order.updatedAt || order.createdAt, language, t('admin.noInfo'))} · {order.payment || t('admin.noInfo')}</small>
                    </div>
                    <span className="inline-flex w-fit rounded-full border border-line bg-surfaceMuted px-3 py-1 text-xs font-black text-primaryDark">{order.statusLabel}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-primary/20 bg-primary/5 p-3">
                    <span className="text-sm font-black text-muted">{t('admin.total')}</span>
                    <strong className="text-xl font-black text-primaryDark">{formatCurrency(order.total || 0)}</strong>
                  </div>
                  <div className="grid gap-2">
                    {(order.items || []).map((item, index) => (
                      <button
                        key={`${order.id}-${item.productId || item.name}-${index}`}
                        type="button"
                        className="grid w-full grid-cols-[auto_1fr] items-center gap-3 rounded-md border border-line bg-surfaceMuted p-3 text-left shadow-soft hover:border-primary hover:bg-primary/5 sm:grid-cols-[auto_1fr_auto]"
                        onClick={() => openProduct(item)}
                      >
                        {item.image ? (
                          <AdminImagePreview alt={item.name} size="sm" src={item.image} />
                        ) : (
                          <PackageSearch size={17} className="text-primaryDark" />
                        )}
                        <span className="line-clamp-2 font-black text-ink">{item.name}</span>
                        <small className="font-bold text-muted">{item.quantity} x {formatCurrency(item.price || 0)}</small>
                      </button>
                    ))}
                  </div>
                </article>
              ))}
              {!isLoadingCustomerOrders && customerOrders.length === 0 && (
                <div className="rounded-md border border-dashed border-line bg-surfaceMuted p-6 text-center font-extrabold text-muted">{t('admin.noCustomerOrders')}</div>
              )}
            </div>

            {customerOrderPagination.hasMore && (
              <div className="flex justify-center">
                <button type="button" className="border-lineStrong bg-white text-primaryDark hover:border-primary hover:bg-primary/5" disabled={isLoadingCustomerOrders || isLoadingMoreCustomerOrders} onClick={loadMoreCustomerOrders}>
                  <ChevronDown size={16} />
                  {isLoadingMoreCustomerOrders ? t('admin.loading') : t('admin.loadMoreOrders')}
                </button>
              </div>
            )}
        </AppDialog>
      )}
    </section>
  )
}

export default AdminCustomersSection
