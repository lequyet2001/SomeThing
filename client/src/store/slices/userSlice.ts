import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

import { getStoredUser } from '../../services/shopApi'
import type { User } from '../../types/shop'

interface UserState {
  current: User | null
}

const userSlice = createSlice({
  name: 'user',
  initialState: {
    current: getStoredUser(),
  } as UserState,
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.current = action.payload
    },
    clearUser(state) {
      state.current = null
    },
  },
})

export const userActions = userSlice.actions
export const userReducer = userSlice.reducer
