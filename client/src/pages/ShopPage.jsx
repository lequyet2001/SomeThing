import { useEffect, useMemo, useState } from 'react'
import { formatCurrency } from '../utils/currency'
import { ArrowDownUp, ChevronLeft, ChevronRight, Eye, PackageSearch, Search, ShoppingCart, SlidersHorizontal, Tag, X } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import { formatCategoryLabel } from '../utils/categoryLabel'

const SHOP_PAGE_SIZE = 9

function ShopPage({
  categories,
  category,
  filteredProducts,
  query,
  sortOrder,
  onAddToCart,
  onCategoryChange,
  onOpenProduct,
  onQueryChange,
  onSortChange,
}) {
  const { t } = useLanguage()
  const [currentPage, setCurrentPage] = useState(1)
  const getCategoryLabel = (item) => (item === 'Tat ca' ? t('shop.allCategories') : formatCategoryLabel(item))
  const sortOptions = [
    { label: t('shop.sortDefault'), value: 'default' },
    { label: t('shop.sortLow'), value: 'price-asc' },
    { label: t('shop.sortHigh'), value: 'price-desc' },
  ]
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / SHOP_PAGE_SIZE))
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * SHOP_PAGE_SIZE
    return filteredProducts.slice(startIndex, startIndex + SHOP_PAGE_SIZE)
  }, [currentPage, filteredProducts])

  useEffect(() => {
    setCurrentPage(1)
  }, [category, query, sortOrder])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  return (
    <section className="shop-layout">
      <aside className="filter-panel">
        <div className="filter-content">
          <div className="filter-heading">
            <p><SlidersHorizontal size={15} /> {t('shop.filterTitle')}</p>
            <h1>{t('shop.title')}</h1>
            <span>{t('shop.filterText')}</span>
          </div>

          <div className="search-box">
            <label htmlFor="product-search">{t('shop.search')}</label>
            <div className="search-input-row">
              <Search className="search-icon" size={18} />
              <input
                id="product-search"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder={t('shop.placeholder')}
              />
              {query && (
                <button type="button" onClick={() => onQueryChange('')} aria-label={t('shop.clearFilters')}>
                  <X size={17} />
                </button>
              )}
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-group-title"><Tag size={15} /> {t('home.categories')}</div>
            <select
              className="mobile-filter-select"
              aria-label={t('home.categories')}
              value={category}
              onChange={(event) => onCategoryChange(event.target.value)}
            >
              {categories.map((item) => (
                <option key={item} value={item}>{getCategoryLabel(item)}</option>
              ))}
            </select>
            <div className="filter-chip-list">
              {categories.map((item) => (
                <button
                  type="button"
                  className={category === item ? 'active' : ''}
                  key={item}
                  onClick={() => onCategoryChange(item)}
                >
                  {getCategoryLabel(item)}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-group-title"><ArrowDownUp size={15} /> {t('shop.sort')}</div>
            <select
              className="mobile-filter-select"
              aria-label={t('shop.sort')}
              value={sortOrder}
              onChange={(event) => onSortChange(event.target.value)}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <div className="sort-option-list">
              {sortOptions.map((option) => (
                <button
                  type="button"
                  className={sortOrder === option.value ? 'active' : ''}
                  key={option.value}
                  onClick={() => onSortChange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="summary-box">
            <strong>{filteredProducts.length}</strong>
            <span>{t('shop.matchLabel')}</span>
          </div>
        </div>
      </aside>

      <section className="shop-results">
        <div className="results-toolbar">
          <div>
            <p><PackageSearch size={15} /> {t('shop.results')}</p>
            <h2>{t('shop.pageCount', { shown: paginatedProducts.length, total: filteredProducts.length })}</h2>
          </div>
          <span>{getCategoryLabel(category)}</span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="shop-empty-state">
            <h2>{t('shop.emptyTitle')}</h2>
            <p>{t('shop.emptyText')}</p>
            <button type="button" onClick={() => {
              onQueryChange('')
              onCategoryChange('Tat ca')
              onSortChange('default')
            }}>
              <X size={17} /> {t('shop.clearFilters')}
            </button>
          </div>
        ) : (
          <>
            <section className="catalog">
              {paginatedProducts.map((product) => (
                <article className="product-card" key={product.id}>
                  <button className="product-media" onClick={() => onOpenProduct(product.id)}>
                    <img src={product.image} alt={product.name} />
                  </button>
                  <div className="product-info">
                    <p>{formatCategoryLabel(product.category)}</p>
                    <h2>{product.name}</h2>
                    <div className="meta-line">
                      <strong>{formatCurrency(product.price)}</strong>
                      <span>{t('product.star', { count: product.rating })}</span>
                    </div>
                    <div className="card-actions">
                      <button onClick={() => onOpenProduct(product.id)}><Eye size={17} /> {t('common.view')}</button>
                      <button className="dark" onClick={(event) => onAddToCart(product.id, 1, event.currentTarget)}>
                        <ShoppingCart size={17} /> {t('shop.addCart')}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            {totalPages > 1 && (
              <nav className="shop-pagination" aria-label={t('shop.pagination')}>
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                >
                  <ChevronLeft size={17} />
                  {t('shop.prevPage')}
                </button>
                <span>{t('shop.pageStatus', { page: currentPage, total: totalPages })}</span>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                >
                  {t('shop.nextPage')}
                  <ChevronRight size={17} />
                </button>
              </nav>
            )}
          </>
        )}
      </section>
    </section>
  )
}

export default ShopPage
