import { History } from 'lucide-react'

import { formatCategoryLabel } from '../../../utils/categoryLabel'
import { formatCurrency } from '../../../utils/currency'
import { formatAdminDate } from '../adminUtils'
import { productFieldLabelKeys } from './inventoryConstants'
import { getHistoryChanges } from './inventoryUtils'

function getFieldLabel(field, t) {
  return t(productFieldLabelKeys[field] || field)
}

function renderHistoryValue(field, value, t) {
  if (value === null || value === undefined || value === '') {
    return <span className="admin-change-empty">{t('admin.noInfo')}</span>
  }

  if (field === 'price') return formatCurrency(Number(value) || 0)
  if (field === 'category') return formatCategoryLabel(value)
  if (field === 'categoryName') return formatCategoryLabel(value)
  if (field === 'orderStatus') return t(`admin.orderStatus.${value}`)
  if (field === 'image') {
    return (
      <span className="admin-change-image-value">
        <img src={value} alt="" />
        <small>{value}</small>
      </span>
    )
  }

  return String(value)
}

function getHistorySubject(log, t) {
  if (log.entityType === 'category') {
    const categoryName = log.categoryName || log.productCategory || log.productName
    return {
      title: formatCategoryLabel(categoryName),
      subtitle: t('admin.categoryManagement'),
    }
  }

  return {
    title: log.productName,
    subtitle: log.orderCode
      ? `${t('admin.orderCode')} ${log.orderCode} · SKU #${log.productId} · ${formatCategoryLabel(log.productCategory)}`
      : `SKU #${log.productId} · ${formatCategoryLabel(log.productCategory)}`,
  }
}

function InventoryHistoryDetailDialog({ language, log, onClose, t }) {
  if (!log) return null

  const historyChanges = getHistoryChanges(log)
  const subject = getHistorySubject(log, t)
  const hasStockChange = log.previousStock !== null && log.newStock !== null

  return (
    <div className="admin-dialog-backdrop" role="presentation">
      <section className="admin-dialog admin-history-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="inventory-history-detail-title">
        <div className="admin-dialog-icon admin-history-detail-icon">
          <History size={24} />
        </div>
        <div className="admin-dialog-copy">
          <h2 id="inventory-history-detail-title">{t('admin.inventoryHistoryDetailTitle')}</h2>
          <div className={`admin-history-detail-product${log.productImage ? '' : ' is-no-image'}`}>
            {log.productImage && <img src={log.productImage} alt={log.productName} />}
            <div>
              <strong>{subject.title}</strong>
              <span>{subject.subtitle}</span>
            </div>
          </div>
        </div>

        <div className="admin-history-detail-meta">
          <article>
            <span>{t('admin.action')}</span>
            <strong>{t(`admin.inventoryAction.${log.action}`)}</strong>
          </article>
          <article>
            <span>{t('admin.changedAt')}</span>
            <strong>{formatAdminDate(log.createdAt, language, t('admin.noInfo'))}</strong>
          </article>
          <article>
            <span>{t('admin.updatedBy')}</span>
            <strong>{log.actor?.name || log.actor?.email || t('admin.noInfo')}</strong>
          </article>
          <article>
            <span>{t('admin.stockChange')}</span>
            <strong>
              {hasStockChange
                ? `${log.previousStock ?? 0} -> ${log.newStock ?? 0} ${t('admin.units')}`
                : t('admin.noInfo')}
            </strong>
          </article>
        </div>

        <div className="admin-history-change-list">
          <div className="admin-history-change-heading">
            <span>{t('admin.changedField')}</span>
            <span>{t('admin.previousValue')}</span>
            <span>{t('admin.newValue')}</span>
          </div>
          {historyChanges.map((change, index) => (
            <article key={`${change.field}-${index}`} className="admin-history-change-row">
              <strong>{getFieldLabel(change.field, t)}</strong>
              <div data-before-label={t('admin.previousValue')}>{renderHistoryValue(change.field, change.previousValue, t)}</div>
              <div data-after-label={t('admin.newValue')}>{renderHistoryValue(change.field, change.newValue, t)}</div>
            </article>
          ))}
          {historyChanges.length === 0 && (
            <div className="admin-empty">{t('admin.noInventoryChanges')}</div>
          )}
        </div>

        <div className="admin-dialog-actions">
          <button type="button" onClick={onClose}>{t('admin.close')}</button>
        </div>
      </section>
    </div>
  )
}

export default InventoryHistoryDetailDialog
