import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

import { products as fallbackProducts } from '../../data/catalog'
import type { Pagination, Product, TopCategory } from '../../types/shop'

const initialCategories = ['Tat ca', ...new Set(fallbackProducts.map((product) => product.category))]

interface CatalogState {
  categories: string[]
  category: string
  isLoading: boolean
  page: number
  pageSize: number
  pagination: Pagination
  productById: Record<string, Product>
  products: Product[]
  query: string
  sortOrder: string
  topCategories: TopCategory[]
}

interface CatalogPayload {
  categories?: string[]
  pagination?: Pagination
  products?: Product[]
  topCategories?: TopCategory[]
}

const initialState: CatalogState = {
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
  productById: fallbackProducts.reduce<Record<string, Product>>((productsById, product) => {
    productsById[String(product.id)] = product
    return productsById
  }, {}),
  products: fallbackProducts,
  query: '',
  sortOrder: 'default',
  topCategories: [],
}

const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    setCatalog(state, action: PayloadAction<CatalogPayload>) {
      const products = action.payload.products || []
      state.products = products
      state.categories = action.payload.categories || state.categories
      state.isLoading = false
      state.pagination = action.payload.pagination || state.pagination
      state.page = state.pagination.page || state.page
      state.pageSize = state.pagination.limit || state.pageSize
      state.topCategories = action.payload.topCategories || []
      products.forEach((product) => {
        state.productById[String(product.id)] = {
          ...(state.productById[String(product.id)] || {}),
          ...product,
        }
      })
    },
    setCatalogLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload
    },
    setCategory(state, action: PayloadAction<string>) {
      state.category = action.payload
      state.page = 1
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = Math.max(1, Number(action.payload) || 1)
    },
    setQuery(state, action: PayloadAction<string>) {
      state.query = action.payload
      state.page = 1
    },
    setSortOrder(state, action: PayloadAction<string>) {
      state.sortOrder = action.payload
      state.page = 1
    },
    upsertProducts(state, action: PayloadAction<Product[]>) {
      const products = action.payload || []
      products.forEach((product) => {
        if (!product?.id) return
        state.productById[String(product.id)] = {
          ...(state.productById[String(product.id)] || {}),
          ...product,
        }
      })
    },
  },
})

export const catalogActions = catalogSlice.actions
export const catalogReducer = catalogSlice.reducer
