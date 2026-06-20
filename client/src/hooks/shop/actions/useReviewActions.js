import { shopApi } from '../../../services/shopApi'
import { reviewsActions, uiActions } from '../../../store/shopStore'

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(reader.result))
    reader.addEventListener('error', () => reject(new Error('Không đọc được file ảnh.')))
    reader.readAsDataURL(file)
  })
}

export function useReviewActions({ dispatch, setNotice, user }) {
  async function submitReview(event, product) {
    event.preventDefault()
    const form = event.currentTarget
    if (!user) {
      dispatch(uiActions.setShowReviewLogin(true))
      return
    }

    const formData = new FormData(form)
    const rating = Number(formData.get('rating'))
    const comment = formData.get('comment').trim()
    const imageFiles = Array.from(formData.getAll('images')).filter((file) => file?.size > 0).slice(0, 4)
    if (!comment) return

    try {
      const images = await Promise.all(imageFiles.map((file) => readFileAsDataUrl(file)))
      const data = await shopApi.createReview({
        images,
        productId: product.id,
        rating,
        comment,
      })
      dispatch(reviewsActions.prependReview(data.review))
      setNotice(data.message)
      form.reset()
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
