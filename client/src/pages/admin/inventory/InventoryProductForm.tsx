import { LoaderCircle, PackagePlus, Save, UploadCloud, X } from 'lucide-react'

import { FieldError } from '../../../components/forms/FieldError'
import type { InventoryProductFormProps } from '../../../types/shop'
import { getAriaInvalid } from '../../../utils/a11y'
import { formatCategoryLabel } from '../../../utils/categoryLabel'

function InventoryProductForm({
  editingProductId,
  handleProductImageChange,
  handleProductGalleryChange,
  handleProductSubmit,
  isDialog = false,
  isProductImageUploading,
  isProductSaving,
  onClose,
  onRemoveProductGalleryImage,
  productCategories,
  productForm,
  productFormErrors = {},
  productFormPanelRef,
  productGalleryPreviews,
  productImageFile,
  productImagePreview,
  resetProductForm,
  setProductForm,
  t,
}: InventoryProductFormProps) {
  const Root = isDialog ? 'section' : 'aside'
  const titleId = isDialog ? 'inventory-product-form-title' : undefined

  return (
    <Root
      className={isDialog ? 'grid gap-4' : 'grid gap-4 rounded-md border border-line bg-white p-4 shadow-liquid'}
      ref={productFormPanelRef}
      role={isDialog ? 'document' : undefined}
    >
      {!isDialog && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-primaryDark"><PackagePlus size={15} /> {t('admin.inventoryForm')}</p>
            <h2 id={titleId}>{editingProductId ? t('admin.editInventoryItem') : t('admin.addInventoryItem')}</h2>
          </div>
          {editingProductId && (
            <button
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-line bg-white text-muted shadow-soft hover:border-primary hover:text-primaryDark"
              type="button"
              onClick={() => resetProductForm()}
              aria-label={t('admin.cancelEdit')}
            >
              <X size={17} />
            </button>
          )}
        </div>
      )}
      <form className="grid gap-4" aria-busy={isProductSaving} onSubmit={handleProductSubmit}>
        <label>
          {t('admin.productName')}
          <input
            aria-invalid={getAriaInvalid(productFormErrors.name)}
            value={productForm.name}
            onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))}
            required
          />
          <FieldError error={productFormErrors.name} />
        </label>
        <label>
          {t('admin.category')}
          <select
            aria-invalid={getAriaInvalid(productFormErrors.category)}
            value={productForm.category}
            onChange={(event) => setProductForm((current) => ({ ...current, category: event.target.value }))}
            required
          >
            <option value="">{t('admin.chooseCategory')}</option>
            {productCategories.map((category) => (
              <option key={category} value={category}>{formatCategoryLabel(category)}</option>
            ))}
          </select>
          <FieldError error={productFormErrors.category} />
        </label>
        <label>
          {t('admin.price')}
          <input
            aria-invalid={getAriaInvalid(productFormErrors.price)}
            type="number"
            min="0"
            value={productForm.price}
            onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))}
            required
          />
          <FieldError error={productFormErrors.price} />
        </label>
        <label>
          {t('admin.stock')}
          <input
            aria-invalid={getAriaInvalid(productFormErrors.stock)}
            type="number"
            min="0"
            value={productForm.stock}
            onChange={(event) => setProductForm((current) => ({ ...current, stock: event.target.value }))}
            required
          />
          <FieldError error={productFormErrors.stock} />
        </label>
        <label>
          {t('admin.productImage')}
          <input
            aria-invalid={getAriaInvalid(productFormErrors.image)}
            type="file"
            accept="image/*"
            onChange={handleProductImageChange}
            disabled={isProductSaving}
            required={!editingProductId && !productForm.image}
          />
          <FieldError error={productFormErrors.image} />
        </label>
        {(productImagePreview || productForm.image) && (
          <div className={`relative min-h-44 overflow-hidden rounded-md border border-line bg-surfaceMuted shadow-soft ${isProductImageUploading ? 'opacity-80 ring-4 ring-primary/20' : ''}`}>
            <img src={productImagePreview || productForm.image} alt={t('admin.productImage')} />
            <span>{productImageFile ? productImageFile.name : t('admin.savedImage')}</span>
            {isProductImageUploading && (
              <div className="absolute inset-0 grid place-items-center bg-white/80 text-sm font-black text-primaryDark backdrop-blur" role="status" aria-live="polite">
                <UploadCloud size={28} />
                <strong>{t('admin.uploadingImage')}</strong>
                <span>{t('admin.uploadingImageText')}</span>
                <div className="mt-2 h-2 w-28 overflow-hidden rounded-full bg-primary/20" aria-hidden="true">
                  <i />
                </div>
              </div>
            )}
          </div>
        )}
        <label>
          {t('admin.productGalleryImages')}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleProductGalleryChange}
            disabled={isProductSaving}
          />
        </label>
        {productGalleryPreviews?.length > 0 && (
          <div className={`flex flex-wrap gap-2 rounded-md border border-line bg-surfaceMuted p-3 ${isProductImageUploading ? 'opacity-80 ring-4 ring-primary/20' : ''}`}>
            {productGalleryPreviews.map((image) => (
              <figure key={image.url}>
                <img src={image.url} alt={image.name} />
                <figcaption>{image.name}</figcaption>
                {image.saved && (
                  <button type="button" onClick={() => onRemoveProductGalleryImage(image.url)}>
                    <X size={14} />
                    {t('admin.delete')}
                  </button>
                )}
              </figure>
            ))}
          </div>
        )}
        <label>
          {t('admin.description')}
          <textarea
            aria-invalid={getAriaInvalid(productFormErrors.description)}
            value={productForm.description}
            onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))}
            required
          />
          <FieldError error={productFormErrors.description} />
        </label>
        <button className="inline-flex items-center justify-center gap-2 rounded-md border border-primary bg-primary px-4 py-2.5 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 hover:border-primaryDark hover:bg-primaryDark hover:shadow-panel focus:outline-none focus:ring-4 focus:ring-primary/20" disabled={isProductSaving}>
          {isProductSaving ? <LoaderCircle className="animate-spin" size={17} /> : <Save size={17} />}
          {isProductSaving ? t('admin.savingProduct') : editingProductId ? t('admin.saveProduct') : t('admin.addInventoryItem')}
        </button>
      </form>
    </Root>
  )
}

export default InventoryProductForm
