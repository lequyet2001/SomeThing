import { createSlice } from '@reduxjs/toolkit'

import { products as fallbackProducts } from '../../data/catalog'

const initialCategories = ['Tat ca', ...new Set(fallbackProducts.map((product) => product.category))]

const catalogSlice = createSlice({
  name: 'catalog',
  initialState: {
    categories: initialCategories,
    category: 'Tat ca',
    isLoading: false,
    page: 1,
    pageSize: 10,
    pagination: {
      hasNextPage: false,
      hasPrevPage: false,
      limit: 10,
      page: 1,
      total: fallbackProducts.length,
      totalPages: Math.max(1, Math.ceil(fallbackProducts.length / 10)),
    },
    productById: fallbackProducts.reduce((productsById, product) => {
      productsById[product.id] = product
      return productsById
    }, {}),
    products: fallbackProducts,
    query: '',
    sortOrder: 'default',
    topCategories: [],
  },
  reducers: {
    setCatalog(state, action) {
      const products = action.payload.products || []
      state.products = products
      state.categories = action.payload.categories || state.categories
      state.isLoading = false
      state.pagination = action.payload.pagination || state.pagination
      state.page = state.pagination.page || state.page
      state.pageSize = state.pagination.limit || state.pageSize
      state.topCategories = action.payload.topCategories || []
      products.forEach((product) => {
        state.productById[product.id] = {
          ...(state.productById[product.id] || {}),
          ...product,
        }
      })
    },
    setCatalogLoading(state, action) {
      state.isLoading = action.payload
    },
    setCategory(state, action) {
      state.category = action.payload
      state.page = 1
    },
    setPage(state, action) {
      state.page = Math.max(1, Number(action.payload) || 1)
    },
    setQuery(state, action) {
      state.query = action.payload
      state.page = 1
    },
    setSortOrder(state, action) {
      state.sortOrder = action.payload
      state.page = 1
    },
    upsertProducts(state, action) {
      const products = action.payload || []
      products.forEach((product) => {
        if (!product?.id) return
        state.productById[product.id] = {
          ...(state.productById[product.id] || {}),
          ...product,
        }
      })
    },
  },
})

export const catalogActions = catalogSlice.actions
export const catalogReducer = catalogSlice.reducer
