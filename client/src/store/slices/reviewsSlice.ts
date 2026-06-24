import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

import type { Review } from '../../types/shop'

interface ReviewsState {
  hasLoaded: boolean
  items: Review[]
  isLoading: boolean
}

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState: {
    hasLoaded: false,
    items: [],
    isLoading: false,
  } as ReviewsState,
  reducers: {
    clearReviews(state) {
      state.items = []
      state.hasLoaded = false
      state.isLoading = false
    },
    setReviews(state, action: PayloadAction<Review[]>) {
      state.items = action.payload || []
      state.hasLoaded = true
      state.isLoading = false
    },
    setReviewsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload
    },
    prependReview(state, action: PayloadAction<Review>) {
      state.items = [action.payload, ...state.items]
      state.hasLoaded = true
    },
  },
})

export const reviewsActions = reviewsSlice.actions
export const reviewsReducer = reviewsSlice.reducer
