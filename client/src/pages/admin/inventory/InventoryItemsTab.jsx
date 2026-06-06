import { PackagePlus, SlidersHorizontal } from 'lucide-react'

import AdminFilterPanel from '../../../components/admin/AdminFilterPanel'
import AdminSearchInput from '../../../components/admin/AdminSearchInput'
import { formatCategoryLabel } from '../../../utils/categoryLabel'

function InventoryItemsTab({
  filters,
  filteredProducts,
  onAddProduct,
  productCategories,
  products,
  renderInventoryRows,
  resetFilter,
  t,
  updateFilter,
}) {
  return (
    <div className="admin-inventory-items">
      <section className="admin-panel admin-inventory-table-panel">
        <AdminFilterPanel
          className="admin-product-filter admin-inventory-filter"
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

        <div className="admin-inventory-list-heading">
          <div>
            <p className="admin-kicker"><SlidersHorizontal size={15} /> {t('admin.inventoryList')}</p>
            <h3>{t('admin.inventoryTable')}</h3>
          </div>
          <div className="admin-inventory-list-actions">
            <span>{t('admin.filteredCount', { shown: filteredProducts.length, total: products.length })}</span>
            <button type="button" className="admin-panel-open" onClick={onAddProduct}>
              <PackagePlus size={15} />
              {t('admin.addInventoryItem')}
            </button>
          </div>
        </div>
        <div className="admin-table-wrap admin-inventory-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.product')}</th>
                <th>{t('admin.category')}</th>
                <th>{t('admin.price')}</th>
                <th>{t('admin.stockShort')}</th>
                <th>{t('admin.stockStatus')}</th>
                <th>{t('admin.tableActions')}</th>
              </tr>
            </thead>
            <tbody>
              {renderInventoryRows()}
              {filteredProducts.length === 0 && (
                <tr className="admin-empty-row">
                  <td colSpan="6" data-label="">{products.length === 0 ? t('admin.noProducts') : t('admin.noFilterResults')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default InventoryItemsTab
