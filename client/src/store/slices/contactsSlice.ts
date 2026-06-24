import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

import type { ContactRequest } from '../../types/shop'

interface ContactsState {
  hasLoaded: boolean
  history: ContactRequest[]
  isLoading: boolean
}

const contactsSlice = createSlice({
  name: 'contacts',
  initialState: {
    hasLoaded: false,
    history: [],
    isLoading: false,
  } as ContactsState,
  reducers: {
    clearContacts(state) {
      state.history = []
      state.hasLoaded = false
      state.isLoading = false
    },
    setContacts(state, action: PayloadAction<ContactRequest[]>) {
      state.history = action.payload || []
      state.hasLoaded = true
      state.isLoading = false
    },
    setContactsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload
    },
    prependContact(state, action: PayloadAction<ContactRequest>) {
      const contact = action.payload
      if (!contact?.id) return

      state.history = [contact, ...state.history.filter((item) => item.id !== contact.id)]
      state.hasLoaded = true
    },
  },
})

export const contactsActions = contactsSlice.actions
export const contactsReducer = contactsSlice.reducer
