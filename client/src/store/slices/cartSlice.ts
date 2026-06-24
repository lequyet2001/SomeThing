import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

import type { CartItem, EntityId } from '../../types/shop'

interface CartState {
  items: CartItem[]
}

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
  } as CartState,
  reducers: {
    setCart(state, action: PayloadAction<CartItem[]>) {
      state.items = action.payload || []
    },
    addCartItem(state, action: PayloadAction<CartItem>) {
      const { productId, quantity = 1 } = action.payload
      const item = state.items.find((cartItem) => cartItem.productId === productId)
      if (item) {
        item.quantity += quantity
        return
      }
      state.items.push({ productId, quantity })
    },
    updateCartItem(state, action: PayloadAction<CartItem>) {
      const { productId, quantity } = action.payload
      const item = state.items.find((cartItem) => cartItem.productId === productId)
      if (item) {
        item.quantity = quantity
      }
    },
    removeCartItem(state, action: PayloadAction<EntityId>) {
      state.items = state.items.filter((item) => item.productId !== action.payload)
    },
    clearCart(state) {
      state.items = []
    },
  },
})

export const cartActions = cartSlice.actions
export const cartReducer = cartSlice.reducer
