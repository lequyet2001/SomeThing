import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

import type { Order } from '../../types/shop'

interface OrdersState {
  current: Order | null
  hasLoaded: boolean
  history: Order[]
  isLoading: boolean
}

const ordersSlice = createSlice({
  name: 'orders',
  initialState: {
    current: null,
    hasLoaded: false,
    history: [],
    isLoading: false,
  } as OrdersState,
  reducers: {
    clearOrders(state) {
      state.history = []
      state.hasLoaded = false
      state.isLoading = false
    },
    setCurrentOrder(state, action: PayloadAction<Order | null>) {
      state.current = action.payload
    },
    setOrders(state, action: PayloadAction<Order[]>) {
      state.history = action.payload || []
      state.hasLoaded = true
      state.isLoading = false
    },
    setOrdersLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload
    },
    prependOrder(state, action: PayloadAction<Order>) {
      const order = action.payload
      state.history = [order, ...state.history.filter((item) => item.id !== order.id)]
      state.hasLoaded = true
    },
  },
})

export const ordersActions = ordersSlice.actions
export const ordersReducer = ordersSlice.reducer
