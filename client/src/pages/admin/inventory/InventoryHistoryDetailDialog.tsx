import { History } from 'lucide-react'

import AdminImagePreview from '../../../components/admin/AdminImagePreview'
import AppDialog from '../../../components/ui/AppDialog'
import { formatCategoryLabel } from '../../../utils/categoryLabel'
import { formatCurrency } from '../../../utils/currency'
import { formatAdminDate } from '../adminUtils'
import { productFieldLabelKeys } from './inventoryConstants'
import { getHistoryChanges } from './inventoryUtils'
import type { InventoryChange, InventoryLog, LanguageCode, TranslateFn } from '../../../types/shop'

function getFieldLabel(field: string, t: TranslateFn) {
  return t(productFieldLabelKeys[field] || field)
}

function renderHistoryValue(field: string, value: unknown, t: TranslateFn) {
  if (value === null || value === undefined || value === '') {
    return <span className="font-bold text-muted">{t('admin.noInfo')}</span>
  }

  if (field === 'price') return formatCurrency(Number(value) || 0)
  if (field === 'category') return formatCategoryLabel(String(value))
  if (field === 'categoryName') return formatCategoryLabel(String(value))
  if (field === 'orderStatus') return t(`admin.orderStatus.${value}`)
  if (field === 'image') {
    return (
      <span className="inline-flex min-w-0 items-center gap-2">
        <AdminImagePreview alt={t('admin.productImage')} href={String(value)} size="sm" src={String(value)} />
        <small className="line-clamp-2 break-all text-xs font-bold text-muted">{String(value)}</small>
      </span>
    )
  }

  return String(value)
}

function getHistorySubject(log: InventoryLog, t: TranslateFn) {
  if (log.entityType === 'category') {
    const categoryName = log.categoryName || log.productCategory || log.productName
    return {
      title: formatCategoryLabel(String(categoryName || '')),
      subtitle: t('admin.categoryManagement'),
    }
  }

  return {
    title: log.productName,
    subtitle: log.orderCode
      ? `${t('admin.orderCode')} ${log.orderCode} · SKU #${log.productId} · ${formatCategoryLabel(String(log.productCategory || ''))}`
      : `SKU #${log.productId} · ${formatCategoryLabel(String(log.productCategory || ''))}`,
  }
}

function InventoryHistoryDetailDialog({
  language,
  log,
  onClose,
  t,
}: {
  language: LanguageCode
  log: InventoryLog | null
  onClose: () => void
  t: TranslateFn
}) {
  if (!log) return null

  const historyChanges = getHistoryChanges(log)
  const subject = getHistorySubject(log, t)
  const hasStockChange = log.previousStock !== null && log.newStock !== null

  return (
    <AppDialog
      className="max-w-4xl"
      isOpen={Boolean(log)}
      onClose={onClose}
      title={(
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primaryDark">
            <History size={20} />
          </span>
          {t('admin.inventoryHistoryDetailTitle')}
        </span>
      )}
    >
        <div className="grid gap-2">
          <div className={`grid gap-3 rounded-md border border-lineStrong/60 p-4 shadow-soft sm:grid-cols-[auto_1fr] sm:items-center ${log.productImage ? 'bg-white' : 'bg-surfaceMuted'}`}>
            {log.productImage && <AdminImagePreview alt={log.productName || t('admin.productImage')} href={log.productImage} size="lg" src={log.productImage} />}
            <div className="min-w-0">
              <strong className="line-clamp-2 text-xl font-black text-ink">{subject.title}</strong>
              <span className="block break-words text-sm font-bold text-muted">{subject.subtitle}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <article className="grid gap-1 rounded-md border border-line bg-white p-4 shadow-soft">
            <span className="text-xs font-black uppercase text-primaryDark">{t('admin.action')}</span>
            <strong className="text-base font-black text-ink">{t(`admin.inventoryAction.${log.action}`)}</strong>
          </article>
          <article className="grid gap-1 rounded-md border border-line bg-white p-4 shadow-soft">
            <span className="text-xs font-black uppercase text-primaryDark">{t('admin.changedAt')}</span>
            <strong className="text-base font-black text-ink">{formatAdminDate(log.createdAt, language, t('admin.noInfo'))}</strong>
          </article>
          <article className="grid gap-1 rounded-md border border-line bg-white p-4 shadow-soft">
            <span className="text-xs font-black uppercase text-primaryDark">{t('admin.updatedBy')}</span>
            <strong className="break-words text-base font-black text-ink">{log.actor?.name || log.actor?.email || t('admin.noInfo')}</strong>
          </article>
          <article className="grid gap-1 rounded-md border border-primary/20 bg-primary/5 p-4 shadow-soft">
            <span className="text-xs font-black uppercase text-primaryDark">{t('admin.stockChange')}</span>
            <strong className="text-base font-black text-primaryDark">
              {hasStockChange
                ? `${log.previousStock ?? 0} -> ${log.newStock ?? 0} ${t('admin.units')}`
                : t('admin.noInfo')}
            </strong>
          </article>
        </div>

        <div className="grid gap-3">
          <div className="hidden gap-3 rounded-md border border-line bg-surfaceMuted p-3 text-sm font-black text-muted sm:grid sm:grid-cols-3">
            <span>{t('admin.changedField')}</span>
            <span>{t('admin.previousValue')}</span>
            <span>{t('admin.newValue')}</span>
          </div>
          {historyChanges.map((change: InventoryChange, index: number) => (
            <article key={`${change.field}-${index}`} className="grid gap-3 rounded-md border border-line bg-white p-3 shadow-soft sm:grid-cols-3">
              <strong className="text-sm font-black text-ink">{getFieldLabel(change.field, t)}</strong>
              <div className="grid gap-1 text-sm font-semibold text-muted" data-before-label={t('admin.previousValue')}>
                <span className="text-xs font-black uppercase text-primaryDark sm:hidden">{t('admin.previousValue')}</span>
                {renderHistoryValue(change.field, change.previousValue, t)}
              </div>
              <div className="grid gap-1 text-sm font-semibold text-muted" data-after-label={t('admin.newValue')}>
                <span className="text-xs font-black uppercase text-primaryDark sm:hidden">{t('admin.newValue')}</span>
                {renderHistoryValue(change.field, change.newValue, t)}
              </div>
            </article>
          ))}
          {historyChanges.length === 0 && (
            <div className="rounded-md border border-dashed border-line bg-surfaceMuted p-6 text-center font-extrabold text-muted">{t('admin.noInventoryChanges')}</div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="border-primary bg-primary text-white hover:border-primaryDark hover:bg-primaryDark" onClick={onClose}>{t('admin.close')}</button>
        </div>
    </AppDialog>
  )
}

export default InventoryHistoryDetailDialog
