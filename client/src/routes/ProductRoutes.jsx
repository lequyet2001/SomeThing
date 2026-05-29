import { Navigate, useLocation, useParams } from 'react-router-dom'

import ProductPage from '../pages/ProductPage'
import { createProductPath, getProductIdFromPathSlug } from '../utils/slug'

export function ProductSlugRoute({ products, reviews, user, onAddToCart, onBack, onRequestReviewLogin, onSubmitReview }) {
  const location = useLocation()
  const prefix = '/products-'

  if (!location.pathname.startsWith(prefix)) {
    return <Navigate to="/" replace />
  }

  const productSlug = decodeURIComponent(location.pathname.slice(prefix.length))
  const productId = getProductIdFromPathSlug(productSlug)
  const product = products.find((item) => item.id === productId)

  if (!product) {
    return <Navigate to="/shop" replace />
  }

  return (
    <ProductPage
      product={product}
      reviews={reviews}
      user={user}
      onAddToCart={onAddToCart}
      onBack={onBack}
      onRequestReviewLogin={onRequestReviewLogin}
      onSubmitReview={(event) => onSubmitReview(event, product)}
    />
  )
}

export function LegacyProductRedirect({ products }) {
  const { productId } = useParams()
  const product = products.find((item) => item.id === Number(productId))

  if (!product) {
    return <Navigate to="/shop" replace />
  }

  return <Navigate to={createProductPath(product)} replace />
}
