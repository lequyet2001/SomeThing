import { ArrowRight, Eye, History, PackageCheck, Tags } from 'lucide-react'

import AdminFilterPanel from '../../../components/admin/AdminFilterPanel'
import AdminSearchInput from '../../../components/admin/AdminSearchInput'
import { formatCategoryLabel } from '../../../utils/categoryLabel'
import { formatAdminDate } from '../adminUtils'
import { inventoryActionOptions } from './inventoryConstants'
import { formatStockDelta } from './inventoryUtils'
import type {
  InventoryFilters,
  InventoryHistoryKeyHandler,
  InventoryLog,
  LanguageCode,
  TranslateFn,
} from '../../../types/shop'

function getHistoryMarker(log: InventoryLog) {
  if (log.entityType === 'category') return 'CAT'
  if (log.action === 'order-deducted') return 'ORD'
  return formatStockDelta(log.delta)
}

function getHistoryTone(log: InventoryLog) {
  if (log.entityType === 'category') return 'border-violet-200 bg-violet-50 text-violet-700'
  if (log.action === 'order-deducted') return 'border-amber-200 bg-amber-50 text-amber-700'
  if ((Number(log.delta) || 0) < 0) return 'border-red-200 bg-red-50 text-red-700'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

function getHistoryTitle(log: InventoryLog) {
  if (log.entityType === 'category') return formatCategoryLabel(String(log.categoryName || log.productCategory || log.productName || ''))
  return log.productName || ''
}

function getHistorySummary(log: InventoryLog, t: TranslateFn) {
  if (log.entityType === 'category') {
    return `${t('admin.category')}: ${formatCategoryLabel(String(log.categoryName || log.productCategory || log.productName || ''))}`
  }

  const stockSummary = `${log.previousStock ?? 0} -> ${log.newStock ?? 0} ${t('admin.units')}`
  return log.orderCode
    ? `${t('admin.orderCode')} ${log.orderCode} · ${stockSummary}`
    : `SKU #${log.productId} · ${stockSummary}`
}

function InventoryHistoryTab({
  filters,
  filteredInventoryHistory,
  handleHistoryKeyDown,
  inventoryHistory,
  isLoading = false,
  language,
  openHistoryLog,
  resetFilter,
  t,
  updateFilter,
}: {
  filters: InventoryFilters
  filteredInventoryHistory: InventoryLog[]
  handleHistoryKeyDown: InventoryHistoryKeyHandler
  inventoryHistory: InventoryLog[]
  isLoading?: boolean
  language: LanguageCode
  openHistoryLog: (log: InventoryLog) => void
  resetFilter: (group: keyof InventoryFilters) => void
  t: TranslateFn
  updateFilter: (group: keyof InventoryFilters, field: string, value: string) => void
}) {
  return (
    <section className="grid gap-4 rounded-md border border-line bg-white p-4 shadow-liquid">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-primaryDark"><History size={15} /> {t('admin.inventoryHistory')}</p>
          <h2>{t('admin.inventoryHistoryTitle')}</h2>
        </div>
        <span>{t('admin.filteredCount', { shown: filteredInventoryHistory.length, total: inventoryHistory.length })}</span>
      </div>
      <AdminFilterPanel
        title={t('admin.filters')}
        clearLabel={t('admin.clearFilters')}
        onClear={() => resetFilter('history')}
      >
        <AdminSearchInput
          value={filters.history.query}
          placeholder={t('admin.searchInventoryHistory')}
          onChange={(value) => updateFilter('history', 'query', value)}
        />
        <label>
          {t('admin.action')}
          <select
            value={filters.history.action}
            onChange={(event) => updateFilter('history', 'action', event.target.value)}
          >
            {inventoryActionOptions.map((option) => (
              <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
            ))}
          </select>
        </label>
        <fieldset className="col-span-full grid gap-3 rounded-md border border-line bg-white p-3 sm:grid-cols-2">
          <legend>{t('admin.dateRange')}</legend>
          <label>
            {t('admin.startDate')}
            <input
              type="date"
              value={filters.history.startDate}
              onChange={(event) => updateFilter('history', 'startDate', event.target.value)}
            />
          </label>
          <label>
            {t('admin.endDate')}
            <input
              type="date"
              value={filters.history.endDate}
              onChange={(event) => updateFilter('history', 'endDate', event.target.value)}
            />
          </label>
        </fieldset>
      </AdminFilterPanel>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? Array.from({ length: 6 }).map((_, index) => (
          <article
            key={`history-loading-${index}`}
            className="grid grid-cols-[auto_1fr] gap-3 rounded-md border border-line bg-white p-4 shadow-liquid"
            aria-hidden="true"
          >
            <div className="size-11 animate-pulse rounded-md bg-slate-200" />
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="h-5 w-40 animate-pulse rounded-full bg-slate-200" />
                <span className="h-5 w-24 animate-pulse rounded-full bg-slate-200" />
              </div>
              <span className="h-4 w-full animate-pulse rounded-full bg-slate-200" />
              <span className="h-4 w-3/4 animate-pulse rounded-full bg-slate-200" />
            </div>
          </article>
        )) : filteredInventoryHistory.map((log) => (
          <article
            key={log.id}
            className="group grid cursor-pointer gap-4 rounded-md border border-lineStrong/60 bg-white p-4 shadow-liquid ring-1 ring-white/80 transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-liquidHover sm:grid-cols-[auto_1fr]"
            role="button"
            tabIndex={0}
            onClick={() => openHistoryLog(log)}
            onKeyDown={(event) => handleHistoryKeyDown(event, log)}
          >
            <div className={`inline-flex size-12 shrink-0 items-center justify-center rounded-md border text-sm font-black shadow-soft ${getHistoryTone(log)}`}>
              {log.entityType === 'category' ? <Tags size={19} /> : log.action === 'order-deducted' ? <PackageCheck size={19} /> : <span>{getHistoryMarker(log)}</span>}
            </div>
            <div className="grid min-w-0 gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <strong className="line-clamp-2 text-base font-black text-ink">{getHistoryTitle(log)}</strong>
                  <p className="mt-1 text-sm font-semibold leading-6 text-muted">{getHistorySummary(log, t)}</p>
                </div>
                <span className={`inline-flex w-fit shrink-0 items-center rounded-full border px-3 py-1 text-xs font-black ${getHistoryTone(log)}`}>{t(`admin.inventoryAction.${log.action}`)}</span>
              </div>
              <div className="grid gap-2 rounded-md border border-line bg-surfaceMuted p-3 text-sm font-bold text-muted">
                <span className="inline-flex flex-wrap items-center gap-2">
                  <History size={15} />
                  {formatAdminDate(log.createdAt, language, t('admin.noInfo'))}
                  <ArrowRight size={14} />
                  {log.actor?.name || log.actor?.email || t('admin.noInfo')}
                </span>
                {log.productCategory ? <span>{formatCategoryLabel(log.productCategory)}</span> : null}
              </div>
              <span className="inline-flex w-fit items-center gap-2 text-sm font-black text-primaryDark transition group-hover:translate-x-1">
                <Eye size={15} />
                {t('common.view')}
              </span>
            </div>
          </article>
        ))}
        {!isLoading && filteredInventoryHistory.length === 0 && (
          <div className="rounded-md border border-dashed border-line bg-surfaceMuted p-6 text-center font-extrabold text-muted">{inventoryHistory.length === 0 ? t('admin.noInventoryHistory') : t('admin.noFilterResults')}</div>
        )}
      </div>
    </section>
  )
}

export default InventoryHistoryTab
