import { useEffect, useState } from 'react'
import { ImagePlus, Send, Sparkles, Star, X } from 'lucide-react'
import { formatCurrency } from '../utils/currency'
import { useLanguage } from '../i18n/LanguageContext'
import { formatCategoryLabel } from '../utils/categoryLabel'

function ProductPage({ product, reviews, user, onAddToCart, onBack, onRequestReviewLogin, onSubmitReview }) {
  const { t } = useLanguage()
  const [selectedRating, setSelectedRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [selectedProductImage, setSelectedProductImage] = useState(product.image)
  const [reviewImagePreviews, setReviewImagePreviews] = useState([])
  const productReviews = reviews.filter((review) => review.productId === product.id)
  const productImages = [product.image, ...(product.images || [])].filter(Boolean)
  const displayRating = hoverRating || selectedRating

  useEffect(() => {
    setSelectedProductImage(product.image)
  }, [product.id, product.image])

  function handleReviewImagesChange(event) {
    const files = Array.from(event.target.files || []).slice(0, 4)
    reviewImagePreviews.forEach((item) => URL.revokeObjectURL(item.url))
    setReviewImagePreviews(files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })))
  }

  function clearReviewImages(form) {
    reviewImagePreviews.forEach((item) => URL.revokeObjectURL(item.url))
    setReviewImagePreviews([])
    if (form?.elements.images) {
      form.elements.images.value = ''
    }
  }

  useEffect(() => () => {
    reviewImagePreviews.forEach((item) => URL.revokeObjectURL(item.url))
  }, [reviewImagePreviews])

  async function handleReviewSubmit(event) {
    if (!user) {
      event.preventDefault()
      onRequestReviewLogin()
      return
    }

    const comment = event.currentTarget.elements.comment?.value.trim()
    await onSubmitReview(event)
    if (comment) {
      setSelectedRating(5)
      setHoverRating(0)
      clearReviewImages(event.currentTarget)
    }
  }

  return (
    <section className="detail-grid">
      <div className="detail-image">
        <img src={selectedProductImage || product.image} alt={product.name} />
        {productImages.length > 1 && (
          <div className="detail-image-thumbnails" aria-label={t('product.gallery')}>
            {productImages.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                className={image === selectedProductImage ? 'is-active' : ''}
                onClick={() => setSelectedProductImage(image)}
                aria-label={t('product.galleryImage', { index: index + 1 })}
              >
                <img src={image} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="detail-copy">
        <button className="link-button" onClick={onBack}>{t('common.back')}</button>
        <p className="eyebrow">{formatCategoryLabel(product.category)}</p>
        <h1>{product.name}</h1>
        <div className="detail-price">{formatCurrency(product.price)}</div>
        <p>{product.description}</p>
        <p>{t('product.inStock', { count: product.stock })}</p>
        <button className="primary-action" onClick={(event) => onAddToCart(product.id, 1, event.currentTarget)}>{t('product.addCart')}</button>

        <section className="reviews">
          <h2>
            <Sparkles size={20} />
            {t('product.reviews')}
          </h2>
          {!user && <p className="review-login-note">{t('product.loginReview')}</p>}
          <form className="review-form" onSubmit={handleReviewSubmit}>
            <input type="hidden" name="rating" value={selectedRating} />
            <div className="rating-picker" onMouseLeave={() => setHoverRating(0)}>
              <div className="rating-stars" role="radiogroup" aria-label={t('product.ratingAria')}>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    className={`star-button ${rating <= displayRating ? 'is-active' : ''}`}
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
              <div className="rating-text">
                <strong>{t(`rating.${displayRating}`)}</strong>
                <span>{t('product.ratingText', { rating: displayRating })}</span>
              </div>
            </div>
            <textarea name="comment" placeholder={t('product.reviewPlaceholder', { name: user?.name || 'Khách hàng' })} />
            <label className="review-image-picker">
              <ImagePlus size={18} />
              <span>{t('product.addReviewImages')}</span>
              <input type="file" name="images" accept="image/*" multiple onChange={handleReviewImagesChange} />
            </label>
            {reviewImagePreviews.length > 0 && (
              <div className="review-image-preview-grid">
                {reviewImagePreviews.map((image) => (
                  <figure key={image.url}>
                    <img src={image.url} alt={image.name} />
                  </figure>
                ))}
                <button type="button" className="review-image-clear" onClick={(event) => clearReviewImages(event.currentTarget.form)}>
                  <X size={16} />
                  {t('product.clearReviewImages')}
                </button>
              </div>
            )}
            <button className="review-submit-button">
              <Send size={18} />
              {t('product.sendReview')}
            </button>
          </form>
          <div className="review-list">
            {productReviews.map((review) => (
              <article key={review.id}>
                <strong>{review.name}</strong>
                <span className="review-score" aria-label={t('product.star', { count: review.rating })}>
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star key={index} size={16} fill="currentColor" className={index < review.rating ? 'is-active' : ''} />
                  ))}
                  {t('product.star', { count: review.rating })}
                </span>
                <p>{review.comment}</p>
                {review.images?.length > 0 && (
                  <div className="review-image-grid">
                    {review.images.map((image, index) => (
                      <a key={`${review.id}-${image}`} href={image} target="_blank" rel="noreferrer">
                        <img src={image} alt={t('product.reviewImageAlt', { index: index + 1, name: review.name })} />
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
