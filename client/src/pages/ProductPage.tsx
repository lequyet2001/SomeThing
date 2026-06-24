import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import { ImagePlus, Send, Sparkles, Star, X } from 'lucide-react'
import { FieldError } from '../components/forms/FieldError'
import {
  customerMutedPillClass,
  customerPanelClass,
  customerPrimaryButtonClass,
  customerSecondaryButtonClass,
} from '../components/customer/CustomerSurface'
import { formatCurrency } from '../utils/currency'
import { useLanguage } from '../i18n/LanguageContext'
import { formatCategoryLabel } from '../utils/categoryLabel'
import type { EntityId, Product, Review, ReviewFormValues, User } from '../types/shop'
import { getAriaInvalid } from '../utils/a11y'
import { createReviewSchema } from '../utils/validationSchemas'

function ProductPage({
  product,
  reviews,
  reviewsLoading = false,
  user,
  onAddToCart,
  onBack,
  onRequestReviewLogin,
  onSubmitReview,
}: {
  product: Product
  reviews: Review[]
  reviewsLoading?: boolean
  user: User | null
  onAddToCart: (productId: EntityId, quantity?: number, sourceElement?: HTMLElement | null) => void
  onBack: () => void
  onRequestReviewLogin: () => void
  onSubmitReview: (values: ReviewFormValues & { rating?: number }) => Promise<boolean | undefined>
}) {
  const { t } = useLanguage()
  const [selectedRating, setSelectedRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [selectedProductImage, setSelectedProductImage] = useState(product.image)
  const [reviewImagePreviews, setReviewImagePreviews] = useState<Array<{ name: string; url: string }>>([])
  const reviewFileInputRef = useRef<HTMLInputElement | null>(null)
  const reviewForm = useForm<ReviewFormValues>({
    resolver: zodResolver(createReviewSchema(t)),
    mode: 'onBlur',
    defaultValues: {
      comment: '',
      images: undefined,
    },
  })
  const productReviews = reviews.filter((review) => review.productId === product.id)
  const productImages = [product.image, ...(product.images || [])].filter(Boolean)
  const displayRating = hoverRating || selectedRating

  useEffect(() => {
    setSelectedProductImage(product.image)
  }, [product.id, product.image])

  function handleReviewImagesChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from((event.target.files as FileList | null) || []).slice(0, 4)
    reviewImagePreviews.forEach((item) => URL.revokeObjectURL(item.url))
    setReviewImagePreviews(files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })))
  }

  function clearReviewImages() {
    reviewImagePreviews.forEach((item) => URL.revokeObjectURL(item.url))
    setReviewImagePreviews([])
    reviewForm.setValue('images', undefined)
    if (reviewFileInputRef.current) {
      reviewFileInputRef.current.value = ''
    }
  }

  useEffect(() => () => {
    reviewImagePreviews.forEach((item) => URL.revokeObjectURL(item.url))
  }, [reviewImagePreviews])

  async function handleValidatedReviewSubmit(values: ReviewFormValues) {
    const saved = await onSubmitReview({ ...values, rating: selectedRating })
    if (saved !== false) {
      setSelectedRating(5)
      setHoverRating(0)
      clearReviewImages()
      reviewForm.reset({ comment: '', images: undefined })
    }
  }

  function handleReviewSubmit(event: FormEvent<HTMLFormElement>) {
    if (!user) {
      event.preventDefault()
      onRequestReviewLogin()
      return
    }

    return reviewForm.handleSubmit(handleValidatedReviewSubmit)(event)
  }

  const imageInputField = reviewForm.register('images')

  return (
    <section className="detail-grid grid gap-8 lg:grid-cols-[minmax(320px,520px)_1fr]">
      <div className={`${customerPanelClass} grid h-fit gap-3 p-3 md:p-3`}>
        <div className="overflow-hidden rounded-md border border-line bg-surfaceMuted">
          <img className="aspect-square h-full w-full object-cover" src={selectedProductImage || product.image} alt={product.name} />
        </div>
        {productImages.length > 1 && (
          <div className="flex flex-wrap gap-2" aria-label={t('product.gallery')}>
            {productImages.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                className={`size-20 overflow-hidden rounded-md border p-0 shadow-soft ${image === selectedProductImage ? 'border-primary bg-primary/10 text-primaryDark' : 'border-line bg-white'}`}
                onClick={() => setSelectedProductImage(image)}
                aria-label={t('product.galleryImage', { index: index + 1 })}
              >
                <img className="h-full w-full object-cover" src={image} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="grid gap-4">
        <button className={`${customerSecondaryButtonClass} w-fit`} onClick={onBack}>{t('common.back')}</button>
        <p className={customerMutedPillClass}>{formatCategoryLabel(product.category)}</p>
        <h1>{product.name}</h1>
        <div className="text-2xl font-black text-primaryDark">{formatCurrency(product.price)}</div>
        <p className="max-w-3xl text-base font-semibold leading-7 text-muted">{product.description}</p>
        <p className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700">{t('product.inStock', { count: product.stock })}</p>
        <button className={`${customerPrimaryButtonClass} w-fit`} onClick={(event) => onAddToCart(product.id, 1, event.currentTarget)}>{t('product.addCart')}</button>

        <section className={`${customerPanelClass} grid gap-4`}>
          <h2 className="flex items-center gap-2">
            <Sparkles size={20} />
            {t('product.reviews')}
          </h2>
          {!user && <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800">{t('product.loginReview')}</p>}
          <form className="grid gap-4 rounded-md border border-lineStrong/50 bg-sky-50 p-4 shadow-soft" noValidate onSubmit={handleReviewSubmit}>
            <input type="hidden" name="rating" value={selectedRating} />
            <div className="grid gap-4" onMouseLeave={() => setHoverRating(0)}>
              <div className="flex items-center gap-1" role="radiogroup" aria-label={t('product.ratingAria')}>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    className={`border-0 bg-transparent p-1 text-slate-300 shadow-none transition duration-200 hover:scale-110 hover:text-amber-400 ${rating <= displayRating ? 'scale-110 text-amber-400' : ''}`}
                    aria-label={`${t('product.star', { count: rating })} - ${t(`rating.${rating}`)}`}
                    aria-checked={selectedRating === rating}
                    role="radio"
                    onClick={() => setSelectedRating(rating)}
                    onFocus={() => setHoverRating(rating)}
                    onMouseEnter={() => setHoverRating(rating)}
                  >
                    <Star size={28} fill="currentColor" />
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <strong className="text-primaryDark">{t(`rating.${displayRating}`)}</strong>
                <span className="text-sm font-semibold text-muted">{t('product.ratingText', { rating: displayRating })}</span>
              </div>
            </div>
            <textarea
              {...reviewForm.register('comment')}
              aria-invalid={getAriaInvalid(reviewForm.formState.errors.comment)}
              placeholder={t('product.reviewPlaceholder', { name: user?.name || 'Khách hàng' })}
            />
            <FieldError error={reviewForm.formState.errors.comment} />
            <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-primary/40 bg-white px-4 py-3 text-sm font-extrabold text-primaryDark shadow-soft transition hover:border-primary hover:bg-primary/10">
              <ImagePlus size={18} />
              <span>{t('product.addReviewImages')}</span>
              <input
                className="hidden"
                {...imageInputField}
                accept="image/*"
                multiple
                ref={(element) => {
                  imageInputField.ref(element)
                  reviewFileInputRef.current = element
                }}
                type="file"
                onChange={(event) => {
                  imageInputField.onChange(event)
                  handleReviewImagesChange(event)
                }}
              />
            </label>
            {reviewImagePreviews.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {reviewImagePreviews.map((image) => (
                  <figure className="size-20 overflow-hidden rounded-md border border-line bg-white shadow-soft" key={image.url}>
                    <img className="h-full w-full object-cover" src={image.url} alt={image.name} />
                  </figure>
                ))}
                <button type="button" className={`${customerSecondaryButtonClass} w-fit`} onClick={clearReviewImages}>
                  <X size={16} />
                  {t('product.clearReviewImages')}
                </button>
              </div>
            )}
            <button className={customerPrimaryButtonClass}>
              <Send size={18} />
              {t('product.sendReview')}
            </button>
          </form>
          <div className="grid gap-3" aria-busy={reviewsLoading}>
            {reviewsLoading ? Array.from({ length: 3 }).map((_, index) => (
              <article className="grid gap-2 rounded-md border border-lineStrong/50 bg-white p-4 shadow-soft" key={`review-loading-${index}`} aria-hidden="true">
                <span className="h-5 w-36 animate-pulse rounded-full bg-slate-200" />
                <span className="h-5 w-28 animate-pulse rounded-full bg-slate-200" />
                <span className="h-4 w-full animate-pulse rounded-full bg-slate-200" />
                <span className="h-4 w-4/5 animate-pulse rounded-full bg-slate-200" />
              </article>
            )) : productReviews.map((review) => (
              <article className="grid gap-2 rounded-md border border-lineStrong/50 bg-white p-4 shadow-soft" key={review.id}>
                <strong className="text-ink">{review.name}</strong>
                <span className="flex items-center gap-1" aria-label={t('product.star', { count: review.rating })}>
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star key={index} size={16} fill="currentColor" className={index < review.rating ? 'text-amber-400' : 'text-slate-300'} />
                  ))}
                  {t('product.star', { count: review.rating })}
                </span>
                <p className="text-sm font-semibold leading-6 text-muted">{review.comment}</p>
                {(review.images?.length || 0) > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {(review.images || []).map((image, index) => (
                      <a className="size-20 overflow-hidden rounded-md border border-line bg-surfaceMuted shadow-soft" key={`${review.id}-${image}`} href={image} target="_blank" rel="noreferrer">
                        <img className="h-full w-full object-cover" src={image} alt={t('product.reviewImageAlt', { index: index + 1, name: review.name })} />
                      </a>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}

export default ProductPage
