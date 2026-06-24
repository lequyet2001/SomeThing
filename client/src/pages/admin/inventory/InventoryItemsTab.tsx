import { PackagePlus, SlidersHorizontal } from 'lucide-react'

import AdminFilterPanel from '../../../components/admin/AdminFilterPanel'
import AdminSearchInput from '../../../components/admin/AdminSearchInput'
import DataTable from '../../../components/ui/DataTable'
import LazyViewport from '../../../components/ui/LazyViewport'
import type { InventoryItemsTabProps } from '../../../types/shop'
import { formatCategoryLabel } from '../../../utils/categoryLabel'

function InventoryItemsTab({
  filters,
  filteredProducts,
  focusedProductId,
  inventoryColumns,
  isLoading = false,
  onAddProduct,
  productCategories,
  products,
  resetFilter,
  t,
  updateFilter,
}: InventoryItemsTabProps) {
  return (
    <div className="grid gap-5">
      <section className="grid gap-4 rounded-md border border-line bg-white p-4 shadow-liquid">
        <AdminFilterPanel
          title={t('admin.filters')}
          clearLabel={t('admin.clearFilters')}
          onClear={() => resetFilter('products')}
        >
          <AdminSearchInput
            value={filters.products.query}
            placeholder={t('admin.searchProducts')}
            onChange={(value) => updateFilter('products', 'query', value)}
          />
          <label>
            {t('admin.category')}
            <select
              value={filters.products.category}
              onChange={(event) => updateFilter('products', 'category', event.target.value)}
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
              value={filters.products.stock}
              onChange={(event) => updateFilter('products', 'stock', event.target.value)}
            >
              <option value="all">{t('admin.allStock')}</option>
              <option value="healthy">{t('admin.stockInStock')}</option>
              <option value="low">{t('admin.stockLow')}</option>
              <option value="out">{t('admin.stockOut')}</option>
            </select>
          </label>
          <label>
            {t('admin.minPrice')}
            <input
              type="number"
              min="0"
              value={filters.products.minPrice}
              onChange={(event) => updateFilter('products', 'minPrice', event.target.value)}
            />
          </label>
          <label>
            {t('admin.maxPrice')}
            <input
              type="number"
              min="0"
              value={filters.products.maxPrice}
              onChange={(event) => updateFilter('products', 'maxPrice', event.target.value)}
            />
          </label>
        </AdminFilterPanel>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-primaryDark"><SlidersHorizontal size={15} /> {t('admin.inventoryList')}</p>
            <h3>{t('admin.inventoryTable')}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span>{t('admin.filteredCount', { shown: filteredProducts.length, total: products.length })}</span>
            <button type="button" className="inline-flex items-center justify-center gap-2 rounded-md border border-primary bg-primary px-4 py-2.5 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 hover:border-primaryDark hover:bg-primaryDark hover:shadow-panel focus:outline-none focus:ring-4 focus:ring-primary/20" onClick={onAddProduct}>
              <PackagePlus size={15} />
              {t('admin.addInventoryItem')}
            </button>
          </div>
        </div>
        <LazyViewport fallback={<DataTable columns={inventoryColumns} data={[]} isLoading loadingMessage={t('admin.loading')} loadingRows={7} />} minHeight={420}>
          <DataTable
            columns={inventoryColumns}
            data={isLoading ? [] : filteredProducts}
            emptyMessage={isLoading ? t('admin.loading') : products.length === 0 ? t('admin.noProducts') : t('admin.noFilterResults')}
            getRowDomId={(product) => `admin-product-${product.id}`}
            getRowId={(product) => String(product.id)}
            isLoading={isLoading}
            loadingMessage={t('admin.loading')}
            loadingRows={7}
            rowClassName={(product) => (String(product.id) === String(focusedProductId || '') ? 'border-primary ring-4 ring-primary/10' : '')}
          />
        </LazyViewport>
      </section>
    </div>
  )
}

export default InventoryItemsTab
