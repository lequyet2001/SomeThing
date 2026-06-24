import Footer from './components/Footer'
import Header from './components/Header'
import LoginModal from './components/LoginModal'
import Notification from './components/Notification'
import { useShopState } from './hooks/useShopState'
import AppRoutes from './routes/AppRoutes'
import { useLocation } from 'react-router-dom'

function App() {
  const shop = useShopState()
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header
        cartCount={shop.cart.length}
        notifications={shop.userNotifications}
        unreadNotificationCount={shop.unreadNotificationCount}
        user={shop.user}
        onDeleteNotification={shop.actions.deleteUserNotification}
        onLogout={shop.actions.logout}
        onMarkAllNotificationsRead={shop.actions.markAllUserNotificationsRead}
        onOpenNotification={shop.actions.openUserNotification}
      />

      <main className={isAdminRoute ? 'mx-0 max-w-none px-0 py-0 md:px-0 md:py-0' : undefined}>
        <Notification
          message={shop.authMessage}
          notices={shop.notices}
          onClose={shop.actions.dismissNotice}
          onOpen={shop.actions.openNotice}
        />
        <AppRoutes shop={shop} />
      </main>

      {shop.showReviewLogin && (
        <LoginModal onClose={shop.actions.closeReviewLogin} onSubmit={shop.actions.handleReviewLogin} />
      )}


      {!isAdminRoute && <Footer onShopCategory={shop.actions.goToCategory} />}
    </div>
  )
}

export default App
