import type { NavigateFunction } from 'react-router-dom'

import { catalogActions } from '../../../store/shopStore'
import type { AppDispatch, RootState } from '../../../store/shopStore'
import type { EntityId } from '../../../types/shop'
import { findMatchingCategory } from '../../../utils/categoryLabel'
import { createProductPath } from '../../../utils/slug'

type LegacyPageName = 'account' | 'cart' | 'checkout' | 'contact' | 'forgotPassword' | 'home' | 'login' | 'register' | 'shop'

export function useCatalogActions({
  catalog,
  dispatch,
  navigate,
}: {
  catalog: RootState['catalog']
  dispatch: AppDispatch
  navigate: NavigateFunction
}) {
  function goToProduct(productId: EntityId) {
    const product = catalog.productById[String(productId)] || catalog.products.find((item) => String(item.id) === String(productId))
    if (product) {
      navigate(createProductPath(product))
    }
  }

  function goToCategory(selectedCategory: string) {
    dispatch(catalogActions.setCategory(findMatchingCategory(catalog.categories, selectedCategory)))
    dispatch(catalogActions.setQuery(''))
    navigate('/shop')
  }

  function goToLegacyPage(pageName: LegacyPageName) {
    const routes = {
      account: '/account',
      cart: '/cart',
      checkout: '/checkout',
      contact: '/contact',
      forgotPassword: '/forgot-password',
      home: '/',
      login: '/login',
      register: '/register',
      shop: '/shop',
    }
    navigate(routes[pageName] || '/')
  }

  return {
    goToCategory,
    goToLegacyPage,
    goToProduct,
    setCategory: (category: string) => dispatch(catalogActions.setCategory(category)),
    setProductPage: (page: number) => dispatch(catalogActions.setPage(page)),
    setQuery: (query: string) => dispatch(catalogActions.setQuery(query)),
    setSortOrder: (sortOrder: string) => dispatch(catalogActions.setSortOrder(sortOrder)),
  }
}
