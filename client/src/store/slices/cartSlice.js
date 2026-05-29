import { createSlice } from '@reduxjs/toolkit'

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
  },
  reducers: {
    setCart(state, action) {
      state.items = action.payload || []
    },
    addCartItem(state, action) {
      const { productId, quantity = 1 } = action.payload
      const item = state.items.find((cartItem) => cartItem.productId === productId)
      if (item) {
        item.quantity += quantity
        return
      }
      state.items.push({ productId, quantity })
    },
    updateCartItem(state, action) {
      const { productId, quantity } = action.payload
      const item = state.items.find((cartItem) => cartItem.productId === productId)
      if (item) {
        item.quantity = quantity
      }
    },
    removeCartItem(state, action) {
      state.items = state.items.filter((item) => item.productId !== action.payload)
    },
    clearCart(state) {
      state.items = []
    },
  },
})

export const cartActions = cartSlice.actions
export const cartReducer = cartSlice.reducer
