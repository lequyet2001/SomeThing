import { catalogActions } from '../../../store/shopStore'
import { findMatchingCategory } from '../../../utils/categoryLabel'
import { createProductPath } from '../../../utils/slug'

export function useCatalogActions({ catalog, dispatch, navigate }) {
  function goToProduct(productId) {
    const product = catalog.products.find((item) => item.id === productId)
    if (product) {
      navigate(createProductPath(product))
    }
  }

  function goToCategory(selectedCategory) {
    dispatch(catalogActions.setCategory(findMatchingCategory(catalog.categories, selectedCategory)))
    dispatch(catalogActions.setQuery(''))
    navigate('/shop')
  }

  function goToLegacyPage(pageName) {
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
    setCategory: (category) => dispatch(catalogActions.setCategory(category)),
    setQuery: (query) => dispatch(catalogActions.setQuery(query)),
    setSortOrder: (sortOrder) => dispatch(catalogActions.setSortOrder(sortOrder)),
  }
}
