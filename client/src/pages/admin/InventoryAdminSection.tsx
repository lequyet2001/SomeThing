import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react'
import {
  AlertTriangle,
  MessageSquare,
  Save,
  Trash2,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { useLanguage } from '../../i18n/LanguageContext'
import AppDialog from '../../components/ui/AppDialog'
import type { ColumnDef } from '../../components/ui/DataTable'
import {
  isWithinDateRange,
  isWithinNumberRange,
  matchesSearch,
  notifyCatalogChanged,
} from './adminUtils'
import { shopApi } from '../../services/shopApi'
import type {
  Category,
  CategoryRow,
  EntityId,
  InventoryAdminSectionProps,
  InventoryFilters,
  InventoryLog,
  Product,
  ProductGalleryPreview,
} from '../../types/shop'
import { formatCategoryLabel } from '../../utils/categoryLabel'
import { formatCurrency } from '../../utils/currency'
import { getErrorMessage } from '../../utils/errorMessage'
import { createInventoryProductSchema } from '../../utils/validationSchemas'
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

function getStockStatusClass(status: string) {
  if (status === 'out') return 'border-red-200 bg-red-50 text-red-700'
  if (status === 'low') return 'border-amber-200 bg-amber-50 text-amber-800'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

function InventoryAdminSection({
  activeTab = 'items',
  onNavStatsChange,
  reloadKey = 0,
  setActiveTab = () => {},
  showAdminToast,
}: InventoryAdminSectionProps) {
  const { language, t } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const routeFilterKey = searchParams.toString()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [inventoryHistory, setInventoryHistory] = useState<InventoryLog[]>([])
  const [hasLoadedInventory, setHasLoadedInventory] = useState(false)
  const [isInventoryLoading, setIsInventoryLoading] = useState(true)
  const [filters, setFilters] = useState(emptyInventoryFilters)
  const [productForm, setProductForm] = useState(emptyProductForm)
  const [productFormErrors, setProductFormErrors] = useState<Record<string, string>>({})
  const [productImageFile, setProductImageFile] = useState<File | null>(null)
  const [productImagePreview, setProductImagePreview] = useState('')
  const [productGalleryFiles, setProductGalleryFiles] = useState<File[]>([])
  const [productGalleryPreviews, setProductGalleryPreviews] = useState<ProductGalleryPreview[]>([])
  const [isProductImageUploading, setIsProductImageUploading] = useState(false)
  const [isProductSaving, setIsProductSaving] = useState(false)
  const [isCategorySaving, setIsCategorySaving] = useState(false)
  const [stockUpdateProductId, setStockUpdateProductId] = useState<EntityId | null>(null)
  const [editingProductId, setEditingProductId] = useState<EntityId | null>(null)
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<CategoryRow | null>(null)
  const [deleteProductTarget, setDeleteProductTarget] = useState<Product | null>(null)
  const [selectedHistoryLog, setSelectedHistoryLog] = useState<InventoryLog | null>(null)
  const [focusedProductId, setFocusedProductId] = useState('')
  const productFormPanelRef = useRef<HTMLElement | null>(null)

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
      showAdminToast(getErrorMessage(error), 'error')
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

  useEffect(() => () => {
    productGalleryPreviews.forEach((item) => {
      if (item.url.startsWith('blob:')) URL.revokeObjectURL(item.url)
    })
  }, [productGalleryPreviews])

  function updateFilter(group: keyof InventoryFilters, field: string, value: string) {
    setFilters((current) => ({
      ...current,
      [group]: {
        ...current[group],
        [field]: value,
      },
    }))
  }

  function resetFilter(group: keyof InventoryFilters) {
    setFilters((current) => ({
      ...current,
      [group]: emptyInventoryFilters[group],
    }))
  }

  function prependInventoryLog(log?: InventoryLog) {
    if (!log) return
    setInventoryHistory((current) => [log, ...current.filter((item) => item.id !== log.id)].slice(0, 60))
  }

  function openHistoryLog(log: InventoryLog) {
    setSelectedHistoryLog(log)
  }

  function handleHistoryKeyDown(event: KeyboardEvent<HTMLElement>, log: InventoryLog) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openHistoryLog(log)
    }
  }

  function resetProductForm({ closeDialog = false }: { closeDialog?: boolean } = {}) {
    setEditingProductId(null)
    setProductForm(emptyProductForm)
    setProductFormErrors({})
    setProductImageFile(null)
    setProductImagePreview('')
    productGalleryPreviews.forEach((item) => {
      if (item.url.startsWith('blob:')) URL.revokeObjectURL(item.url)
    })
    setProductGalleryFiles([])
    setProductGalleryPreviews([])
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

  function editProduct(product: Product) {
    setActiveTab('items')
    productGalleryPreviews.forEach((item) => {
      if (item.url.startsWith('blob:')) URL.revokeObjectURL(item.url)
    })
    setEditingProductId(product.id)
    setProductFormErrors({})
    setIsProductDialogOpen(true)
    setProductForm({
      category: product.category,
      description: product.description,
      image: product.image,
      images: product.images || [],
      name: product.name,
      price: product.price,
      stock: product.stock,
    })
    setProductImageFile(null)
    setProductImagePreview(product.image)
    setProductGalleryFiles([])
    setProductGalleryPreviews((product.images || []).map((url) => ({ name: t('admin.savedImage'), url, saved: true })))
  }

  function handleProductImageChange(event: ChangeEvent<HTMLInputElement>) {
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

  function handleProductGalleryChange(event: ChangeEvent<HTMLInputElement>) {
    if (isProductSaving) return

    const files = Array.from((event.target.files as FileList | null) || []).slice(0, 8)
    const oversizedFile = files.find((file) => file.size > MAX_PRODUCT_IMAGE_BYTES)
    if (oversizedFile) {
      event.target.value = ''
      showAdminToast(t('admin.imageTooLarge'), 'error')
      return
    }

    productGalleryPreviews.forEach((item) => {
      if (item.url.startsWith('blob:')) URL.revokeObjectURL(item.url)
    })
    setProductGalleryFiles(files)
    setProductGalleryPreviews([
      ...(productForm.images || []).map((url) => ({ name: t('admin.savedImage'), url, saved: true })),
      ...files.map((file) => ({ name: file.name, url: URL.createObjectURL(file), saved: false })),
    ].slice(0, 8))
  }

  function removeProductGalleryImage(imageUrl: string) {
    setProductForm((current) => ({
      ...current,
      images: (current.images || []).filter((image) => image !== imageUrl),
    }))
    setProductGalleryPreviews((current) => current.filter((image) => image.url !== imageUrl))
  }

  async function handleProductSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isProductSaving) return

    const result = createInventoryProductSchema(t, {
      requiresImage: !editingProductId && !productForm.image && !productImageFile,
    }).safeParse({
      ...productForm,
      image: productForm.image || (productImageFile ? productImageFile.name : ''),
    })

    if (!result.success) {
      setProductFormErrors(
        result.error.issues.reduce((errors, issue) => ({
          ...errors,
          [issue.path.join('.')]: issue.message,
        }), {}),
      )
      showAdminToast(t('validation.fixErrors'), 'error')
      return
    }

    setProductFormErrors({})
    setIsProductSaving(true)
    try {
      let image = productForm.image
      if (productImageFile) {
        setIsProductImageUploading(true)
        const upload = await shopApi.uploadProductImage(productImageFile)
        image = upload.url
        setIsProductImageUploading(false)
      }

      let images = productForm.images || []
      if (productGalleryFiles.length > 0) {
        setIsProductImageUploading(true)
        const uploads = await Promise.all(productGalleryFiles.map((file) => shopApi.uploadProductImage(file)))
        images = [...images, ...uploads.map((upload) => upload.url)].slice(0, 8)
        setIsProductImageUploading(false)
      }

      const payload = {
        ...productForm,
        category: productForm.category,
        image,
        images,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
      }

      const data = editingProductId
        ? await shopApi.updateAdminProduct(editingProductId, payload)
        : await shopApi.createAdminProduct(payload)

      setProducts((current) => {
        if (!editingProductId) return [...current, data.product].sort((first, second) => Number(first.id) - Number(second.id))
        return current.map((product) => (product.id === data.product.id ? data.product : product))
      })
      prependInventoryLog(data.inventoryLog)
      showAdminToast(data.message)
      resetProductForm({ closeDialog: true })
      notifyCatalogChanged()
    } catch (error) {
      showAdminToast(getErrorMessage(error), 'error')
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
      showAdminToast(getErrorMessage(error), 'error')
    }
  }

  async function createCategory(name: string) {
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
      showAdminToast(getErrorMessage(error), 'error')
      return false
    } finally {
      setIsCategorySaving(false)
    }
  }

  async function renameCategory(categoryName: string, nextName: string) {
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
      showAdminToast(getErrorMessage(error), 'error')
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
      showAdminToast(getErrorMessage(error), 'error')
    } finally {
      setIsCategorySaving(false)
    }
  }

  async function adjustProductStock(product: Product, delta: number) {
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
      showAdminToast(getErrorMessage(error), 'error')
    } finally {
      setStockUpdateProductId(null)
    }
  }

  function openProductReviews(product: Product) {
    navigate(`/admin/reviews?query=${encodeURIComponent(product.id)}`)
  }

  const inventoryColumns = useMemo<Array<ColumnDef<Product, unknown>>>(() => [
    {
      header: t('admin.product'),
      meta: { mobileLabel: t('admin.product') },
      cell: ({ row }) => {
        const product = row.original
        return (
          <div className="flex items-center gap-3">
            <img className="size-12 rounded-md border border-line object-cover" src={product.image} alt={product.name} />
            <div>
              <strong>{product.name}</strong>
              <small className="block font-semibold text-muted">SKU #{product.id} · {formatCategoryLabel(product.category)}</small>
            </div>
          </div>
        )
      },
    },
    {
      header: t('admin.category'),
      meta: { mobileLabel: t('admin.category') },
      cell: ({ row }) => formatCategoryLabel(row.original.category),
    },
    {
      header: t('admin.price'),
      meta: { mobileLabel: t('admin.price') },
      cell: ({ row }) => formatCurrency(row.original.price),
    },
    {
      header: t('admin.stockShort'),
      meta: { mobileLabel: t('admin.stockShort') },
      cell: ({ row }) => {
        const product = row.original
        const stockFill = `${Math.min(100, Math.max(0, Number(product.stock) || 0) * 5)}%`
        return (
          <div className="grid gap-2">
            <div>
              <strong>{product.stock}</strong>
              <span className="ml-1 text-sm font-semibold text-muted">{t('admin.units')}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-primary/10" aria-hidden="true">
              <i className="block h-full rounded-full bg-primary" style={{ width: stockFill }} />
            </div>
          </div>
        )
      },
    },
    {
      header: t('admin.stockStatus'),
      meta: { mobileLabel: t('admin.stockStatus') },
      cell: ({ row }) => {
        const stockStatus = getProductStockStatus(row.original)
        return (
          <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-black ${getStockStatusClass(stockStatus)}`}>
            {t(`admin.stockStatus.${stockStatus}`)}
          </span>
        )
      },
    },
    {
      header: t('admin.tableActions'),
      meta: { mobileLabel: t('admin.tableActions') },
      cell: ({ row }) => {
        const product = row.original
        const stockUpdating = stockUpdateProductId === product.id
        return (
          <div className="grid gap-3">
            <div className="flex items-center gap-2" aria-label={t('admin.quickStock')}>
              <button
                type="button"
                className="text-red-700"
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
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => openProductReviews(product)}>
                <MessageSquare size={15} />
                {t('admin.viewReviews')}
              </button>
              <button type="button" onClick={() => editProduct(product)}><Save size={15} /> {t('admin.edit')}</button>
              <button type="button" className="border-red-200 bg-red-50 text-red-700 hover:border-red-400 hover:bg-red-100" onClick={() => setDeleteProductTarget(product)}>
                <Trash2 size={15} />
                {t('admin.delete')}
              </button>
            </div>
          </div>
        )
      },
    },
  ], [stockUpdateProductId, t])

  const showInventoryLoading = isInventoryLoading && !hasLoadedInventory

  return (
    <div className="grid gap-5">
      <div className="grid gap-5">
        <InventoryOverviewPanel
          filteredProducts={filteredProducts}
          inventoryHealthPercent={inventoryHealthPercent}
          inventoryMetrics={inventoryMetrics}
          inventoryRiskCount={inventoryRiskCount}
          onAddProduct={openCreateProductDialog}
          products={products}
          t={t}
        />

        {activeTab === 'items' && (
          <InventoryItemsTab
            filters={filters}
            filteredProducts={filteredProducts}
            focusedProductId={focusedProductId}
            inventoryColumns={inventoryColumns}
            isLoading={showInventoryLoading}
            onAddProduct={openCreateProductDialog}
            productCategories={productCategories}
            products={products}
            resetFilter={resetFilter}
            t={t}
            updateFilter={updateFilter}
          />
        )}

        {activeTab === 'categories' && (
          <InventoryCategoriesTab
            isCategorySaving={isCategorySaving}
            isLoading={showInventoryLoading}
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
            isLoading={showInventoryLoading}
            language={language}
            openHistoryLog={openHistoryLog}
            resetFilter={resetFilter}
            t={t}
            updateFilter={updateFilter}
          />
        )}
      </div>

      <InventoryHistoryDetailDialog
        language={language}
        log={selectedHistoryLog}
        onClose={() => setSelectedHistoryLog(null)}
        t={t}
      />

      {isProductDialogOpen && (
        <AppDialog
          className="max-w-5xl"
          isOpen={isProductDialogOpen}
          onClose={closeProductDialog}
          title={editingProductId ? t('admin.editInventoryItem') : t('admin.addInventoryItem')}
          description={t('admin.inventoryForm')}
        >
          <InventoryProductForm
            editingProductId={editingProductId}
            handleProductImageChange={handleProductImageChange}
            handleProductSubmit={handleProductSubmit}
            isDialog
            isProductImageUploading={isProductImageUploading}
            isProductSaving={isProductSaving}
            onClose={closeProductDialog}
            onRemoveProductGalleryImage={removeProductGalleryImage}
            productCategories={productCategories}
            productForm={productForm}
            productFormErrors={productFormErrors}
            productFormPanelRef={productFormPanelRef}
            productGalleryPreviews={productGalleryPreviews}
            productImageFile={productImageFile}
            productImagePreview={productImagePreview}
            handleProductGalleryChange={handleProductGalleryChange}
            resetProductForm={resetProductForm}
            setProductForm={setProductForm}
            t={t}
          />
        </AppDialog>
      )}

      {deleteProductTarget && (
        <AppDialog
          className="max-w-xl"
          isOpen={Boolean(deleteProductTarget)}
          onClose={() => setDeleteProductTarget(null)}
          title={(
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-700">
                <AlertTriangle size={20} />
              </span>
              {t('admin.deleteProductQuestion')}
            </span>
          )}
        >
          <p className="text-sm font-semibold leading-6 text-muted">
            {t('admin.deleteProductText', { name: deleteProductTarget.name })}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => setDeleteProductTarget(null)}>{t('admin.cancelDelete')}</button>
            <button type="button" className="border-red-200 bg-red-50 text-red-700 hover:border-red-400 hover:bg-red-100" onClick={confirmDeleteProduct}>
              <Trash2 size={16} />
              {t('admin.deleteProduct')}
            </button>
          </div>
        </AppDialog>
      )}

      {deleteCategoryTarget && (
        <AppDialog
          className="max-w-xl"
          isOpen={Boolean(deleteCategoryTarget)}
          onClose={() => setDeleteCategoryTarget(null)}
          title={(
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-700">
                <AlertTriangle size={20} />
              </span>
              {t('admin.deleteCategoryQuestion')}
            </span>
          )}
        >
          <p className="text-sm font-semibold leading-6 text-muted">
            {t('admin.deleteCategoryText', { name: formatCategoryLabel(deleteCategoryTarget.name) })}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => setDeleteCategoryTarget(null)}>{t('admin.cancelDelete')}</button>
            <button type="button" className="border-red-200 bg-red-50 text-red-700 hover:border-red-400 hover:bg-red-100" disabled={isCategorySaving} onClick={confirmDeleteCategory}>
              <Trash2 size={16} />
              {t('admin.deleteCategory')}
            </button>
          </div>
        </AppDialog>
      )}
    </div>
  )
}

export default InventoryAdminSection
