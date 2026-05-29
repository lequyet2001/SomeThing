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
      <Header cartCount={shop.cart.length} user={shop.user} onLogout={shop.actions.logout} />

      <main>
        <Notification message={shop.authMessage} onClose={shop.actions.dismissNotice} />
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
