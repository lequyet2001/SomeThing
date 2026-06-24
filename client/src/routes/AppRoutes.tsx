import { lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import type { useShopState } from '../hooks/useShopState'
import HomePage from '../pages/HomePage'
import type { AdminSectionId } from '../types/shop'
import { RoutePageSkeleton } from '../components/ui/PageSkeleton'
import { LegacyProductRedirect, ProductSlugRoute } from './ProductRoutes'

const AccountPage = lazy(() => import('../pages/AccountPage'))
const AuthPage = lazy(() => import('../pages/AuthPage'))
const CartPage = lazy(() => import('../pages/CartPage'))
const CheckoutPage = lazy(() => import('../pages/CheckoutPage'))
const ContactPage = lazy(() => import('../pages/ContactPage'))
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage'))
const HiddenGamePage = lazy(() => import('../pages/HiddenGamePage'))
const PaymentPage = lazy(() => import('../pages/PaymentPage'))
const ResetPasswordPage = lazy(() => import('../pages/ResetPasswordPage'))
const ShopPage = lazy(() => import('../pages/ShopPage'))
const StoreAdminPage = lazy(() => import('../pages/StoreAdminPage'))

function RouteFallback() {
  return <RoutePageSkeleton />
}

type ShopState = ReturnType<typeof useShopState>

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>
}

function AppRoutes({ shop }: { shop: ShopState }) {
  const { actions } = shop
  const renderAdminPage = (section: AdminSectionId) =>
    shop.user?.role === 'admin' ? (
      withSuspense(<StoreAdminPage section={section} />)
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
            topCategories={shop.topCategories}
            onAddToCart={actions.addToCart}
            onOpenProduct={actions.goToProduct}
            onShop={() => actions.navigate('/shop')}
            onShopCategory={actions.goToCategory}
          />
        }
      />
      <Route
        path="/shop"
        element={withSuspense(
          <ShopPage
            categories={shop.categories}
            category={shop.category}
            filteredProducts={shop.filteredProducts}
            isLoading={shop.isCatalogLoading}
            pagination={shop.productPagination}
            query={shop.query}
            sortOrder={shop.sortOrder}
            onAddToCart={actions.addToCart}
            onCategoryChange={actions.setCategory}
            onOpenProduct={actions.goToProduct}
            onPageChange={actions.setProductPage}
            onQueryChange={actions.setQuery}
            onSortChange={actions.setSortOrder}
          />
        )}
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
      <Route path="/admin/inventory" element={renderAdminPage('products')} />
      <Route path="/admin/products" element={renderAdminPage('products')} />
      <Route path="/admin/customers" element={renderAdminPage('customers')} />
      <Route path="/admin/users" element={renderAdminPage('users')} />
      <Route path="/admin/contacts" element={renderAdminPage('contacts')} />
      <Route path="/admin/reviews" element={renderAdminPage('reviews')} />
      <Route
        path="/secret-atelier-runner"
        element={withSuspense(<HiddenGamePage />)}
      />
      <Route
        path="*"
        element={
          <ProductSlugRoute
            products={shop.products}
            reviews={shop.reviews}
            reviewsLoading={shop.reviewsLoading || !shop.reviewsHasLoaded}
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
        element={withSuspense(
          <CartPage
            cartLines={shop.cartLines}
            subtotal={shop.subtotal}
            shipping={shop.shipping}
            total={shop.total}
            onCheckout={() => actions.navigate('/checkout')}
            onRemove={actions.removeFromCart}
            onUpdateQuantity={actions.updateQuantity}
          />
        )}
      />
      <Route
        path="/checkout"
        element={withSuspense(
          <CheckoutPage
            cartLines={shop.cartLines}
            subtotal={shop.subtotal}
            shipping={shop.shipping}
            total={shop.total}
            user={shop.user}
            onSubmitCheckout={actions.submitCheckout}
          />
        )}
      />
      <Route path="/payment" element={withSuspense(<PaymentPage order={shop.order} onContinue={() => actions.navigate('/shop')} />)} />
      <Route path="/contact" element={withSuspense(<ContactPage user={shop.user} onSubmitContact={actions.submitContact} />)} />
      <Route
        path="/account"
        element={withSuspense(
          <AccountPage
            cartCount={shop.cartLines.length}
            contacts={shop.contacts}
            contactsLoading={Boolean(shop.user) && (shop.contactsLoading || !shop.contactsHasLoaded)}
            lastOrder={shop.order}
            orders={shop.orders}
            ordersLoading={Boolean(shop.user) && (shop.ordersLoading || !shop.ordersHasLoaded)}
            totalInCart={shop.subtotal}
            user={shop.user}
            onLogin={() => actions.navigate('/login')}
            onSubmitProfile={actions.submitProfile}
          />
        )}
      />
      <Route
        path="/login"
        element={withSuspense(<AuthPage mode="login" onNavigate={actions.goToLegacyPage} onSubmit={actions.handleAuth} />)}
      />
      <Route
        path="/forgot-password"
        element={withSuspense(<ForgotPasswordPage onSubmit={actions.requestPasswordReset} />)}
      />
      <Route
        path="/reset-password/:token"
        element={withSuspense(<ResetPasswordPage onSubmit={actions.resetPassword} />)}
      />
      <Route
        path="/register"
        element={withSuspense(<AuthPage mode="register" onNavigate={actions.goToLegacyPage} onSubmit={actions.handleAuth} />)}
      />
    </Routes>
  )
}

export default AppRoutes
