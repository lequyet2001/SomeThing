import { useEffect, useState } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'

import ProductPage from '../pages/ProductPage'
import { shopApi } from '../services/shopApi'
import { createProductPath, encodeProductId, getProductIdFromPathSlug } from '../utils/slug'

export function ProductSlugRoute({ products, reviews, user, onAddToCart, onBack, onRequestReviewLogin, onSubmitReview }) {
  const location = useLocation()
  const [loadedProduct, setLoadedProduct] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const prefix = '/products-'
  const isProductPath = location.pathname.startsWith(prefix)
  const productSlug = isProductPath ? decodeURIComponent(location.pathname.slice(prefix.length)) : ''
  const productId = isProductPath ? getProductIdFromPathSlug(productSlug) : null
  const summaryProduct = productId ? products.find((item) => item.id === productId) : null
  const product = loadedProduct?.id === productId ? loadedProduct : summaryProduct

  useEffect(() => {
    if (!isProductPath || !productId) return undefined

    let isMounted = true
    setLoadError(false)

    if (summaryProduct?.description) {
      setLoadedProduct(summaryProduct)
      return undefined
    }

    async function loadProduct() {
      try {
        const data = await shopApi.getProduct(productId)
        if (isMounted) {
          setLoadedProduct(data.product)
        }
      } catch {
        if (isMounted) {
          setLoadError(true)
        }
      }
    }

    loadProduct()

    return () => {
      isMounted = false
    }
  }, [isProductPath, productId, summaryProduct])

  if (!isProductPath) {
    return <Navigate to="/" replace />
  }

  if (!productId || loadError) {
    return <Navigate to="/shop" replace />
  }

  if (!product?.description) {
    return <div className="shop-empty-state">Đang tải sản phẩm...</div>
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
  const normalizedProductId = Number(productId)
  const product = products.find((item) => item.id === normalizedProductId)

  if (!product) {
    return <Navigate to={`/products-san-pham-x${encodeProductId(normalizedProductId)}`} replace />
  }

  return <Navigate to={createProductPath(product)} replace />
}
