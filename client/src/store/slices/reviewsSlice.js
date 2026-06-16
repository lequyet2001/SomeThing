import { createSlice } from '@reduxjs/toolkit'

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState: {
    items: [],
  },
  reducers: {
    setReviews(state, action) {
      state.items = action.payload || []
    },
    prependReview(state, action) {
      state.items = [action.payload, ...state.items]
    },
  },
})

export const reviewsActions = reviewsSlice.actions
export const reviewsReducer = reviewsSlice.reducer
