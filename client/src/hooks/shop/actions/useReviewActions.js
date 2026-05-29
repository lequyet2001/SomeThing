import { shopApi } from '../../../services/shopApi'
import { reviewsActions, uiActions } from '../../../store/shopStore'

export function useReviewActions({ dispatch, setNotice, user }) {
  async function submitReview(event, product) {
    event.preventDefault()
    if (!user) {
      dispatch(uiActions.setShowReviewLogin(true))
      return
    }

    const formData = new FormData(event.currentTarget)
    const rating = Number(formData.get('rating'))
    const comment = formData.get('comment').trim()
    if (!comment) return

    try {
      const data = await shopApi.createReview({
        productId: product.id,
        rating,
        comment,
      })
      dispatch(reviewsActions.prependReview(data.review))
      setNotice(data.message)
      event.currentTarget.reset()
    } catch (error) {
      setNotice(error.message)
    }
  }

  return {
    closeReviewLogin: () => dispatch(uiActions.setShowReviewLogin(false)),
    openReviewLogin: () => dispatch(uiActions.setShowReviewLogin(true)),
    submitReview,
  }
}
