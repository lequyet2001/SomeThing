import { createSlice } from '@reduxjs/toolkit'

const contactsSlice = createSlice({
  name: 'contacts',
  initialState: {
    history: [],
  },
  reducers: {
    setContacts(state, action) {
      state.history = action.payload || []
    },
    prependContact(state, action) {
      const contact = action.payload
      if (!contact?.id) return

      state.history = [contact, ...state.history.filter((item) => item.id !== contact.id)]
    },
  },
})

export const contactsActions = contactsSlice.actions
export const contactsReducer = contactsSlice.reducer
