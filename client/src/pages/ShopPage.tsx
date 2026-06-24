import { ArrowDownUp, ChevronLeft, ChevronRight, Eye, PackageSearch, Search, ShoppingCart, SlidersHorizontal, Tag, X } from 'lucide-react'
import {
  CustomerEmptyState,
  CustomerSectionHeader,
  customerInputGroupClass,
  customerMutedPillClass,
  customerPanelClass,
  customerPrimaryButtonClass,
  customerProductCardClass,
  customerSecondaryButtonClass,
  customerSoftPanelClass,
} from '../components/customer/CustomerSurface'
import { useLanguage } from '../i18n/LanguageContext'
import type { EntityId, Pagination, Product } from '../types/shop'
import { formatCategoryLabel } from '../utils/categoryLabel'
import { formatCurrency } from '../utils/currency'

function ShopPage({
  categories,
  category,
  filteredProducts,
  isLoading = false,
  pagination,
  query,
  sortOrder,
  onAddToCart,
  onCategoryChange,
  onOpenProduct,
  onPageChange,
  onQueryChange,
  onSortChange,
}: {
  categories: string[]
  category: string
  filteredProducts: Product[]
  isLoading?: boolean
  pagination: Pagination
  query: string
  sortOrder: string
  onAddToCart: (productId: EntityId, quantity?: number, sourceElement?: HTMLElement | null) => void
  onCategoryChange: (category: string) => void
  onOpenProduct: (productId: EntityId) => void
  onPageChange: (page: number) => void
  onQueryChange: (query: string) => void
  onSortChange: (sortOrder: string) => void
}) {
  const { t } = useLanguage()
  const getCategoryLabel = (item: string) => (item === 'Tat ca' ? t('shop.allCategories') : formatCategoryLabel(item))
  const sortOptions = [
    { label: t('shop.sortDefault'), value: 'default' },
    { label: t('shop.sortLow'), value: 'price-asc' },
    { label: t('shop.sortHigh'), value: 'price-desc' },
  ]
  const currentPage = pagination?.page || 1
  const totalPages = pagination?.totalPages || 1
  const totalProducts = pagination?.total ?? filteredProducts.length
  const productSkeletonCount = pagination?.limit || 10

  return (
    <section className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <aside className={`${customerPanelClass} h-fit p-3 md:p-3 lg:sticky lg:top-24`}>
        <div className="grid gap-4">
          <div className={`${customerSoftPanelClass} p-4 md:p-4`}>
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-primaryDark"><SlidersHorizontal size={15} /> {t('shop.filterTitle')}</p>
            <h1 className="text-2xl font-black leading-tight text-ink">{t('shop.title')}</h1>
            <span className="text-sm font-semibold leading-6 text-muted">{t('shop.filterText')}</span>
          </div>

          <div className={customerInputGroupClass}>
            <label className="text-sm font-black text-primaryDark" htmlFor="product-search">{t('shop.search')}</label>
            <div className="flex items-center gap-2 rounded-md border border-lineStrong/60 bg-white px-3 py-2 shadow-soft focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
              <Search className="shrink-0 text-primaryDark" size={18} />
              <input
                className="border-0 bg-transparent p-0 shadow-none focus:ring-0"
                id="product-search"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder={t('shop.placeholder')}
              />
              {query && (
                <button type="button" className="size-8 min-h-0 px-0" onClick={() => onQueryChange('')} aria-label={t('shop.clearFilters')}>
                  <X size={17} />
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-3 rounded-md border border-lineStrong/50 bg-sky-50 p-3 shadow-soft">
            <div className="inline-flex items-center gap-2 text-sm font-black text-primaryDark"><Tag size={15} /> {t('home.categories')}</div>
            <select
              className="lg:hidden"
              aria-label={t('home.categories')}
              value={category}
              onChange={(event) => onCategoryChange(event.target.value)}
            >
              {categories.map((item) => (
                <option key={item} value={item}>{getCategoryLabel(item)}</option>
              ))}
            </select>
            <div className="hidden flex-wrap gap-2 lg:flex">
              {categories.map((item) => (
                <button
                  type="button"
                  className={`min-h-9 rounded-full px-3 py-1.5 text-xs ${category === item ? 'border-primary bg-primary/10 text-primaryDark shadow-soft' : 'border-line bg-white text-muted'}`}
                  key={item}
                  onClick={() => onCategoryChange(item)}
                >
                  {getCategoryLabel(item)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 rounded-md border border-lineStrong/50 bg-white p-3 shadow-soft">
            <div className="inline-flex items-center gap-2 text-sm font-black text-primaryDark"><ArrowDownUp size={15} /> {t('shop.sort')}</div>
            <select
              className="lg:hidden"
              aria-label={t('shop.sort')}
              value={sortOrder}
              onChange={(event) => onSortChange(event.target.value)}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <div className="hidden gap-2 lg:grid">
              {sortOptions.map((option) => (
                <button
                  type="button"
                  className={`justify-start ${sortOrder === option.value ? 'border-primary bg-primary/10 text-primaryDark shadow-soft' : 'border-line bg-white text-muted'}`}
                  key={option.value}
                  onClick={() => onSortChange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2 rounded-md border border-primary/20 bg-gradient-to-br from-primary/10 to-emerald-50 p-4 shadow-soft">
            <strong className="text-3xl font-black text-primaryDark">{totalProducts}</strong>
            <span className="text-sm font-extrabold text-muted">{t('shop.matchLabel')}</span>
          </div>
        </div>
      </aside>

      <section className="grid gap-4">
        <CustomerSectionHeader
          eyebrow={<><PackageSearch size={15} /> {t('shop.results')}</>}
          title={t('shop.pageCount', { shown: filteredProducts.length, total: totalProducts })}
          meta={<span className={customerMutedPillClass}>{getCategoryLabel(category)}</span>}
        />

        {!isLoading && filteredProducts.length === 0 ? (
          <CustomerEmptyState
            title={t('shop.emptyTitle')}
            description={t('shop.emptyText')}
            icon={<PackageSearch size={24} />}
            action={(
              <button
                type="button"
                className={customerSecondaryButtonClass}
                onClick={() => {
                  onQueryChange('')
                  onCategoryChange('Tat ca')
                  onSortChange('default')
                }}
              >
                <X size={17} />
                {t('shop.clearFilters')}
              </button>
            )}
          />
        ) : (
          <>
            <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy={isLoading}>
              {isLoading ? Array.from({ length: productSkeletonCount }).map((_, index) => (
                <article className="grid gap-3 rounded-md border border-lineStrong/60 bg-white p-3 shadow-liquid ring-1 ring-white/80" key={`product-loading-${index}`} aria-hidden="true">
                  <div className="aspect-[4/3] w-full animate-pulse rounded-md border border-line bg-slate-200" />
                  <div className="grid gap-2">
                    <span className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
                    <span className="h-5 w-full animate-pulse rounded-full bg-slate-200" />
                    <span className="h-5 w-4/5 animate-pulse rounded-full bg-slate-200" />
                    <div className="flex items-center justify-between gap-2">
                      <span className="h-6 w-28 animate-pulse rounded-full bg-slate-200" />
                      <span className="h-6 w-16 animate-pulse rounded-full bg-slate-200" />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="h-10 w-24 animate-pulse rounded-md bg-slate-200" />
                      <span className="h-10 w-32 animate-pulse rounded-md bg-slate-200" />
                    </div>
                  </div>
                </article>
              )) : filteredProducts.map((product) => (
                <article className={customerProductCardClass} key={product.id}>
                  <button className="group aspect-[4/3] w-full overflow-hidden rounded-md border border-line bg-surfaceMuted p-0 shadow-none" onClick={() => onOpenProduct(product.id)}>
                    <img className="h-full w-full object-cover transition duration-500 group-hover:scale-105" src={product.image} alt={product.name} />
                  </button>
                  <div className="grid gap-2">
                    <p className="text-xs font-black uppercase text-primaryDark">{formatCategoryLabel(product.category)}</p>
                    <h2 className="line-clamp-2 min-h-14 text-base font-black leading-7 text-ink">{product.name}</h2>
                    <div className="flex items-center justify-between gap-2 text-sm font-semibold text-muted">
                      <strong className="text-lg font-black text-primaryDark">{formatCurrency(product.price)}</strong>
                      <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-black text-amber-700">{t('product.star', { count: product.rating || 0 })}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button className={customerSecondaryButtonClass} onClick={() => onOpenProduct(product.id)}><Eye size={17} /> {t('common.view')}</button>
                      <button className={customerPrimaryButtonClass} onClick={(event) => onAddToCart(product.id, 1, event.currentTarget)}>
                        <ShoppingCart size={17} /> {t('shop.addCart')}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            {(totalPages > 1 || isLoading) && (
              <nav className="flex flex-wrap items-center justify-center gap-2" aria-label={t('shop.pagination')}>
                <button
                  type="button"
                  className={customerSecondaryButtonClass}
                  disabled={isLoading || currentPage === 1}
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                >
                  <ChevronLeft size={17} />
                  {t('shop.prevPage')}
                </button>
                <span className={customerMutedPillClass}>{t('shop.pageStatus', { page: currentPage, total: totalPages })}</span>
                <button
                  type="button"
                  className={customerSecondaryButtonClass}
                  disabled={isLoading || currentPage === totalPages}
                  onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
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
