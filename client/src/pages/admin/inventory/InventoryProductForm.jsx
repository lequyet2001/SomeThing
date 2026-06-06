import { LoaderCircle, PackagePlus, Save, UploadCloud, X } from 'lucide-react'

import { formatCategoryLabel } from '../../../utils/categoryLabel'

function InventoryProductForm({
  editingProductId,
  handleProductImageChange,
  handleProductSubmit,
  isDialog = false,
  isProductImageUploading,
  isProductSaving,
  onClose,
  productCategories,
  productForm,
  productFormPanelRef,
  productImageFile,
  productImagePreview,
  resetProductForm,
  setProductForm,
  t,
}) {
  const Root = isDialog ? 'section' : 'aside'
  const titleId = isDialog ? 'inventory-product-form-title' : undefined

  return (
    <Root
      className={isDialog ? 'admin-product-form-panel admin-product-form-dialog-panel' : 'admin-panel admin-product-form-panel'}
      ref={productFormPanelRef}
      role={isDialog ? 'document' : undefined}
    >
      <div className="admin-panel-heading">
        <div>
          <p className="admin-kicker"><PackagePlus size={15} /> {t('admin.inventoryForm')}</p>
          <h2 id={titleId}>{editingProductId ? t('admin.editInventoryItem') : t('admin.addInventoryItem')}</h2>
        </div>
        {(editingProductId || isDialog) && (
          <button
            className="admin-icon-button"
            type="button"
            onClick={isDialog ? onClose : resetProductForm}
            aria-label={isDialog ? t('admin.close') : t('admin.cancelEdit')}
          >
            <X size={17} />
          </button>
        )}
      </div>
      <form className="admin-form" aria-busy={isProductSaving} onSubmit={handleProductSubmit}>
        <label>
          {t('admin.productName')}
          <input
            value={productForm.name}
            onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))}
            required
          />
        </label>
        <label>
          {t('admin.category')}
          <select
            value={productForm.category}
            onChange={(event) => setProductForm((current) => ({ ...current, category: event.target.value }))}
            required
          >
            <option value="">{t('admin.chooseCategory')}</option>
            {productCategories.map((category) => (
              <option key={category} value={category}>{formatCategoryLabel(category)}</option>
            ))}
          </select>
        </label>
        <label>
          {t('admin.price')}
          <input
            type="number"
            min="0"
            value={productForm.price}
            onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))}
            required
          />
        </label>
        <label>
          {t('admin.stock')}
          <input
            type="number"
            min="0"
            value={productForm.stock}
            onChange={(event) => setProductForm((current) => ({ ...current, stock: event.target.value }))}
            required
          />
        </label>
        <label>
          {t('admin.productImage')}
          <input
            type="file"
            accept="image/*"
            onChange={handleProductImageChange}
            disabled={isProductSaving}
            required={!editingProductId && !productForm.image}
          />
        </label>
        {(productImagePreview || productForm.image) && (
          <div className={`admin-image-preview${isProductImageUploading ? ' is-uploading' : ''}`}>
            <img src={productImagePreview || productForm.image} alt={t('admin.productImage')} />
            <span>{productImageFile ? productImageFile.name : t('admin.savedImage')}</span>
            {isProductImageUploading && (
              <div className="image-upload-overlay" role="status" aria-live="polite">
                <UploadCloud size={28} />
                <strong>{t('admin.uploadingImage')}</strong>
                <span>{t('admin.uploadingImageText')}</span>
                <div className="upload-progress" aria-hidden="true">
                  <i />
                </div>
              </div>
            )}
          </div>
        )}
        <label>
          {t('admin.description')}
          <textarea
            value={productForm.description}
            onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))}
            required
          />
        </label>
        <button className="primary-action" disabled={isProductSaving}>
          {isProductSaving ? <LoaderCircle className="button-spinner" size={17} /> : <Save size={17} />}
          {isProductSaving ? t('admin.savingProduct') : editingProductId ? t('admin.saveProduct') : t('admin.addInventoryItem')}
        </button>
      </form>
    </Root>
  )
}

export default InventoryProductForm
