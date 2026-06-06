import { Pencil, Plus, Save, Tags, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import { formatCategoryLabel } from '../../../utils/categoryLabel'
import { formatCurrency } from '../../../utils/currency'

function buildCategoryRows(categoryNames, products) {
  const statsByCategory = new Map(
    categoryNames.map((category) => [
      category,
      {
        name: category,
        productCount: 0,
        stock: 0,
        value: 0,
      },
    ]),
  )

  products.forEach((product) => {
    if (!product.category) return
    const current = statsByCategory.get(product.category) || {
      name: product.category,
      productCount: 0,
      stock: 0,
      value: 0,
    }
    const stock = Number(product.stock) || 0
    current.productCount += 1
    current.stock += stock
    current.value += stock * (Number(product.price) || 0)
    statsByCategory.set(product.category, current)
  })

  return [...statsByCategory.values()].sort((first, second) => first.name.localeCompare(second.name, 'vi'))
}

function InventoryCategoriesTab({
  isCategorySaving,
  onCreateCategory,
  onDeleteCategory,
  onRenameCategory,
  productCategories,
  products,
  t,
}) {
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategoryName, setEditingCategoryName] = useState('')
  const [editingValue, setEditingValue] = useState('')
  const categoryRows = useMemo(
    () => buildCategoryRows(productCategories, products),
    [productCategories, products],
  )

  async function submitNewCategory(event) {
    event.preventDefault()
    const saved = await onCreateCategory(newCategoryName)
    if (saved) {
      setNewCategoryName('')
    }
  }

  async function submitRename(event) {
    event.preventDefault()
    const saved = await onRenameCategory(editingCategoryName, editingValue)
    if (saved) {
      setEditingCategoryName('')
      setEditingValue('')
    }
  }

  function startEdit(category) {
    setEditingCategoryName(category.name)
    setEditingValue(category.name)
  }

  function cancelEdit() {
    setEditingCategoryName('')
    setEditingValue('')
  }

  return (
    <section className="admin-panel admin-inventory-category-panel">
      <div className="admin-inventory-list-heading">
        <div>
          <p className="admin-kicker"><Tags size={15} /> {t('admin.categoryManagement')}</p>
          <h3>{t('admin.inventoryCategoryTable')}</h3>
        </div>
        <span>{t('admin.categoryCount', { count: categoryRows.length })}</span>
      </div>

      <form className="admin-category-create-form" onSubmit={submitNewCategory}>
        <label>
          {t('admin.newCategory')}
          <input
            value={newCategoryName}
            onChange={(event) => setNewCategoryName(event.target.value)}
            placeholder={t('admin.categoryNamePlaceholder')}
            disabled={isCategorySaving}
          />
        </label>
        <button type="submit" className="admin-panel-open" disabled={isCategorySaving || !newCategoryName.trim()}>
          <Plus size={15} />
          {t('admin.addCategory')}
        </button>
      </form>

      <div className="admin-category-grid">
        {categoryRows.map((category) => {
          const isEditing = editingCategoryName === category.name
          const canDelete = Number(category.productCount) === 0

          return (
            <article key={category.name} className="admin-category-card">
              {isEditing ? (
                <form className="admin-category-edit-form" onSubmit={submitRename}>
                  <label>
                    {t('admin.categoryName')}
                    <input
                      autoFocus
                      value={editingValue}
                      onChange={(event) => setEditingValue(event.target.value)}
                      disabled={isCategorySaving}
                    />
                  </label>
                  <div className="admin-category-actions">
                    <button type="button" onClick={cancelEdit} disabled={isCategorySaving}>
                      <X size={15} />
                      {t('admin.cancelEdit')}
                    </button>
                    <button type="submit" disabled={isCategorySaving || !editingValue.trim()}>
                      <Save size={15} />
                      {t('admin.saveCategory')}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="admin-category-card-heading">
                    <span><Tags size={15} /></span>
                    <div>
                      <strong>{formatCategoryLabel(category.name)}</strong>
                      <small>{category.name}</small>
                    </div>
                  </div>
                  <div className="admin-category-stats">
                    <span>{t('admin.categoryProducts')}: <strong>{category.productCount}</strong></span>
                    <span>{t('admin.categoryStock')}: <strong>{category.stock}</strong></span>
                    <span>{t('admin.categoryValue')}: <strong>{formatCurrency(category.value)}</strong></span>
                  </div>
                  <div className="admin-category-actions">
                    <button type="button" onClick={() => startEdit(category)}>
                      <Pencil size={15} />
                      {t('admin.edit')}
                    </button>
                    <button
                      type="button"
                      className="danger"
                      disabled={!canDelete}
                      title={!canDelete ? t('admin.categoryInUse') : undefined}
                      onClick={() => onDeleteCategory(category)}
                    >
                      <Trash2 size={15} />
                      {t('admin.delete')}
                    </button>
                  </div>
                </>
              )}
            </article>
          )
        })}

        {categoryRows.length === 0 && (
          <div className="admin-empty">{t('admin.noCategories')}</div>
        )}
      </div>
    </section>
  )
}

export default InventoryCategoriesTab
