import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'

function Footer({ onShopCategory }: { onShopCategory: (category: string) => void }) {
  const { t } = useLanguage()
  const navigate = useNavigate()

  return (
    <footer className="mt-auto border-t border-line bg-white px-4 py-8 shadow-[0_-18px_45px_rgba(37,99,235,0.06)]">
      <div className="mx-auto grid w-full max-w-[1380px] gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <section className="grid gap-3 rounded-md border border-line bg-surfaceMuted p-4">
          <button className="border-0 bg-transparent p-0 text-xl font-black tracking-wide text-primaryDark shadow-none" onClick={() => navigate('/')}>Marseille04</button>
          <p className="text-sm font-semibold leading-6 text-muted">{t('footer.brandText')}</p>
        </section>

        <section className="grid gap-2">
          <h2 className="text-base font-black text-ink">{t('footer.navigation')}</h2>
          <button className="justify-start border-0 bg-transparent px-0 shadow-none hover:bg-transparent" onClick={() => navigate('/')}>{t('common.home')}</button>
          <button className="justify-start border-0 bg-transparent px-0 shadow-none hover:bg-transparent" onClick={() => navigate('/shop')}>{t('common.products')}</button>
          <button className="justify-start border-0 bg-transparent px-0 shadow-none hover:bg-transparent" onClick={() => navigate('/cart')}>{t('common.cart')}</button>
          <button className="justify-start border-0 bg-transparent px-0 shadow-none hover:bg-transparent" onClick={() => navigate('/checkout')}>{t('common.checkout')}</button>
          <button className="justify-start border-0 bg-transparent px-0 shadow-none hover:bg-transparent" onClick={() => navigate('/contact')}>{t('common.contact')}</button>
        </section>

        <section className="grid gap-2">
          <h2 className="text-base font-black text-ink">{t('footer.categories')}</h2>
          <button className="justify-start border-0 bg-transparent px-0 shadow-none hover:bg-transparent" onClick={() => onShopCategory('Áo')}>Áo</button>
          <button className="justify-start border-0 bg-transparent px-0 shadow-none hover:bg-transparent" onClick={() => onShopCategory('Quần')}>Quần</button>
          <button className="justify-start border-0 bg-transparent px-0 shadow-none hover:bg-transparent" onClick={() => onShopCategory('Túi')}>Túi</button>
          <button className="justify-start border-0 bg-transparent px-0 shadow-none hover:bg-transparent" onClick={() => onShopCategory('Giày')}>Giày</button>
        </section>

        <section className="grid gap-2">
          <h2 className="text-base font-black text-ink">{t('footer.support')}</h2>
          <p className="text-sm font-semibold leading-6 text-muted">Hotline: 1900 2404</p>
          <p className="text-sm font-semibold leading-6 text-muted">Email: hello@marseille04.vn</p>
          <p className="text-sm font-semibold leading-6 text-muted">{t('contact.address')}</p>
        </section>
      </div>

      <div className="mx-auto mt-6 flex w-full max-w-[1380px] flex-col gap-2 border-t border-line pt-4 text-sm font-bold text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>© 2026 Marseille04 Shop</span>
        <span>{t('footer.freeShip')}</span>
      </div>
    </footer>
  )
}

export default Footer
