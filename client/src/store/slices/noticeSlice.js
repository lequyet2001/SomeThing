import { createSlice } from '@reduxjs/toolkit'

const noticeSlice = createSlice({
  name: 'notice',
  initialState: {
    message: '',
  },
  reducers: {
    setNotice(state, action) {
      state.message = action.payload || ''
    },
  },
})

export const noticeActions = noticeSlice.actions
export const noticeReducer = noticeSlice.reducer
