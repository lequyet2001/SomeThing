import { useEffect, useState } from 'react'

import { initialReviews } from '../data/catalog'
import { shopApi } from '../services/shopApi'

export function useReviews(user, onRequireLogin, setNotice) {
  const [reviews, setReviews] = useState(initialReviews)

  useEffect(() => {
    let isMounted = true

    async function loadReviews() {
      try {
        const data = await shopApi.listReviews()
        if (isMounted) {
          setReviews(data.reviews)
        }
      } catch (error) {
        setNotice?.(`Không tải được đánh giá từ API: ${error.message}`)
      }
    }

    loadReviews()

    return () => {
      isMounted = false
    }
  }, [setNotice])

  async function submitReview(event, product) {
    event.preventDefault()
    if (!user) {
      onRequireLogin()
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
      setReviews((current) => [data.review, ...current])
      setNotice?.(data.message)
      event.currentTarget.reset()
    } catch (error) {
      setNotice?.(error.message)
    }
  }

  return { reviews, submitReview }
}
