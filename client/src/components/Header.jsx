import { useEffect, useRef, useState } from 'react'
import { CreditCard, LayoutDashboard, LogIn, LogOut, Mail, Menu, ShoppingBag, ShoppingCart, User, UserPlus, X } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'

function Header({ cartCount, user, onLogout }) {
  const { language, t, toggleLanguage } = useLanguage()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const headerRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!headerRef.current?.contains(event.target)) {
        closeMenus()
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('touchstart', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('touchstart', handleOutsideClick)
    }
  }, [])

  const closeMenus = () => {
    setShowMobileMenu(false)
    setShowUserMenu(false)
  }

  const goTo = (path) => {
    closeMenus()
    navigate(path)
  }

  const handleLogout = () => {
    closeMenus()
    onLogout()
  }

  const handleUserInfo = () => {
    goTo('/account')
  }

  return (
    <header ref={headerRef} className={`topbar ${showMobileMenu ? 'menu-open' : ''}`}>
      <div className="topbar-main">
        <button className="brand" onClick={() => goTo('/')}>Marseille04</button>
        <button
          className="mobile-menu-button"
          type="button"
          aria-expanded={showMobileMenu}
          aria-label={showMobileMenu ? t('header.closeMenu') : t('header.openMenu')}
          onClick={() => setShowMobileMenu((current) => !current)}
        >
          {showMobileMenu ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div className="topbar-panel">
        <nav className="nav-tabs" aria-label={t('header.nav')}>
          <NavLink to="/shop" onClick={closeMenus}><ShoppingBag size={17} /> <span>{t('common.products')}</span></NavLink>
        {
          !user && (
            <>
              <NavLink to="/cart" onClick={closeMenus}><ShoppingCart size={17} /> <span>{t('header.cartCount', { count: cartCount })}</span></NavLink>
            </>
          )
        }
          <NavLink to="/checkout" onClick={closeMenus}><CreditCard size={17} /> <span>{t('common.checkout')}</span></NavLink>
          <NavLink to="/contact" onClick={closeMenus}><Mail size={17} /> <span>{t('common.contact')}</span></NavLink>
          {user?.role === 'admin' && (
            <NavLink to="/admin/overview" onClick={closeMenus}><LayoutDashboard size={17} /> <span>{t('common.admin')}</span></NavLink>
          )}
        </nav>
        <div className="account-actions">
          <button className="language-toggle" type="button" aria-label={t('language.switch')} onClick={toggleLanguage}>
            {language === 'vi' ? 'EN' : 'VI'}
          </button>
          {user ? (
            <div
              className="user-menu-container"
              onMouseEnter={() => setShowUserMenu(true)}
            >
              <button className="user-name" type="button" onClick={() => setShowUserMenu((current) => !current)}>
                <User size={17} /> {user.name}
              </button>
              {showUserMenu && (
                <div className="user-menu-dropdown" onMouseLeave={() => setShowUserMenu(false)}>
                <button className="menu-item" onClick={handleUserInfo}><User size={16} /> {t('header.accountInfo')}</button>
                <button className="menu-item logout" onClick={handleLogout}><LogOut size={16} /> {t('common.logout')}</button>
                <button onClick={() => goTo('/cart')}><ShoppingCart size={16} /> {t('header.cartCount', { count: cartCount })}</button>

                </div>
              )}
            </div>
          ) : (
            <>
              <button onClick={() => goTo('/login')}><LogIn size={17} /> {t('common.login')}</button>
              <button className="dark" onClick={() => goTo('/register')}><UserPlus size={17} /> {t('common.register')}</button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
