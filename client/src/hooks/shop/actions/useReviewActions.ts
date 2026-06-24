import { shopApi } from '../../../services/shopApi'
import { reviewsActions, uiActions } from '../../../store/shopStore'
import type { AppDispatch } from '../../../store/shopStore'
import type { Product, ReviewFormValues, SetNoticeFn, User } from '../../../types/shop'
import { getErrorMessage } from '../../../utils/errorMessage'

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(String(reader.result || '')))
    reader.addEventListener('error', () => reject(new Error('Không đọc được file ảnh.')))
    reader.readAsDataURL(file)
  })
}

export function useReviewActions({ dispatch, setNotice, user }: { dispatch: AppDispatch; setNotice: SetNoticeFn; user: User | null }) {
  async function submitReview(values: ReviewFormValues & { rating?: number }, product: Product) {
    if (!user) {
      dispatch(uiActions.setShowReviewLogin(true))
      return
    }

    const rating = Number(values.rating || 5)
    const comment = String(values.comment || '').trim()
    const imageFiles = Array.from((values.images as FileList | File[] | undefined) || [])
      .filter((file): file is File => file instanceof File && file.size > 0)
      .slice(0, 4)
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
      return true
    } catch (error) {
      setNotice(getErrorMessage(error))
      return false
    }
  }

  return {
    closeReviewLogin: () => dispatch(uiActions.setShowReviewLogin(false)),
    openReviewLogin: () => dispatch(uiActions.setShowReviewLogin(true)),
    submitReview,
  }
}
