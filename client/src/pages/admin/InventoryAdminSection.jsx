import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  Save,
  Trash2,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { useLanguage } from '../../i18n/LanguageContext'
import AdminLoadingState from '../../components/admin/AdminLoadingState'
import {
  isWithinDateRange,
  isWithinNumberRange,
  matchesSearch,
  notifyCatalogChanged,
} from './adminUtils'
import { shopApi } from '../../services/shopApi'
import { formatCategoryLabel } from '../../utils/categoryLabel'
import { formatCurrency } from '../../utils/currency'
import {
  emptyInventoryFilters,
  emptyProductForm,
  MAX_PRODUCT_IMAGE_BYTES,
} from './inventory/inventoryConstants'
import { getProductStockStatus } from './inventory/inventoryUtils'
import InventoryHistoryDetailDialog from './inventory/InventoryHistoryDetailDialog'
import InventoryHistoryTab from './inventory/InventoryHistoryTab'
import InventoryCategoriesTab from './inventory/InventoryCategoriesTab'
import InventoryItemsTab from './inventory/InventoryItemsTab'
import InventoryOverviewPanel from './inventory/InventoryOverviewPanel'
import InventoryProductForm from './inventory/InventoryProductForm'

function InventoryAdminSection({
  activeTab = 'items',
  onNavStatsChange,
  reloadKey = 0,
  setActiveTab = () => {},
  showAdminToast,
}) {
  const { language, t } = useLanguage()
  const [searchParams] = useSearchParams()
  const routeFilterKey = searchParams.toString()
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [inventoryHistory, setInventoryHistory] = useState([])
  const [hasLoadedInventory, setHasLoadedInventory] = useState(false)
  const [isInventoryLoading, setIsInventoryLoading] = useState(true)
  const [filters, setFilters] = useState(emptyInventoryFilters)
  const [productForm, setProductForm] = useState(emptyProductForm)
  const [productImageFile, setProductImageFile] = useState(null)
  const [productImagePreview, setProductImagePreview] = useState('')
  const [isProductImageUploading, setIsProductImageUploading] = useState(false)
  const [isProductSaving, setIsProductSaving] = useState(false)
  const [isCategorySaving, setIsCategorySaving] = useState(false)
  const [stockUpdateProductId, setStockUpdateProductId] = useState(null)
  const [editingProductId, setEditingProductId] = useState(null)
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState(null)
  const [deleteProductTarget, setDeleteProductTarget] = useState(null)
  const [selectedHistoryLog, setSelectedHistoryLog] = useState(null)
  const [focusedProductId, setFocusedProductId] = useState('')
  const productFormPanelRef = useRef(null)

  const productCategories = useMemo(
    () => [...new Set([
      ...categories.map((category) => category.name),
      ...products.map((product) => product.category),
    ].filter(Boolean))].sort((first, second) => first.localeCompare(second, 'vi')),
    [categories, products],
  )
  const inventoryMetrics = useMemo(() => products.reduce((metrics, product) => {
    const stock = Number(product.stock) || 0
    const price = Number(product.price) || 0
    const status = getProductStockStatus(product)

    return {
      healthy: metrics.healthy + (status === 'healthy' ? 1 : 0),
      low: metrics.low + (status === 'low' ? 1 : 0),
      out: metrics.out + (status === 'out' ? 1 : 0),
      skus: metrics.skus + 1,
      units: metrics.units + stock,
      value: metrics.value + stock * price,
    }
  }, { healthy: 0, low: 0, out: 0, skus: 0, units: 0, value: 0 }), [products])
  const inventoryHealthPercent = inventoryMetrics.skus
    ? Math.round((inventoryMetrics.healthy / inventoryMetrics.skus) * 100)
    : 0
  const inventoryRiskCount = inventoryMetrics.low + inventoryMetrics.out

  const filteredProducts = useMemo(() => {
    const productFilters = filters.products
    return products.filter((product) => {
      const stockStatus = getProductStockStatus(product)
      const matchesStock =
        productFilters.stock === 'all' ||
        (productFilters.stock === 'healthy' && stockStatus === 'healthy') ||
        (productFilters.stock === 'low' && stockStatus === 'low') ||
        (productFilters.stock === 'out' && stockStatus === 'out')

      return (
        matchesSearch([product.id, product.name, product.category, product.description], productFilters.query) &&
        (productFilters.category === 'all' || product.category === productFilters.category) &&
        matchesStock &&
        isWithinNumberRange(product.price, productFilters.minPrice, productFilters.maxPrice)
      )
    })
  }, [filters.products, products])

  const filteredInventoryHistory = useMemo(() => {
    const historyFilters = filters.history
    return inventoryHistory.filter((log) => (
      matchesSearch([
        log.productId,
        log.productName,
        log.productCategory,
        log.categoryName,
        log.orderCode,
        log.actor?.name,
        log.actor?.email,
        t(`admin.inventoryAction.${log.action}`),
      ], historyFilters.query) &&
      (historyFilters.action === 'all' || log.action === historyFilters.action) &&
      isWithinDateRange(log.createdAt, historyFilters.startDate, historyFilters.endDate)
    ))
  }, [filters.history, inventoryHistory, t])

  async function loadInventoryData() {
    setIsInventoryLoading(true)
    try {
      const [productsResponse, inventoryHistoryResponse, categoriesResponse] = await Promise.all([
        shopApi.listAdminProducts(),
        shopApi.listAdminInventoryHistory({ limit: 60 }),
        shopApi.listAdminCategories(),
      ])
      setProducts(productsResponse.products || [])
      setInventoryHistory(inventoryHistoryResponse.history || [])
      setCategories(categoriesResponse.categories || [])
      setHasLoadedInventory(true)
    } catch (error) {
      showAdminToast(error.message, 'error')
      setHasLoadedInventory(true)
    } finally {
      setIsInventoryLoading(false)
    }
  }

  useEffect(() => {
    loadInventoryData()
  }, [reloadKey])

  useEffect(() => {
    onNavStatsChange?.({
      categoryCount: productCategories.length,
      historyCount: inventoryHistory.length,
    })
  }, [inventoryHistory.length, onNavStatsChange, productCategories.length])

  useEffect(() => {
    if (!routeFilterKey) {
      setFocusedProductId('')
      return
    }

    const params = new URLSearchParams(routeFilterKey)
    const nextQuery = params.get('query') || params.get('focusProductId') || ''
    const nextFocusProductId = params.get('focusProductId') || ''

    setActiveTab('items')
    setFocusedProductId(nextFocusProductId)
    if (nextQuery) {
      setFilters((current) => ({
        ...current,
        products: {
          ...emptyInventoryFilters.products,
          query: nextQuery,
        },
      }))
    }
  }, [routeFilterKey])

  useEffect(() => {
    if (!focusedProductId || products.length === 0) return undefined

    const timer = window.setTimeout(() => {
      document.getElementById(`admin-product-${focusedProductId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 120)

    return () => window.clearTimeout(timer)
  }, [focusedProductId, products])

  useEffect(() => {
    return () => {
      if (productImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(productImagePreview)
      }
    }
  }, [productImagePreview])

  function updateFilter(group, field, value) {
    setFilters((current) => ({
      ...current,
      [group]: {
        ...current[group],
        [field]: value,
      },
    }))
  }

  function resetFilter(group) {
    setFilters((current) => ({
      ...current,
      [group]: emptyInventoryFilters[group],
    }))
  }

  function prependInventoryLog(log) {
    if (!log) return
    setInventoryHistory((current) => [log, ...current.filter((item) => item.id !== log.id)].slice(0, 60))
  }

  function openHistoryLog(log) {
    setSelectedHistoryLog(log)
  }

  function handleHistoryKeyDown(event, log) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openHistoryLog(log)
    }
  }

  function resetProductForm({ closeDialog = false } = {}) {
    setEditingProductId(null)
    setProductForm(emptyProductForm)
    setProductImageFile(null)
    setProductImagePreview('')
    setIsProductImageUploading(false)
    if (closeDialog) {
      setIsProductDialogOpen(false)
    }
  }

  function openCreateProductDialog() {
    setActiveTab('items')
    resetProductForm()
    setIsProductDialogOpen(true)
  }

  function closeProductDialog() {
    if (isProductSaving) return
    resetProductForm({ closeDialog: true })
  }

  function editProduct(product) {
    setActiveTab('items')
    setEditingProductId(product.id)
    setIsProductDialogOpen(true)
    setProductForm({
      category: product.category,
      description: product.description,
      image: product.image,
      name: product.name,
      price: product.price,
      stock: product.stock,
    })
    setProductImageFile(null)
    setProductImagePreview(product.image)
  }

  function handleProductImageChange(event) {
    if (isProductSaving) return

    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
      event.target.value = ''
      showAdminToast(t('admin.imageTooLarge'), 'error')
      return
    }

    setProductImageFile(file)
    setProductImagePreview(URL.createObjectURL(file))
  }

  async function handleProductSubmit(event) {
    event.preventDefault()
    if (isProductSaving) return

    setIsProductSaving(true)
    try {
      let image = productForm.image
      if (productImageFile) {
        setIsProductImageUploading(true)
        const upload = await shopApi.uploadProductImage(productImageFile)
        image = upload.url
        setIsProductImageUploading(false)
      }

      const payload = {
        ...productForm,
        category: productForm.category,
        image,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
      }

      const data = editingProductId
        ? await shopApi.updateAdminProduct(editingProductId, payload)
        : await shopApi.createAdminProduct(payload)

      setProducts((current) => {
        if (!editingProductId) return [...current, data.product].sort((first, second) => first.id - second.id)
        return current.map((product) => (product.id === data.product.id ? data.product : product))
      })
      prependInventoryLog(data.inventoryLog)
      showAdminToast(data.message)
      resetProductForm({ closeDialog: true })
      notifyCatalogChanged()
    } catch (error) {
      showAdminToast(error.message, 'error')
    } finally {
      setIsProductImageUploading(false)
      setIsProductSaving(false)
    }
  }

  async function confirmDeleteProduct() {
    if (!deleteProductTarget) return
    try {
      const data = await shopApi.deleteAdminProduct(deleteProductTarget.id)
      setProducts((current) => current.filter((product) => product.id !== deleteProductTarget.id))
      prependInventoryLog(data.inventoryLog)
      showAdminToast(data.message)
      setDeleteProductTarget(null)
      notifyCatalogChanged()
    } catch (error) {
      showAdminToast(error.message, 'error')
    }
  }

  async function createCategory(name) {
    const categoryName = String(name || '').trim()
    if (!categoryName || isCategorySaving) return false

    setIsCategorySaving(true)
    try {
      const data = await shopApi.createAdminCategory({ name: categoryName })
      setCategories(data.categories || [])
      prependInventoryLog(data.inventoryLog)
      showAdminToast(data.message)
      return true
    } catch (error) {
      showAdminToast(error.message, 'error')
      return false
    } finally {
      setIsCategorySaving(false)
    }
  }

  async function renameCategory(categoryName, nextName) {
    const normalizedCategoryName = String(categoryName || '').trim()
    const normalizedNextName = String(nextName || '').trim()
    if (!normalizedCategoryName || !normalizedNextName || isCategorySaving) return false

    setIsCategorySaving(true)
    try {
      const data = await shopApi.updateAdminCategory(normalizedCategoryName, { name: normalizedNextName })
      setCategories(data.categories || [])
      if (data.products) {
        setProducts(data.products)
      }
      prependInventoryLog(data.inventoryLog)
      setFilters((current) => ({
        ...current,
        products: {
          ...current.products,
          category: current.products.category === normalizedCategoryName ? normalizedNextName : current.products.category,
        },
      }))
      showAdminToast(data.message)
      notifyCatalogChanged()
      return true
    } catch (error) {
      showAdminToast(error.message, 'error')
      return false
    } finally {
      setIsCategorySaving(false)
    }
  }

  async function confirmDeleteCategory() {
    if (!deleteCategoryTarget || isCategorySaving) return

    setIsCategorySaving(true)
    try {
      const data = await shopApi.deleteAdminCategory(deleteCategoryTarget.name)
      setCategories(data.categories || [])
      prependInventoryLog(data.inventoryLog)
      setFilters((current) => ({
        ...current,
        products: {
          ...current.products,
          category: current.products.category === deleteCategoryTarget.name ? 'all' : current.products.category,
        },
      }))
      showAdminToast(data.message)
      setDeleteCategoryTarget(null)
    } catch (error) {
      showAdminToast(error.message, 'error')
    } finally {
      setIsCategorySaving(false)
    }
  }

  async function adjustProductStock(product, delta) {
    const currentStock = Math.max(0, Number(product.stock) || 0)
    const nextStock = Math.max(0, currentStock + delta)
    if (nextStock === currentStock || stockUpdateProductId) return

    setStockUpdateProductId(product.id)
    try {
      const data = await shopApi.updateAdminProduct(product.id, { stock: nextStock, source: 'quick-adjust' })
      setProducts((current) => current.map((item) => (item.id === data.product.id ? data.product : item)))
      prependInventoryLog(data.inventoryLog)
      showAdminToast(t('admin.stockUpdated', { name: data.product.name, stock: data.product.stock }))
      notifyCatalogChanged()
    } catch (error) {
      showAdminToast(error.message, 'error')
    } finally {
      setStockUpdateProductId(null)
    }
  }

  function renderInventoryRows() {
    return filteredProducts.map((product) => {
      const stockStatus = getProductStockStatus(product)
      const stockUpdating = stockUpdateProductId === product.id
      const stockFill = `${Math.min(100, Math.max(0, Number(product.stock) || 0) * 5)}%`

      return (
        <tr
          key={product.id}
          id={`admin-product-${product.id}`}
          className={`admin-inventory-row admin-inventory-row-${stockStatus} ${String(product.id) === String(focusedProductId) ? 'is-focused' : ''}`}
        >
          <td data-label={t('admin.product')}>
            <div className="admin-product-cell">
              <img src={product.image} alt={product.name} />
              <div>
                <strong>{product.name}</strong>
                <small>SKU #{product.id} · {formatCategoryLabel(product.category)}</small>
              </div>
            </div>
          </td>
          <td data-label={t('admin.category')}>{formatCategoryLabel(product.category)}</td>
          <td data-label={t('admin.price')}>{formatCurrency(product.price)}</td>
          <td data-label={t('admin.stockShort')}>
            <div className={`admin-stock-cell admin-stock-cell-${stockStatus}`}>
              <div>
                <strong>{product.stock}</strong>
                <span>{t('admin.units')}</span>
              </div>
              <div className="admin-stock-cell-track" aria-hidden="true">
                <i style={{ width: stockFill }} />
              </div>
            </div>
          </td>
          <td data-label={t('admin.stockStatus')}>
            <span className={`admin-stock-status admin-stock-status-${stockStatus}`}>
              {t(`admin.stockStatus.${stockStatus}`)}
            </span>
          </td>
          <td data-label={t('admin.tableActions')}>
            <div className="admin-inventory-action-cell">
              <div className="admin-stock-stepper" aria-label={t('admin.quickStock')}>
                <button
                  type="button"
                  className="is-minus"
                  disabled={stockUpdating || Number(product.stock) <= 0}
                  onClick={() => adjustProductStock(product, -1)}
                >
                  -1
                </button>
                <button type="button" disabled={stockUpdating} onClick={() => adjustProductStock(product, 1)}>
                  +1
                </button>
                <button type="button" disabled={stockUpdating} onClick={() => adjustProductStock(product, 5)}>
                  +5
                </button>
              </div>
              <div className="admin-inventory-row-actions">
                <button type="button" onClick={() => editProduct(product)}><Save size={15} /> {t('admin.edit')}</button>
                <button type="button" className="danger" onClick={() => setDeleteProductTarget(product)}>
                  <Trash2 size={15} />
                  {t('admin.delete')}
                </button>
              </div>
            </div>
          </td>
        </tr>
      )
    })
  }

  const showInventoryLoading = isInventoryLoading && !hasLoadedInventory

  return (
    <div className="admin-inventory-section">
      <div className="admin-inventory-main">
        {showInventoryLoading ? (
          <section className="admin-panel admin-loading-panel">
            <AdminLoadingState label={t('admin.loading')} rows={7} />
          </section>
        ) : (
          <>
            <InventoryOverviewPanel
              filteredProducts={filteredProducts}
              inventoryHealthPercent={inventoryHealthPercent}
              inventoryMetrics={inventoryMetrics}
              inventoryRiskCount={inventoryRiskCount}
              products={products}
              t={t}
            />

            {activeTab === 'items' && (
              <InventoryItemsTab
                filters={filters}
                filteredProducts={filteredProducts}
                onAddProduct={openCreateProductDialog}
                productCategories={productCategories}
                products={products}
                renderInventoryRows={renderInventoryRows}
                resetFilter={resetFilter}
                t={t}
                updateFilter={updateFilter}
              />
            )}

            {activeTab === 'categories' && (
              <InventoryCategoriesTab
                isCategorySaving={isCategorySaving}
                onCreateCategory={createCategory}
                onDeleteCategory={setDeleteCategoryTarget}
                onRenameCategory={renameCategory}
                productCategories={productCategories}
                products={products}
                t={t}
              />
            )}

            {activeTab === 'history' && (
              <InventoryHistoryTab
                filters={filters}
                filteredInventoryHistory={filteredInventoryHistory}
                handleHistoryKeyDown={handleHistoryKeyDown}
                inventoryHistory={inventoryHistory}
                language={language}
                openHistoryLog={openHistoryLog}
                resetFilter={resetFilter}
                t={t}
                updateFilter={updateFilter}
              />
            )}
          </>
        )}
      </div>

      <InventoryHistoryDetailDialog
        language={language}
        log={selectedHistoryLog}
        onClose={() => setSelectedHistoryLog(null)}
        t={t}
      />

      {isProductDialogOpen && (
        <div className="admin-dialog-backdrop" role="presentation">
          <section className="admin-dialog admin-product-form-dialog" role="dialog" aria-modal="true" aria-labelledby="inventory-product-form-title">
            <InventoryProductForm
              editingProductId={editingProductId}
              handleProductImageChange={handleProductImageChange}
              handleProductSubmit={handleProductSubmit}
              isDialog
              isProductImageUploading={isProductImageUploading}
              isProductSaving={isProductSaving}
              onClose={closeProductDialog}
              productCategories={productCategories}
              productForm={productForm}
              productFormPanelRef={productFormPanelRef}
              productImageFile={productImageFile}
              productImagePreview={productImagePreview}
              resetProductForm={resetProductForm}
              setProductForm={setProductForm}
              t={t}
            />
          </section>
        </div>
      )}

      {deleteProductTarget && (
        <div className="admin-dialog-backdrop" role="presentation">
          <section className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-product-title">
            <div className="admin-dialog-icon">
              <AlertTriangle size={24} />
            </div>
            <div className="admin-dialog-copy">
              <h2 id="delete-product-title">{t('admin.deleteProductQuestion')}</h2>
              <p>
                {t('admin.deleteProductText', { name: deleteProductTarget.name })}
              </p>
            </div>
            <div className="admin-dialog-actions">
              <button type="button" onClick={() => setDeleteProductTarget(null)}>{t('admin.cancelDelete')}</button>
              <button type="button" className="danger" onClick={confirmDeleteProduct}>
                <Trash2 size={16} />
                {t('admin.deleteProduct')}
              </button>
            </div>
          </section>
        </div>
      )}

      {deleteCategoryTarget && (
        <div className="admin-dialog-backdrop" role="presentation">
          <section className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-category-title">
            <div className="admin-dialog-icon">
              <AlertTriangle size={24} />
            </div>
            <div className="admin-dialog-copy">
              <h2 id="delete-category-title">{t('admin.deleteCategoryQuestion')}</h2>
              <p>
                {t('admin.deleteCategoryText', { name: formatCategoryLabel(deleteCategoryTarget.name) })}
              </p>
            </div>
            <div className="admin-dialog-actions">
              <button type="button" onClick={() => setDeleteCategoryTarget(null)}>{t('admin.cancelDelete')}</button>
              <button type="button" className="danger" disabled={isCategorySaving} onClick={confirmDeleteCategory}>
                <Trash2 size={16} />
                {t('admin.deleteCategory')}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default InventoryAdminSection
