import { configureStore } from '@reduxjs/toolkit'

import { cartActions, cartReducer } from './slices/cartSlice'
import { catalogActions, catalogReducer } from './slices/catalogSlice'
import { noticeActions, noticeReducer } from './slices/noticeSlice'
import { ordersActions, ordersReducer } from './slices/ordersSlice'
import { reviewsActions, reviewsReducer } from './slices/reviewsSlice'
import { uiActions, uiReducer } from './slices/uiSlice'
import { userActions, userReducer } from './slices/userSlice'

export {
  cartActions,
  catalogActions,
  noticeActions,
  ordersActions,
  reviewsActions,
  uiActions,
  userActions,
}

export const shopStore = configureStore({
  reducer: {
    cart: cartReducer,
    catalog: catalogReducer,
    notice: noticeReducer,
    orders: ordersReducer,
    reviews: reviewsReducer,
    ui: uiReducer,
    user: userReducer,
  },
})
