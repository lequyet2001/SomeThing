import { useEffect, useMemo, useState } from 'react'

import { shopApi } from '../services/shopApi'
import { findMatchingCategory } from '../utils/categoryLabel'

export function useCatalog(initialProducts, navigate, setNotice) {
  const [products, setProducts] = useState(initialProducts)
  const [categories, setCategories] = useState(['Tat ca', ...new Set(initialProducts.map((product) => product.category))])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Tat ca')
  const [sortOrder, setSortOrder] = useState('default')

  useEffect(() => {
    let isMounted = true

    async function loadProducts() {
      try {
        const data = await shopApi.listProducts()
        if (!isMounted) return
        setProducts(data.products)
        setCategories(data.categories)
      } catch (error) {
        setNotice?.(`Không tải được sản phẩm từ API: ${error.message}`)
      }
    }

    loadProducts()
    window.addEventListener('marseille04:catalog-changed', loadProducts)

    return () => {
      isMounted = false
      window.removeEventListener('marseille04:catalog-changed', loadProducts)
    }
  }, [setNotice])

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const filtered = products.filter((product) => {
      const matchesQuery =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.description.toLowerCase().includes(normalizedQuery)
      const matchesCategory = category === 'Tat ca' || product.category === category
      return matchesQuery && matchesCategory
    })

    if (sortOrder === 'price-asc') {
      return [...filtered].sort((firstProduct, secondProduct) => firstProduct.price - secondProduct.price)
    }

    if (sortOrder === 'price-desc') {
      return [...filtered].sort((firstProduct, secondProduct) => secondProduct.price - firstProduct.price)
    }

    return filtered
  }, [category, products, query, sortOrder])

  function goToCategory(selectedCategory) {
    setCategory(findMatchingCategory(categories, selectedCategory))
    setQuery('')
    navigate('/shop')
  }

  return {
    categories,
    category,
    filteredProducts,
    goToCategory,
    products,
    query,
    setCategory,
    setQuery,
    setSortOrder,
    sortOrder,
  }
}
