import { createSlice } from '@reduxjs/toolkit'

const ordersSlice = createSlice({
  name: 'orders',
  initialState: {
    current: null,
    history: [],
  },
  reducers: {
    setCurrentOrder(state, action) {
      state.current = action.payload
    },
    setOrders(state, action) {
      state.history = action.payload || []
    },
    prependOrder(state, action) {
      const order = action.payload
      state.history = [order, ...state.history.filter((item) => item.id !== order.id)]
    },
  },
})

export const ordersActions = ordersSlice.actions
export const ordersReducer = ordersSlice.reducer
