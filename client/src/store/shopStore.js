import { configureStore } from '@reduxjs/toolkit'

import { cartActions, cartReducer } from './slices/cartSlice'
import { catalogActions, catalogReducer } from './slices/catalogSlice'
import { contactsActions, contactsReducer } from './slices/contactsSlice'
import { noticeActions, noticeReducer } from './slices/noticeSlice'
import { ordersActions, ordersReducer } from './slices/ordersSlice'
import { reviewsActions, reviewsReducer } from './slices/reviewsSlice'
import { uiActions, uiReducer } from './slices/uiSlice'
import { userActions, userReducer } from './slices/userSlice'
import { userNotificationActions, userNotificationReducer } from './slices/userNotificationSlice'

export {
  cartActions,
  catalogActions,
  contactsActions,
  noticeActions,
  ordersActions,
  reviewsActions,
  uiActions,
  userActions,
  userNotificationActions,
}

export const shopStore = configureStore({
  reducer: {
    cart: cartReducer,
    catalog: catalogReducer,
    contacts: contactsReducer,
    notice: noticeReducer,
    orders: ordersReducer,
    reviews: reviewsReducer,
    ui: uiReducer,
    user: userReducer,
    userNotifications: userNotificationReducer,
  },
})
