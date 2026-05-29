import { useState } from 'react'
import { Send, Sparkles, Star } from 'lucide-react'
import { formatCurrency } from '../utils/currency'
import { useLanguage } from '../i18n/LanguageContext'
import { formatCategoryLabel } from '../utils/categoryLabel'

function ProductPage({ product, reviews, user, onAddToCart, onBack, onRequestReviewLogin, onSubmitReview }) {
  const { t } = useLanguage()
  const [selectedRating, setSelectedRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const productReviews = reviews.filter((review) => review.productId === product.id)
  const displayRating = hoverRating || selectedRating

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
    }
  }

  return (
    <section className="detail-grid">
      <div className="detail-image">
        <img src={product.image} alt={product.name} />
      </div>
      <div className="detail-copy">
        <button className="link-button" onClick={onBack}>{t('common.back')}</button>
        <p className="eyebrow">{formatCategoryLabel(product.category)}</p>
        <h1>{product.name}</h1>
        <div className="detail-price">{formatCurrency(product.price)}</div>
        <p>{product.description}</p>
        <p>{t('product.inStock', { count: product.stock })}</p>
        <button className="primary-action" onClick={() => onAddToCart(product.id)}>{t('product.addCart')}</button>

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
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}

export default ProductPage
