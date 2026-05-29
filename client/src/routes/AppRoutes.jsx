import { Navigate, Route, Routes } from 'react-router-dom'

import AccountPage from '../pages/AccountPage'
import AuthPage from '../pages/AuthPage'
import CartPage from '../pages/CartPage'
import CheckoutPage from '../pages/CheckoutPage'
import ContactPage from '../pages/ContactPage'
import HomePage from '../pages/HomePage'
import PaymentPage from '../pages/PaymentPage'
import ShopPage from '../pages/ShopPage'
import StoreAdminPage from '../pages/StoreAdminPage'
import { LegacyProductRedirect, ProductSlugRoute } from './ProductRoutes'

function AppRoutes({ shop }) {
  const { actions } = shop
  const renderAdminPage = (section) =>
    shop.user?.role === 'admin' ? (
      <StoreAdminPage section={section} />
    ) : (
      <Navigate to={shop.user ? '/account' : '/login'} replace />
    )

  return (
    <Routes>
      <Route
        path="/"
        element={
          <HomePage
            products={shop.products}
            categories={shop.categories}
            onAddToCart={actions.addToCart}
            onOpenProduct={actions.goToProduct}
            onShop={() => actions.navigate('/shop')}
            onShopCategory={actions.goToCategory}
          />
        }
      />
      <Route
        path="/shop"
        element={
          <ShopPage
            categories={shop.categories}
            category={shop.category}
            filteredProducts={shop.filteredProducts}
            query={shop.query}
            sortOrder={shop.sortOrder}
            onAddToCart={actions.addToCart}
            onCategoryChange={actions.setCategory}
            onOpenProduct={actions.goToProduct}
            onQueryChange={actions.setQuery}
            onSortChange={actions.setSortOrder}
          />
        }
      />
      <Route
        path="/admin"
        element={
          shop.user?.role === 'admin' ? (
            <Navigate to="/admin/overview" replace />
          ) : (
            <Navigate to={shop.user ? '/account' : '/login'} replace />
          )
        }
      />
      <Route path="/admin/overview" element={renderAdminPage('overview')} />
      <Route path="/admin/orders" element={renderAdminPage('orders')} />
      <Route path="/admin/products" element={renderAdminPage('products')} />
      <Route path="/admin/users" element={renderAdminPage('users')} />
      <Route path="/admin/contacts" element={renderAdminPage('contacts')} />
      <Route
        path="*"
        element={
          <ProductSlugRoute
            products={shop.products}
            reviews={shop.reviews}
            user={shop.user}
            onAddToCart={actions.addToCart}
            onBack={() => actions.navigate('/shop')}
            onRequestReviewLogin={actions.openReviewLogin}
            onSubmitReview={actions.submitReview}
          />
        }
      />
      <Route path="/products/:productId" element={<LegacyProductRedirect products={shop.products} />} />
      <Route
        path="/cart"
        element={
          <CartPage
            cartLines={shop.cartLines}
            subtotal={shop.subtotal}
            shipping={shop.shipping}
            total={shop.total}
            onCheckout={() => actions.navigate('/checkout')}
            onRemove={actions.removeFromCart}
            onUpdateQuantity={actions.updateQuantity}
          />
        }
      />
      <Route
        path="/checkout"
        element={
          <CheckoutPage
            cartLines={shop.cartLines}
            subtotal={shop.subtotal}
            shipping={shop.shipping}
            total={shop.total}
            user={shop.user}
            onSubmitCheckout={actions.submitCheckout}
          />
        }
      />
      <Route path="/payment" element={<PaymentPage order={shop.order} onContinue={() => actions.navigate('/shop')} />} />
      <Route path="/contact" element={<ContactPage onSubmitContact={actions.submitContact} />} />
      <Route
        path="/account"
        element={
          <AccountPage
            cartCount={shop.cartLines.length}
            lastOrder={shop.order}
            orders={shop.orders}
            totalInCart={shop.subtotal}
            user={shop.user}
            onLogin={() => actions.navigate('/login')}
            onSubmitProfile={actions.submitProfile}
          />
        }
      />
      <Route
        path="/login"
        element={<AuthPage mode="login" onNavigate={actions.goToLegacyPage} onSubmit={actions.handleAuth} />}
      />
      <Route
        path="/register"
        element={<AuthPage mode="register" onNavigate={actions.goToLegacyPage} onSubmit={actions.handleAuth} />}
      />
    </Routes>
  )
}

export default AppRoutes
