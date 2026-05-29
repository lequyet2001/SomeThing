import { formatCurrency } from '../utils/currency'
import { ArrowRight, Headphones, RotateCcw, ShoppingBag, ShoppingCart, Truck } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import { formatCategoryLabel } from '../utils/categoryLabel'

function HomePage({ products, categories, onAddToCart, onOpenProduct, onShop, onShopCategory }) {
  const { t } = useLanguage()
  const heroProduct = products[0]
  const featuredProducts = products.slice(0, 4)
  const categoryTiles = categories.filter((item) => item !== 'Tat ca').slice(0, 4)

  if (!heroProduct) {
    return (
      <section className="home-page">
        <section className="home-empty">
          <p className="home-kicker">{t('home.emptyKicker')}</p>
          <h1>{t('home.emptyTitle')}</h1>
          <p>{t('home.emptyText')}</p>
          <button className="primary-action" onClick={onShop}>
            <ShoppingBag size={18} />
            {t('common.shop')}
          </button>
        </section>
      </section>
    )
  }

  return (
    <section className="home-page">
      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="home-kicker">{t('home.heroKicker')}</p>
          <h1>{t('home.heroTitle')}</h1>
          <p>
            {t('home.heroText')}
          </p>
          <div className="home-actions">
            <button className="primary-action" onClick={onShop}><ShoppingBag size={18} /> {t('home.shopNow')}</button>
            <button className="secondary-action" onClick={() => onOpenProduct(heroProduct.id)}>
              {t('home.viewFeatured')} <ArrowRight size={18} />
            </button>
          </div>
        </div>
        <button className="home-hero-media" onClick={() => onOpenProduct(heroProduct.id)}>
          <img src={heroProduct.image} alt={heroProduct.name} />
          <span>{heroProduct.name}</span>
        </button>
      </section>

      <section className="home-services" aria-label="Dịch vụ">
        <article>
          <Truck size={24} />
          <strong>{t('home.serviceShip')}</strong>
          <span>{t('home.serviceShipText')}</span>
        </article>
        <article>
          <RotateCcw size={24} />
          <strong>{t('home.serviceReturn')}</strong>
          <span>{t('home.serviceReturnText')}</span>
        </article>
        <article>
          <Headphones size={24} />
          <strong>{t('home.serviceSupport')}</strong>
          <span>{t('home.serviceSupportText')}</span>
        </article>
      </section>

      <section className="home-section">
        <div className="section-heading">
          <p>{t('home.categories')}</p>
          <h2>{t('home.shopByNeed')}</h2>
        </div>
        <div className="category-grid">
          {categoryTiles.map((item) => (
            <button key={item} onClick={() => onShopCategory(item)}>
              <span>{formatCategoryLabel(item)}</span>
              <strong>{t('home.viewAll')}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="home-section">
        <div className="section-heading">
          <p>{t('home.featured')}</p>
          <h2>{t('home.trending')}</h2>
        </div>
        <div className="home-product-row">
          {featuredProducts.map((product) => (
            <article className="home-product-card" key={product.id}>
              <button className="home-product-media" onClick={() => onOpenProduct(product.id)}>
                <img src={product.image} alt={product.name} />
              </button>
              <div>
                <p>{formatCategoryLabel(product.category)}</p>
                <h3>{product.name}</h3>
                <strong>{formatCurrency(product.price)}</strong>
              </div>
              <button className="secondary-action" onClick={() => onAddToCart(product.id)}>
                <ShoppingCart size={17} /> {t('home.addCart')}
              </button>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}

export default HomePage
