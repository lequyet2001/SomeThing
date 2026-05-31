import Footer from './components/Footer'
import Header from './components/Header'
import LoginModal from './components/LoginModal'
import Notification from './components/Notification'
import { useShopState } from './hooks/useShopState'
import AppRoutes from './routes/AppRoutes'

function App() {
  const shop = useShopState()

  return (
    <div className="app-shell">
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

      <main>
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

      <Footer onShopCategory={shop.actions.goToCategory} />
    </div>
  )
}

export default App
