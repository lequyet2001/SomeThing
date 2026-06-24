import { ArrowRight, Headphones, RotateCcw, ShoppingBag, ShoppingCart, Truck } from 'lucide-react'
import {
  CustomerEmptyState,
  CustomerHero,
  CustomerSectionHeader,
  customerCardClass,
  customerPrimaryButtonClass,
  customerProductCardClass,
  customerSecondaryButtonClass,
  customerShellClass,
} from '../components/customer/CustomerSurface'
import { useLanguage } from '../i18n/LanguageContext'
import type { EntityId, Product, TopCategory } from '../types/shop'
import { formatCategoryLabel } from '../utils/categoryLabel'
import { formatCurrency } from '../utils/currency'

function HomePage({
  products,
  categories,
  topCategories = [],
  onAddToCart,
  onOpenProduct,
  onShop,
  onShopCategory,
}: {
  products: Product[]
  categories: string[]
  topCategories?: TopCategory[]
  onAddToCart: (productId: EntityId, quantity?: number, sourceElement?: HTMLElement | null) => void
  onOpenProduct: (productId: EntityId) => void
  onShop: () => void
  onShopCategory: (category: string) => void
}) {
  const { t } = useLanguage()
  const heroProduct = products[0]
  const featuredProducts = products.slice(0, 4)
  const categoryTiles = topCategories.length > 0
    ? topCategories.slice(0, 4)
    : categories.filter((item) => item !== 'Tat ca').slice(0, 4).map((category) => ({ category, quantity: 0 }))

  if (!heroProduct) {
    return (
      <section className={customerShellClass}>
        <CustomerEmptyState
          title={t('home.emptyTitle')}
          description={t('home.emptyText')}
          icon={<ShoppingBag size={22} />}
          action={(
            <button className={customerPrimaryButtonClass} onClick={onShop}>
              <ShoppingBag size={18} />
              {t('common.shop')}
            </button>
          )}
        />
      </section>
    )
  }

  return (
    <section className={customerShellClass}>
      <CustomerHero
        eyebrow={t('home.heroKicker')}
        title={t('home.heroTitle')}
        description={t('home.heroText')}
        actions={(
          <>
            <button className={customerPrimaryButtonClass} onClick={onShop}>
              <ShoppingBag size={18} />
              {t('home.shopNow')}
            </button>
            <button className={customerSecondaryButtonClass} onClick={() => onOpenProduct(heroProduct.id)}>
              {t('home.viewFeatured')}
              <ArrowRight size={18} />
            </button>
          </>
        )}
        visual={(
          <button className="group relative min-h-80 overflow-hidden rounded-md border border-lineStrong bg-white p-0 shadow-liquid transition duration-300 hover:-translate-y-1 hover:shadow-panel" onClick={() => onOpenProduct(heroProduct.id)}>
            <img className="h-full min-h-80 w-full object-cover transition duration-500 group-hover:scale-105" src={heroProduct.image} alt={heroProduct.name} />
            <span className="absolute bottom-3 left-3 right-3 rounded-md border border-white/70 bg-white/90 px-3 py-2 text-left text-sm font-black text-primaryDark shadow-soft backdrop-blur">{heroProduct.name}</span>
          </button>
        )}
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Dịch vụ">
        <article className={customerCardClass}>
          <Truck className="text-primary" size={24} />
          <strong className="text-base font-black text-ink">{t('home.serviceShip')}</strong>
          <span className="text-sm font-semibold leading-6 text-muted">{t('home.serviceShipText')}</span>
        </article>
        <article className={customerCardClass}>
          <RotateCcw className="text-primary" size={24} />
          <strong className="text-base font-black text-ink">{t('home.serviceReturn')}</strong>
          <span className="text-sm font-semibold leading-6 text-muted">{t('home.serviceReturnText')}</span>
        </article>
        <article className={customerCardClass}>
          <Headphones className="text-primary" size={24} />
          <strong className="text-base font-black text-ink">{t('home.serviceSupport')}</strong>
          <span className="text-sm font-semibold leading-6 text-muted">{t('home.serviceSupportText')}</span>
        </article>
      </section>

      <section className="grid gap-4">
        <CustomerSectionHeader eyebrow={t('home.categories')} title={t('home.shopByNeed')} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categoryTiles.map((item) => (
            <button className="group grid min-h-28 gap-2 rounded-md border border-lineStrong/60 bg-white p-4 text-left shadow-liquid ring-1 ring-white/80 transition duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/50 hover:bg-sky-50 hover:shadow-liquidHover" key={item.category} onClick={() => onShopCategory(item.category)}>
              <span className="text-base font-black text-ink group-hover:text-primaryDark">{formatCategoryLabel(item.category)}</span>
              <strong className="text-sm font-extrabold text-muted">{item.quantity > 0 ? t('home.soldThisMonth', { count: item.quantity }) : t('home.viewAll')}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4">
        <CustomerSectionHeader eyebrow={t('home.featured')} title={t('home.trending')} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {featuredProducts.map((product) => (
            <article className={customerProductCardClass} key={product.id}>
              <button className="group aspect-[4/3] w-full overflow-hidden rounded-md border border-line bg-surfaceMuted p-0 shadow-none" onClick={() => onOpenProduct(product.id)}>
                <img className="h-full w-full object-cover transition duration-500 group-hover:scale-105" src={product.image} alt={product.name} />
              </button>
              <div className="grid gap-1">
                <p className="text-xs font-black uppercase text-primaryDark">{formatCategoryLabel(product.category)}</p>
                <h3 className="line-clamp-2 min-h-14 text-base font-black leading-7 text-ink">{product.name}</h3>
                <strong className="text-lg font-black text-primaryDark">{formatCurrency(product.price)}</strong>
              </div>
              <button className={customerSecondaryButtonClass} onClick={(event) => onAddToCart(product.id, 1, event.currentTarget)}>
                <ShoppingCart size={17} />
                {t('home.addCart')}
              </button>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}

export default HomePage
