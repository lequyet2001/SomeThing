export const emptyProductForm = {
  name: '',
  category: '',
  newCategory: '',
  price: '',
  stock: '',
  image: '',
  description: '',
}

export const emptyInventoryFilters = {
  history: { action: 'all', endDate: '', query: '', startDate: '' },
  products: { category: 'all', maxPrice: '', minPrice: '', query: '', stock: 'all' },
}

export const inventoryActionOptions = [
  { value: 'all', labelKey: 'admin.allInventoryActions' },
  { value: 'created', labelKey: 'admin.inventoryAction.created' },
  { value: 'stock-adjusted', labelKey: 'admin.inventoryAction.stock-adjusted' },
  { value: 'stock-updated', labelKey: 'admin.inventoryAction.stock-updated' },
  { value: 'details-updated', labelKey: 'admin.inventoryAction.details-updated' },
  { value: 'deleted', labelKey: 'admin.inventoryAction.deleted' },
]

export const productFieldLabelKeys = {
  category: 'admin.category',
  description: 'admin.description',
  image: 'admin.productImage',
  name: 'admin.productName',
  price: 'admin.price',
  rating: 'admin.rating',
  stock: 'admin.stock',
}

export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024
