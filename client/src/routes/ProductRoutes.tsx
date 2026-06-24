import { lazy, Suspense, useEffect, useState } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'

import { shopApi } from '../services/shopApi'
import type { EntityId, Product, Review, ReviewFormValues, User } from '../types/shop'
import { ProductPageSkeleton } from '../components/ui/PageSkeleton'
import { createProductPath, encodeProductId, getProductIdFromPathSlug } from '../utils/slug'

const ProductPage = lazy(() => import('../pages/ProductPage'))

export function ProductSlugRoute({
  products,
  reviews,
  reviewsLoading = false,
  user,
  onAddToCart,
  onBack,
  onRequestReviewLogin,
  onSubmitReview,
}: {
  products: Product[]
  reviews: Review[]
  reviewsLoading?: boolean
  user: User | null
  onAddToCart: (productId: EntityId, quantity?: number, sourceElement?: HTMLElement | null) => void
  onBack: () => void
  onRequestReviewLogin: () => void
  onSubmitReview: (values: ReviewFormValues & { rating?: number }, product: Product) => Promise<boolean | undefined>
}) {
  const location = useLocation()
  const [loadedProduct, setLoadedProduct] = useState<Product | null>(null)
  const [loadError, setLoadError] = useState(false)
  const prefix = '/products-'
  const isProductPath = location.pathname.startsWith(prefix)
  const productSlug = isProductPath ? decodeURIComponent(location.pathname.slice(prefix.length)) : ''
  const productId = isProductPath ? getProductIdFromPathSlug(productSlug) : null
  const summaryProduct = productId ? products.find((item) => Number(item.id) === productId) : null
  const product = loadedProduct?.id === productId ? loadedProduct : summaryProduct

  useEffect(() => {
    if (!isProductPath || !productId) return undefined

    let isMounted = true
    const resolvedProductId = productId
    setLoadError(false)

    if (summaryProduct?.description) {
      setLoadedProduct(summaryProduct)
      return undefined
    }

    async function loadProduct() {
      try {
        const data = await shopApi.getProduct(resolvedProductId)
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
    return <ProductPageSkeleton />
  }

  return (
    <Suspense fallback={<ProductPageSkeleton />}>
      <ProductPage
        product={product}
        reviews={reviews}
        reviewsLoading={reviewsLoading}
        user={user}
        onAddToCart={onAddToCart}
        onBack={onBack}
        onRequestReviewLogin={onRequestReviewLogin}
        onSubmitReview={(values: ReviewFormValues & { rating?: number }) => onSubmitReview(values, product)}
      />
    </Suspense>
  )
}

export function LegacyProductRedirect({ products }: { products: Product[] }) {
  const { productId } = useParams()
  const normalizedProductId = Number(productId)
  const product = products.find((item) => Number(item.id) === normalizedProductId)

  if (!product) {
    return <Navigate to={`/products-san-pham-x${encodeProductId(normalizedProductId)}`} replace />
  }

  return <Navigate to={createProductPath(product)} replace />
}
