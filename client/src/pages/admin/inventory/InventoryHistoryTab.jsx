import { History } from 'lucide-react'

import AdminFilterPanel from '../AdminFilterPanel'
import AdminSearchInput from '../AdminSearchInput'
import { formatCategoryLabel } from '../../../utils/categoryLabel'
import { formatAdminDate } from '../adminUtils'
import { inventoryActionOptions } from './inventoryConstants'
import { formatStockDelta } from './inventoryUtils'

function InventoryHistoryTab({
  filters,
  filteredInventoryHistory,
  handleHistoryKeyDown,
  inventoryHistory,
  language,
  openHistoryLog,
  resetFilter,
  t,
  updateFilter,
}) {
  return (
    <section className="admin-panel admin-inventory-history-panel admin-inventory-history-full">
      <div className="admin-panel-heading">
        <div>
          <p className="admin-kicker"><History size={15} /> {t('admin.inventoryHistory')}</p>
          <h2>{t('admin.inventoryHistoryTitle')}</h2>
        </div>
        <span>{t('admin.filteredCount', { shown: filteredInventoryHistory.length, total: inventoryHistory.length })}</span>
      </div>
      <AdminFilterPanel
        className="admin-inventory-history-filter"
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
      </AdminFilterPanel>
      <div className="admin-inventory-history-list admin-inventory-history-grid">
        {filteredInventoryHistory.map((log) => (
          <article
            key={log.id}
            className={`admin-inventory-history-item admin-inventory-history-${log.action} is-clickable`}
            role="button"
            tabIndex={0}
            onClick={() => openHistoryLog(log)}
            onKeyDown={(event) => handleHistoryKeyDown(event, log)}
          >
            <div className="admin-history-marker">
              <span>{formatStockDelta(log.delta)}</span>
            </div>
            <div className="admin-history-copy">
              <div className="admin-history-top">
                <strong>{log.productName}</strong>
                <span>{t(`admin.inventoryAction.${log.action}`)}</span>
              </div>
              <p>
                SKU #{log.productId}
                {' · '}
                {log.previousStock ?? 0}
                {' -> '}
                {log.newStock ?? 0}
                {' '}
                {t('admin.units')}
              </p>
              <small>
                {formatAdminDate(log.createdAt, language, t('admin.noInfo'))}
                {' · '}
                {log.actor?.name || log.actor?.email || t('admin.noInfo')}
                {log.productCategory ? ` · ${formatCategoryLabel(log.productCategory)}` : ''}
              </small>
            </div>
          </article>
        ))}
        {filteredInventoryHistory.length === 0 && (
          <div className="admin-empty">{inventoryHistory.length === 0 ? t('admin.noInventoryHistory') : t('admin.noFilterResults')}</div>
        )}
      </div>
    </section>
  )
}

export default InventoryHistoryTab
