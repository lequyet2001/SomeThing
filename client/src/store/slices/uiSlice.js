import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    showReviewLogin: false,
  },
  reducers: {
    setShowReviewLogin(state, action) {
      state.showReviewLogin = action.payload
    },
  },
})

export const uiActions = uiSlice.actions
export const uiReducer = uiSlice.reducer
