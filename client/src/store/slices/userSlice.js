import { createSlice } from '@reduxjs/toolkit'

import { getStoredUser } from '../../services/shopApi'

const userSlice = createSlice({
  name: 'user',
  initialState: {
    current: getStoredUser(),
  },
  reducers: {
    setUser(state, action) {
      state.current = action.payload
    },
    clearUser(state) {
      state.current = null
    },
  },
})

export const userActions = userSlice.actions
export const userReducer = userSlice.reducer
