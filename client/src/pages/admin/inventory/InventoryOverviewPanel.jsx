import { AlertTriangle, Boxes, CheckCircle2, History, ShoppingBag } from 'lucide-react'

import { formatCurrency } from '../../../utils/currency'

function InventoryOverviewPanel({
  activeTab,
  filteredProducts,
  inventoryHealthPercent,
  inventoryHistory,
  inventoryMetrics,
  inventoryRiskCount,
  products,
  setActiveTab,
  t,
}) {
  return (
    <section className="admin-panel admin-inventory-panel">
      <div className="admin-inventory-command">
        <div className="admin-inventory-command-copy">
          <p className="admin-kicker"><Boxes size={15} /> {t('admin.products')}</p>
          <h2>{t('admin.inventoryCommandTitle')}</h2>
          <div className="admin-inventory-command-meta">
            <span>{t('admin.filteredCount', { shown: filteredProducts.length, total: products.length })}</span>
            <span>{t('admin.inventoryUnits')}: {inventoryMetrics.units}</span>
          </div>
        </div>
        <div className="admin-inventory-health">
          <span>{t('admin.inventoryHealth')}</span>
          <strong>{inventoryHealthPercent}%</strong>
          <div className="admin-inventory-health-bar" style={{ '--inventory-health': `${inventoryHealthPercent}%` }}>
            <i />
          </div>
        </div>
      </div>

      <div className="admin-inventory-summary" aria-label={t('admin.inventorySnapshot')}>
        <article className="admin-inventory-summary-card">
          <Boxes size={18} />
          <span>{t('admin.inventorySkus')}</span>
          <strong>{inventoryMetrics.skus}</strong>
        </article>
        <article className="admin-inventory-summary-card is-healthy">
          <CheckCircle2 size={18} />
          <span>{t('admin.stockStatus.healthy')}</span>
          <strong>{inventoryMetrics.healthy}</strong>
        </article>
        <article className="admin-inventory-summary-card is-warning">
          <AlertTriangle size={18} />
          <span>{t('admin.inventoryRisk')}</span>
          <strong>{inventoryRiskCount}</strong>
        </article>
        <article className="admin-inventory-summary-card is-value">
          <ShoppingBag size={18} />
          <span>{t('admin.inventoryValue')}</span>
          <strong>{formatCurrency(inventoryMetrics.value)}</strong>
        </article>
      </div>

      <div className="admin-inventory-tabs" role="tablist" aria-label={t('admin.products')}>
        <button
          type="button"
          className={activeTab === 'items' ? 'is-active' : ''}
          role="tab"
          aria-selected={activeTab === 'items'}
          onClick={() => setActiveTab('items')}
        >
          <Boxes size={16} />
          {t('admin.inventoryTabItems')}
        </button>
        <button
          type="button"
          className={activeTab === 'history' ? 'is-active' : ''}
          role="tab"
          aria-selected={activeTab === 'history'}
          onClick={() => setActiveTab('history')}
        >
          <History size={16} />
          {t('admin.inventoryTabHistory')}
          <span>{inventoryHistory.length}</span>
        </button>
      </div>
    </section>
  )
}

export default InventoryOverviewPanel
