import { AlertTriangle, Boxes, CheckCircle2, PackagePlus, ShoppingBag } from 'lucide-react'

import type { InventoryOverviewPanelProps } from '../../../types/shop'
import { formatCurrency } from '../../../utils/currency'

function InventoryOverviewPanel({
  filteredProducts,
  inventoryHealthPercent,
  inventoryMetrics,
  inventoryRiskCount,
  onAddProduct,
  products,
  t,
}: InventoryOverviewPanelProps) {
  return (
    <section className="grid gap-4 rounded-md border border-line bg-white p-4 shadow-liquid">
      <div className="grid gap-4 lg:grid-cols-[1fr_280px] lg:items-center">
        <div className="grid gap-3">
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-primaryDark"><Boxes size={15} /> {t('admin.products')}</p>
          <h2>{t('admin.inventoryCommandTitle')}</h2>
          <div className="flex flex-wrap gap-2 text-sm font-bold text-muted">
            <span>{t('admin.filteredCount', { shown: filteredProducts.length, total: products.length })}</span>
            <span>{t('admin.inventoryUnits')}: {inventoryMetrics.units}</span>
          </div>
          <button type="button" className="inline-flex w-fit items-center justify-center gap-2 rounded-md border border-primary bg-primary px-4 py-2.5 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 hover:border-primaryDark hover:bg-primaryDark hover:shadow-panel focus:outline-none focus:ring-4 focus:ring-primary/20" onClick={onAddProduct}>
            <PackagePlus size={15} />
            {t('admin.addInventoryItem')}
          </button>
        </div>
        <div className="rounded-md border border-line bg-surfaceMuted p-4">
          <span>{t('admin.inventoryHealth')}</span>
          <strong>{inventoryHealthPercent}%</strong>
          <div className="h-3 overflow-hidden rounded-full bg-primary/10">
            <i className="block h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${inventoryHealthPercent}%` }} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label={t('admin.inventorySnapshot')}>
        <article className="rounded-md border border-line bg-white p-4 shadow-liquid transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-liquidHover">
          <Boxes size={18} />
          <span>{t('admin.inventorySkus')}</span>
          <strong>{inventoryMetrics.skus}</strong>
        </article>
        <article className="rounded-md border border-emerald-200 bg-emerald-50 p-4 shadow-liquid transition hover:-translate-y-0.5 hover:shadow-liquidHover">
          <CheckCircle2 size={18} />
          <span>{t('admin.stockStatus.healthy')}</span>
          <strong>{inventoryMetrics.healthy}</strong>
        </article>
        <article className="rounded-md border border-amber-200 bg-amber-50 p-4 shadow-liquid transition hover:-translate-y-0.5 hover:shadow-liquidHover">
          <AlertTriangle size={18} />
          <span>{t('admin.inventoryRisk')}</span>
          <strong>{inventoryRiskCount}</strong>
        </article>
        <article className="rounded-md border border-primary/20 bg-primary/5 p-4 shadow-liquid transition hover:-translate-y-0.5 hover:shadow-liquidHover">
          <ShoppingBag size={18} />
          <span>{t('admin.inventoryValue')}</span>
          <strong>{formatCurrency(inventoryMetrics.value)}</strong>
        </article>
      </div>
    </section>
  )
}

export default InventoryOverviewPanel
