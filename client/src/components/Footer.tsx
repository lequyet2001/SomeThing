import { CreditCard, HomeIcon, Mail, MapPin, Phone, RotateCcw, ShoppingBag, ShoppingCart, Sparkles, Truck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'

function Footer({ onShopCategory }: { onShopCategory: (category: string) => void }) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const currentYear = new Date().getFullYear()
  const footerLinkClass = 'inline-flex w-fit items-center gap-2 rounded-md border border-transparent bg-transparent px-0 py-1.5 text-sm font-extrabold text-muted shadow-none transition hover:border-transparent hover:bg-transparent hover:text-primaryDark'
  const categoryClass = 'inline-flex items-center justify-center rounded-full border border-lineStrong/60 bg-white px-3 py-1.5 text-sm font-extrabold text-primaryDark shadow-soft transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary/5'
  const contactAddress = t('contact.address').replace(/^Địa chỉ: |^Address: /, '')

  return (
    <footer className="mt-auto border-t border-lineStrong/50 bg-gradient-to-b from-white via-sky-50 to-white px-4 pt-10 shadow-[0_-18px_45px_rgba(37,99,235,0.08)] md:px-8">
      <div className="mx-auto grid w-full max-w-[1380px] gap-6">
        <section className="grid overflow-hidden rounded-md border border-lineStrong/60 bg-white shadow-liquid ring-1 ring-white/80 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
          <div className="grid gap-4 border-b border-line bg-gradient-to-br from-white via-sky-50 to-rose-50 p-5 lg:border-b-0 lg:border-r">
            <button className="group w-fit border-0 bg-transparent p-0 text-left shadow-none" onClick={() => navigate('/')}>
              <span className="relative block h-16 w-64 overflow-hidden rounded-md bg-white shadow-soft ring-1 ring-white">
                <img
                  className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.03]"
                  src="/brand/marseille04-logo-footer.png"
                  alt="Marseille04"
                  width={640}
                  height={160}
                />
              </span>
            </button>
            <p className="max-w-md text-sm font-semibold leading-6 text-muted">{t('footer.brandText')}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <span className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700">
                <Truck size={16} />
                {t('footer.freeShip')}
              </span>
              <span className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-black text-primaryDark">
                <RotateCcw size={16} />
                {t('footer.returnPolicy')}
              </span>
            </div>
          </div>

          <nav className="grid content-start gap-2 border-b border-line p-5 sm:border-r lg:border-b-0" aria-label={t('footer.navigation')}>
            <h2 className="text-base font-black text-ink">{t('footer.navigation')}</h2>
            <button className={footerLinkClass} onClick={() => navigate('/')}><HomeIcon size={16} /> {t('common.home')}</button>
            <button className={footerLinkClass} onClick={() => navigate('/shop')}><ShoppingBag size={16} /> {t('common.products')}</button>
            <button className={footerLinkClass} onClick={() => navigate('/cart')}><ShoppingCart size={16} /> {t('common.cart')}</button>
            <button className={footerLinkClass} onClick={() => navigate('/checkout')}><CreditCard size={16} /> {t('common.checkout')}</button>
            <button className={footerLinkClass} onClick={() => navigate('/contact')}><Mail size={16} /> {t('common.contact')}</button>
          </nav>

          <section className="grid content-start gap-3 border-b border-line p-5 lg:border-b-0 lg:border-r">
            <h2 className="text-base font-black text-ink">{t('footer.categories')}</h2>
            <div className="flex flex-wrap gap-2">
              <button className={categoryClass} onClick={() => onShopCategory('Áo')}>Áo</button>
              <button className={categoryClass} onClick={() => onShopCategory('Quần')}>Quần</button>
              <button className={categoryClass} onClick={() => onShopCategory('Túi')}>Túi</button>
              <button className={categoryClass} onClick={() => onShopCategory('Giày')}>Giày</button>
            </div>
          </section>

          <section className="grid content-start gap-3 p-5">
            <h2 className="text-base font-black text-ink">{t('footer.support')}</h2>
            <a className={footerLinkClass} href="tel:19002404"><Phone size={16} /> 1900 2404</a>
            <a className={footerLinkClass} href="mailto:hello@marseille04.vn"><Mail size={16} /> hello@marseille04.vn</a>
            <button className={`${footerLinkClass} text-left`} onClick={() => navigate('/contact')}>
              <MapPin size={16} className="shrink-0" />
              <span className="leading-6">{contactAddress}</span>
            </button>
          </section>
        </section>

        <div className="flex flex-col gap-3 border-t border-lineStrong/50 py-4 text-sm font-bold text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>© {currentYear} Marseille04 Shop</span>
          <span className="inline-flex items-center gap-2 text-primaryDark"><Sparkles size={15} /> {t('footer.freeShip')}</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
