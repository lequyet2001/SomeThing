import { createSlice } from '@reduxjs/toolkit'

import { products as fallbackProducts } from '../../data/catalog'

const initialCategories = ['Tat ca', ...new Set(fallbackProducts.map((product) => product.category))]

const catalogSlice = createSlice({
  name: 'catalog',
  initialState: {
    categories: initialCategories,
    category: 'Tat ca',
    products: fallbackProducts,
    query: '',
    sortOrder: 'default',
  },
  reducers: {
    setCatalog(state, action) {
      state.products = action.payload.products
      state.categories = action.payload.categories
    },
    setCategory(state, action) {
      state.category = action.payload
    },
    setQuery(state, action) {
      state.query = action.payload
    },
    setSortOrder(state, action) {
      state.sortOrder = action.payload
    },
  },
})

export const catalogActions = catalogSlice.actions
export const catalogReducer = catalogSlice.reducer
