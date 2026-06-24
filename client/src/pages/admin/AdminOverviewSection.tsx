import { BarChart3, Boxes, ShoppingBag, Users } from 'lucide-react'
import { lazy, Suspense } from 'react'
import type { Dispatch, FormEvent, ReactElement, ReactNode, SetStateAction } from 'react'

import { formatCurrency } from '../../utils/currency'
import type {
  CustomerSalesStat,
  ProductSalesStat,
  RevenueStat,
  StatsFilters,
  SummaryData,
  SummaryStats,
  TranslateFn,
} from '../../types/shop'

interface BarChartListProps<TItem extends object> {
  emptyText: string
  items: TItem[]
  labelKey: string
  onOpenItem?: (item: TItem) => void
  valueFormatter: (value: number, item: TItem) => string
  valueKey: string
}

const BarChartList = lazy(() => import('../../components/admin/BarChartList')) as unknown as <TItem extends object>(
  props: BarChartListProps<TItem>,
) => ReactElement

interface OverviewMetricRow {
  id: string
  metric: string
  note: string
  onOpen?: () => void
  value: ReactNode
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

function ChartFallback({ text }: { text: string }) {
  return <div className="rounded-md border border-dashed border-line bg-surfaceMuted p-6 text-center font-extrabold text-muted">{text}</div>
}

function AdminOverviewSection({
  handleStatsFilterSubmit,
  isLoading = false,
  leastProducts,
  monthlyRevenue,
  onOpenContacts,
  onOpenCustomer,
  onOpenCustomers,
  onOpenOrders,
  onOpenProduct,
  onOpenProducts,
  onOpenUsers,
  overviewView,
  resetStatsFilters,
  setOverviewView,
  setStatsFilters,
  statsFilters,
  summary,
  summaryData,
  t,
  topCustomers,
  topProducts,
}: {
  handleStatsFilterSubmit: (event: FormEvent<HTMLFormElement>) => void
  isLoading?: boolean
  leastProducts: ProductSalesStat[]
  monthlyRevenue: RevenueStat[]
  onOpenContacts?: (params?: Record<string, string | number | undefined>) => void
  onOpenCustomer?: (customer: CustomerSalesStat) => void
  onOpenCustomers?: (params?: Record<string, string | number | undefined>) => void
  onOpenOrders?: (params?: Record<string, string | number | undefined>) => void
  onOpenProduct?: (product: ProductSalesStat) => void
  onOpenProducts?: (params?: Record<string, string | number | undefined>) => void
  onOpenUsers?: (params?: Record<string, string | number | undefined>) => void
  overviewView: 'list' | 'chart'
  resetStatsFilters: () => void
  setOverviewView: Dispatch<SetStateAction<'list' | 'chart'>>
  setStatsFilters: Dispatch<SetStateAction<StatsFilters>>
  statsFilters: StatsFilters
  summary: SummaryStats
  summaryData: SummaryData | null
  t: TranslateFn
  topCustomers: CustomerSalesStat[]
  topProducts: ProductSalesStat[]
}) {
  function openRevenueOrders(params: Record<string, string | number | undefined> = {}) {
    onOpenOrders?.({
      dateField: 'updatedAt',
      status: 'revenue',
      ...params,
    })
  }

  const overviewMetricRows: OverviewMetricRow[] = [
    {
      id: 'average-order',
      metric: t('admin.averageOrder'),
      note: t('admin.noCancelled'),
      onOpen: () => openRevenueOrders(),
      value: <strong className="font-black text-primaryDark">{formatCurrency(summary.averageOrder || 0)}</strong>,
    },
    {
      id: 'admin-count',
      metric: 'Admin',
      note: t('admin.adminCountNote'),
      onOpen: () => onOpenUsers?.({ role: 'admin' }),
      value: <strong className="font-black text-primaryDark">{summary.adminCount || 0}</strong>,
    },
    {
      id: 'new-contact',
      metric: t('admin.newContact'),
      note: t('admin.newContactNote'),
      onOpen: () => onOpenContacts?.({ status: 'new' }),
      value: <strong className="font-black text-primaryDark">{summary.newContactCount || 0}</strong>,
    },
  ]

  const panelClass = 'grid min-h-[360px] content-start gap-4 rounded-md border border-line bg-white p-4 shadow-liquid'
  const listButtonClass = 'grid w-full grid-cols-[auto_1fr] gap-3 rounded-md border border-line bg-white p-3 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:shadow-liquid'
  const rankClass = 'inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-sm font-black text-primaryDark'
  const emptyClass = 'rounded-md border border-dashed border-line bg-surfaceMuted p-6 text-center font-extrabold text-muted'
  const panelSkeleton = (
    <div className="grid gap-3" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className={listButtonClass}>
          <span className="size-9 animate-pulse rounded-md bg-slate-200" />
          <span className="grid gap-2">
            <span className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
            <span className="h-5 w-44 animate-pulse rounded-full bg-slate-200" />
            <span className="h-4 w-32 animate-pulse rounded-full bg-slate-200" />
          </span>
        </div>
      ))}
    </div>
  )

  return (
    <section className="grid gap-6">
      <section className="grid gap-4 rounded-md border border-line bg-gradient-to-br from-white via-surfaceMuted to-blue-50 p-5 shadow-liquid">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid gap-2">
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-primaryDark"><BarChart3 size={15} /> {t('admin.reportFilter')}</p>
            <h2 className="text-2xl font-black text-ink">{t('admin.periodStats')}</h2>
          </div>
          <span className="w-fit rounded-full border border-line bg-white px-3 py-1 text-sm font-black text-primaryDark shadow-soft">{summaryData?.period?.hasFilter ? summaryData.period.label : t('admin.periodAll')}</span>
        </div>
        <form className="grid gap-3 rounded-md border border-line bg-gradient-to-br from-white to-surfaceMuted p-3 shadow-soft [grid-template-columns:repeat(auto-fit,minmax(190px,1fr))]" onSubmit={handleStatsFilterSubmit}>
          <label>
            {t('admin.periodType')}
            <select
              value={statsFilters.mode}
              onChange={(event) => setStatsFilters((current) => ({ ...current, mode: event.target.value as StatsFilters['mode'] }))}
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
          <div className="flex flex-wrap items-end gap-3">
            <button className="inline-flex items-center justify-center gap-2 rounded-md border border-primary bg-primary px-4 py-2.5 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 hover:border-primaryDark hover:bg-primaryDark hover:shadow-panel focus:outline-none focus:ring-4 focus:ring-primary/20" type="submit">{t('admin.applyStats')}</button>
            <button type="button" onClick={resetStatsFilters}>{t('admin.clearStats')}</button>
          </div>
        </form>
      </section>

      <section className="grid gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid gap-1">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-primaryDark"><BarChart3 size={15} /> {t('admin.stats')}</p>
            <h2 className="text-2xl font-black text-ink">{t('admin.stats')}</h2>
          </div>
          <div className="flex w-fit gap-1 rounded-md border border-line bg-white p-1 shadow-soft" role="group" aria-label={t('admin.chartView')}>
            <button
              type="button"
              className={`h-10 px-3 ${overviewView === 'list' ? 'border-primary bg-primary/10 text-primaryDark' : 'border-transparent bg-transparent text-muted shadow-none'}`}
              onClick={() => setOverviewView('list')}
            >
              {t('admin.listView')}
            </button>
            <button
              type="button"
              className={`h-10 px-3 ${overviewView === 'chart' ? 'border-primary bg-primary/10 text-primaryDark' : 'border-transparent bg-transparent text-muted shadow-none'}`}
              onClick={() => setOverviewView('chart')}
            >
              {t('admin.chartView')}
            </button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {overviewMetricRows.map((row) => (
            <button
              key={row.id}
              type="button"
              className="grid gap-3 rounded-md border border-line bg-white p-4 text-left shadow-liquid transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-liquidHover"
              onClick={() => row.onOpen?.()}
            >
              <span className="text-xs font-black uppercase tracking-wide text-muted">{row.metric}</span>
              <span className="text-2xl font-black text-primaryDark">{row.value}</span>
              <span className="text-sm font-semibold leading-6 text-muted">{row.note}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-5">
        <div className="grid gap-5 xl:grid-cols-2">
          <section className={panelClass}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="grid gap-1">
                <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-primaryDark"><ShoppingBag size={15} /> {t('admin.revenue')}</p>
                <h2 className="text-xl font-black text-ink">{t('admin.revenueByMonth')}</h2>
              </div>
              <button type="button" className="w-fit border-primary bg-primary text-white hover:border-primaryDark hover:bg-primaryDark" onClick={() => openRevenueOrders()}>
                {t('admin.openManagement')}
              </button>
            </div>
            <div className="grid gap-3">
              {isLoading ? (
                panelSkeleton
              ) : monthlyRevenue.length === 0 ? (
                <div className={emptyClass}>{t('admin.noRevenue')}</div>
              ) : overviewView === 'chart' ? (
                <Suspense fallback={<ChartFallback text={t('admin.loading')} />}>
                  <BarChartList
                    items={monthlyRevenue}
                    valueKey="revenue"
                    labelKey="month"
                    valueFormatter={(value) => formatCurrency(value)}
                    emptyText={t('admin.noRevenue')}
                    onOpenItem={(item) => openRevenueOrders(getMonthDateRange(item.month))}
                  />
                </Suspense>
              ) : (
                monthlyRevenue.slice(0, 5).map((item, index) => (
                  <button
                    key={item.month}
                    type="button"
                    className={listButtonClass}
                    onClick={() => openRevenueOrders(getMonthDateRange(item.month))}
                  >
                    <b className={rankClass}>{index + 1}</b>
                    <div className="grid gap-1">
                      <span className="text-xs font-black uppercase text-muted">{item.month}</span>
                      <strong className="text-lg font-black text-primaryDark">{formatCurrency(item.revenue)}</strong>
                      <p className="text-sm font-semibold text-muted">{t('admin.orderCount', { count: item.count })}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className={panelClass}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="grid gap-1">
                <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-primaryDark"><Boxes size={15} /> {t('admin.topSelling')}</p>
                <h2 className="text-xl font-black text-ink">{t('admin.topProducts')}</h2>
              </div>
              <button type="button" className="w-fit border-primary bg-primary text-white hover:border-primaryDark hover:bg-primaryDark" onClick={() => onOpenProducts?.()}>
                {t('admin.openManagement')}
              </button>
            </div>
            <div className="grid gap-3">
              {isLoading ? (
                panelSkeleton
              ) : topProducts.length === 0 ? (
                <div className={emptyClass}>{t('admin.noTopProducts')}</div>
              ) : overviewView === 'chart' ? (
                <Suspense fallback={<ChartFallback text={t('admin.loading')} />}>
                  <BarChartList
                    items={topProducts}
                    valueKey="quantity"
                    labelKey="name"
                    valueFormatter={(value, item) => `${t('admin.soldCount', { count: value })} | ${formatCurrency(Number(item.revenue) || 0)}`}
                    emptyText={t('admin.noTopProducts')}
                    onOpenItem={(product) => onOpenProduct?.(product)}
                  />
                </Suspense>
              ) : (
                topProducts.slice(0, 5).map((product, index) => (
                  <button
                    key={product.productId}
                    type="button"
                    className={listButtonClass}
                    onClick={() => onOpenProduct?.(product)}
                  >
                    <b className={rankClass}>{index + 1}</b>
                    <div className="grid gap-1">
                      <span className="text-xs font-black uppercase text-muted">{t('admin.soldCount', { count: product.quantity })}</span>
                      <strong className="text-base font-black text-ink">{product.name}</strong>
                      <p className="text-sm font-semibold text-primaryDark">{formatCurrency(product.revenue)}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className={panelClass}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="grid gap-1">
                <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-primaryDark"><Boxes size={15} /> {t('admin.lowSelling')}</p>
                <h2 className="text-xl font-black text-ink">{t('admin.leastProducts')}</h2>
              </div>
              <button type="button" className="w-fit border-primary bg-primary text-white hover:border-primaryDark hover:bg-primaryDark" onClick={() => onOpenProducts?.()}>
                {t('admin.openManagement')}
              </button>
            </div>
            <div className="grid gap-3">
              {isLoading ? (
                panelSkeleton
              ) : leastProducts.length === 0 ? (
                <div className={emptyClass}>{t('admin.noLowProducts')}</div>
              ) : overviewView === 'chart' ? (
                <Suspense fallback={<ChartFallback text={t('admin.loading')} />}>
                  <BarChartList
                    items={leastProducts}
                    valueKey="quantity"
                    labelKey="name"
                    valueFormatter={(value, item) => `${t('admin.soldCount', { count: value })} | ${formatCurrency(Number(item.revenue) || 0)}`}
                    emptyText={t('admin.noLowProducts')}
                    onOpenItem={(product) => onOpenProduct?.(product)}
                  />
                </Suspense>
              ) : (
                leastProducts.slice(0, 5).map((product, index) => (
                  <button
                    key={product.productId}
                    type="button"
                    className={listButtonClass}
                    onClick={() => onOpenProduct?.(product)}
                  >
                    <b className={rankClass}>{index + 1}</b>
                    <div className="grid gap-1">
                      <span className="text-xs font-black uppercase text-muted">{t('admin.soldCount', { count: product.quantity })}</span>
                      <strong className="text-base font-black text-ink">{product.name}</strong>
                      <p className="text-sm font-semibold text-primaryDark">{formatCurrency(product.revenue)}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className={panelClass}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="grid gap-1">
                <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-primaryDark"><Users size={15} /> {t('admin.topCustomers')}</p>
                <h2 className="text-xl font-black text-ink">{t('admin.topCustomers')}</h2>
              </div>
              <button type="button" className="w-fit border-primary bg-primary text-white hover:border-primaryDark hover:bg-primaryDark" onClick={() => onOpenCustomers?.()}>
                {t('admin.openManagement')}
              </button>
            </div>
            <div className="grid gap-3">
              {isLoading ? (
                panelSkeleton
              ) : topCustomers.length === 0 ? (
                <div className={emptyClass}>{t('admin.noTopCustomers')}</div>
              ) : overviewView === 'chart' ? (
                <Suspense fallback={<ChartFallback text={t('admin.loading')} />}>
                  <BarChartList
                    items={topCustomers}
                    valueKey="totalSpent"
                    labelKey="name"
                    valueFormatter={(value, item) => `${formatCurrency(value)} | ${t('admin.orderCount', { count: item.orderCount })}`}
                    emptyText={t('admin.noTopCustomers')}
                    onOpenItem={(customer) => onOpenCustomer?.(customer)}
                  />
                </Suspense>
              ) : (
                topCustomers.slice(0, 5).map((customer, index) => (
                  <button
                    key={customer.email}
                    type="button"
                    className={listButtonClass}
                    onClick={() => onOpenCustomer?.(customer)}
                  >
                    <b className={rankClass}>{index + 1}</b>
                    <div className="grid gap-1">
                      <span className="text-xs font-black uppercase text-muted">{t('admin.customerSpent')}</span>
                      <strong className="text-base font-black text-ink">{customer.name}</strong>
                      <p className="text-sm font-semibold text-muted">{customer.email}</p>
                      <p className="text-sm font-semibold text-primaryDark">{formatCurrency(customer.totalSpent)} | {t('admin.orderCount', { count: customer.orderCount })} | {t('admin.itemCount', { count: customer.itemCount })}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </section>
  )
}

export default AdminOverviewSection
