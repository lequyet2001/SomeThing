import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'

function Footer({ onShopCategory }) {
  const { t } = useLanguage()
  const navigate = useNavigate()

  return (
    <footer className="site-footer">
      <div className="footer-main">
        <section className="footer-brand">
          <button className="footer-logo" onClick={() => navigate('/')}>Marseille04</button>
          <p>{t('footer.brandText')}</p>
        </section>

        <section>
          <h2>{t('footer.navigation')}</h2>
          <button onClick={() => navigate('/')}>{t('common.home')}</button>
          <button onClick={() => navigate('/shop')}>{t('common.products')}</button>
          <button onClick={() => navigate('/cart')}>{t('common.cart')}</button>
          <button onClick={() => navigate('/checkout')}>{t('common.checkout')}</button>
          <button onClick={() => navigate('/contact')}>{t('common.contact')}</button>
        </section>

        <section>
          <h2>{t('footer.categories')}</h2>
          <button onClick={() => onShopCategory('Áo')}>Áo</button>
          <button onClick={() => onShopCategory('Quần')}>Quần</button>
          <button onClick={() => onShopCategory('Túi')}>Túi</button>
          <button onClick={() => onShopCategory('Giày')}>Giày</button>
        </section>

        <section>
          <h2>{t('footer.support')}</h2>
          <p>Hotline: 1900 2404</p>
          <p>Email: hello@marseille04.vn</p>
          <p>{t('contact.address')}</p>
        </section>
      </div>

      <div className="footer-bottom">
        <span>© 2026 Marseille04 Shop</span>
        <span>{t('footer.freeShip')}</span>
      </div>
    </footer>
  )
}

export default Footer
