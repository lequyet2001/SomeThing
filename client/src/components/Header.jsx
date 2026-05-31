import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCheck, CreditCard, LayoutDashboard, LogIn, LogOut, Mail, Menu, ShoppingBag, ShoppingCart, Trash2, User, UserPlus, X } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'

function formatNotificationDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function Header({
  cartCount,
  notifications = [],
  unreadNotificationCount = 0,
  user,
  onDeleteNotification,
  onLogout,
  onMarkAllNotificationsRead,
  onOpenNotification,
}) {
  const { language, t, toggleLanguage } = useLanguage()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
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
    setShowNotifications(false)
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

  const handleOpenNotification = (notification) => {
    closeMenus()
    onOpenNotification?.(notification)
  }

  const handleMarkAllNotificationsRead = () => {
    onMarkAllNotificationsRead?.()
  }

  const handleDeleteNotification = (event, notificationId) => {
    event.stopPropagation()
    onDeleteNotification?.(notificationId)
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
              <NavLink to="/cart" onClick={closeMenus} data-cart-target><ShoppingCart size={17} /> <span>{t('header.cartCount', { count: cartCount })}</span></NavLink>
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
            <>
              <div className="notification-menu-container">
                <button
                  className="notification-button"
                  type="button"
                  aria-expanded={showNotifications}
                  aria-label={t('header.notifications')}
                  onClick={() => {
                    setShowNotifications((current) => !current)
                    setShowUserMenu(false)
                  }}
                >
                  <Bell size={17} />
                  {unreadNotificationCount > 0 && <span className="notification-badge">{unreadNotificationCount}</span>}
                </button>
                {showNotifications && (
                  <div className="notification-dropdown">
                    <div className="notification-dropdown-heading">
                      <strong>{t('header.notifications')}</strong>
                      <button type="button" onClick={handleMarkAllNotificationsRead} disabled={unreadNotificationCount === 0}>
                        <CheckCheck size={15} />
                        {t('header.markAllRead')}
                      </button>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="notification-empty">{t('header.noNotifications')}</div>
                    ) : (
                      <div className="notification-list">
                        {notifications.slice(0, 8).map((notification) => (
                          <article
                            key={notification.id}
                            className={`notification-item ${notification.isRead ? '' : 'is-unread'}`.trim()}
                          >
                            <button type="button" className="notification-item-main" onClick={() => handleOpenNotification(notification)}>
                              <span aria-hidden="true" />
                              <div>
                                <strong>{notification.title}</strong>
                                <p>{notification.message}</p>
                                <small>{formatNotificationDate(notification.createdAt)}</small>
                              </div>
                            </button>
                            <button
                              type="button"
                              className="notification-delete"
                              aria-label={t('header.deleteNotification')}
                              onClick={(event) => handleDeleteNotification(event, notification.id)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div
                className="user-menu-container"
                onMouseEnter={() => {
                  setShowUserMenu(true)
                  setShowNotifications(false)
                }}
              >
                <button className="user-name" type="button" onClick={() => setShowUserMenu((current) => !current)}>
                  {user.avatar ? <img className="user-avatar" src={user.avatar} alt="" /> : <User size={17} />}
                  <span>{user.name}</span>
                </button>
                {showUserMenu && (
                  <div className="user-menu-dropdown" onMouseLeave={() => setShowUserMenu(false)}>
                  <button className="menu-item" onClick={handleUserInfo}><User size={16} /> {t('header.accountInfo')}</button>
                  <button onClick={() => goTo('/cart')} data-cart-target><ShoppingCart size={16} /> {t('header.cartCount', { count: cartCount })}</button>
                  <button className="menu-item logout" onClick={handleLogout}><LogOut size={16} /> {t('common.logout')}</button>

                  </div>
                )}
              </div>
            </>
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
