import type { InventoryFilters, InventoryProductFormValues } from '../../../types/shop'

export const emptyProductForm: InventoryProductFormValues = {
  name: '',
  category: '',
  price: '',
  stock: '',
  image: '',
  images: [],
  description: '',
}

export const emptyInventoryFilters: InventoryFilters = {
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
  { value: 'category-created', labelKey: 'admin.inventoryAction.category-created' },
  { value: 'category-updated', labelKey: 'admin.inventoryAction.category-updated' },
  { value: 'category-deleted', labelKey: 'admin.inventoryAction.category-deleted' },
  { value: 'order-deducted', labelKey: 'admin.inventoryAction.order-deducted' },
]

export const productFieldLabelKeys: Record<string, string> = {
  category: 'admin.category',
  categoryName: 'admin.categoryName',
  categoryProductCount: 'admin.categoryProducts',
  customer: 'admin.customer',
  deductedQuantity: 'admin.deductedQuantity',
  description: 'admin.description',
  image: 'admin.productImage',
  name: 'admin.productName',
  orderCode: 'admin.orderCode',
  orderStatus: 'admin.status',
  price: 'admin.price',
  rating: 'admin.rating',
  stock: 'admin.stock',
}

export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024
