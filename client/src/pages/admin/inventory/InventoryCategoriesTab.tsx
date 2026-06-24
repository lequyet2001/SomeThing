import { Boxes, Coins, PackageCheck, Pencil, Plus, Save, Tags, Trash2, X } from 'lucide-react'
import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'

import { FieldError } from '../../../components/forms/FieldError'
import type { CategoryRow, InventoryCategoriesTabProps, Product } from '../../../types/shop'
import { getAriaInvalid } from '../../../utils/a11y'
import { formatCategoryLabel } from '../../../utils/categoryLabel'
import { formatCurrency } from '../../../utils/currency'
import { createCategorySchema } from '../../../utils/validationSchemas'

function buildCategoryRows(categoryNames: string[], products: Product[]): CategoryRow[] {
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

  return ([...statsByCategory.values()] as CategoryRow[]).sort((first, second) => first.name.localeCompare(second.name, 'vi'))
}

function InventoryCategoriesTab({
  isLoading = false,
  isCategorySaving,
  onCreateCategory,
  onDeleteCategory,
  onRenameCategory,
  productCategories,
  products,
  t,
}: InventoryCategoriesTabProps) {
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategoryName, setEditingCategoryName] = useState('')
  const [editingValue, setEditingValue] = useState('')
  const [categoryErrors, setCategoryErrors] = useState<Record<string, string>>({})
  const categoryRows = useMemo(
    () => buildCategoryRows(productCategories, products),
    [productCategories, products],
  )

  async function submitNewCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = createCategorySchema(t).safeParse({ name: newCategoryName })
    if (!result.success) {
      setCategoryErrors({ newCategoryName: result.error.issues[0]?.message || t('validation.required') })
      return
    }
    setCategoryErrors({})
    const saved = await onCreateCategory(newCategoryName)
    if (saved) {
      setNewCategoryName('')
    }
  }

  async function submitRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = createCategorySchema(t).safeParse({ name: editingValue })
    if (!result.success) {
      setCategoryErrors({ editingValue: result.error.issues[0]?.message || t('validation.required') })
      return
    }
    setCategoryErrors({})
    const saved = await onRenameCategory(editingCategoryName, editingValue)
    if (saved) {
      setEditingCategoryName('')
      setEditingValue('')
    }
  }

  function startEdit(category: CategoryRow) {
    setEditingCategoryName(category.name)
    setEditingValue(category.name)
    setCategoryErrors({})
  }

  function cancelEdit() {
    setEditingCategoryName('')
    setEditingValue('')
    setCategoryErrors({})
  }

  return (
    <section className="grid gap-4 rounded-md border border-line bg-white p-4 shadow-liquid">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-primaryDark"><Tags size={15} /> {t('admin.categoryManagement')}</p>
          <h3>{t('admin.inventoryCategoryTable')}</h3>
        </div>
        <span>{t('admin.categoryCount', { count: categoryRows.length })}</span>
      </div>

      <form className="grid gap-3 rounded-md border border-lineStrong/50 bg-gradient-to-br from-white via-sky-50 to-surfaceMuted p-4 shadow-soft sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end" onSubmit={submitNewCategory}>
        <label>
          {t('admin.newCategory')}
          <input
            aria-invalid={getAriaInvalid(categoryErrors.newCategoryName)}
            value={newCategoryName}
            onChange={(event) => {
              setNewCategoryName(event.target.value)
              setCategoryErrors((current) => ({ ...current, newCategoryName: '' }))
            }}
            placeholder={t('admin.categoryNamePlaceholder')}
            disabled={isCategorySaving}
          />
          <FieldError error={categoryErrors.newCategoryName} />
        </label>
        <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-md border border-primary bg-primary px-4 py-2.5 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 hover:border-primaryDark hover:bg-primaryDark hover:shadow-panel focus:outline-none focus:ring-4 focus:ring-primary/20" disabled={isCategorySaving || !newCategoryName.trim()}>
          <Plus size={15} />
          {t('admin.addCategory')}
        </button>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? Array.from({ length: 6 }).map((_, index) => (
          <article key={`category-loading-${index}`} className="rounded-md border border-lineStrong/60 bg-white p-4 shadow-liquid" aria-hidden="true">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="size-10 animate-pulse rounded-md bg-slate-200" />
              <div className="grid flex-1 gap-2">
                <span className="h-5 w-40 animate-pulse rounded-full bg-slate-200" />
                <span className="h-4 w-28 animate-pulse rounded-full bg-slate-200" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <span className="h-12 animate-pulse rounded-md bg-slate-200" />
              <span className="h-12 animate-pulse rounded-md bg-slate-200" />
              <span className="h-12 animate-pulse rounded-md bg-slate-200" />
            </div>
          </article>
        )) : categoryRows.map((category) => {
          const isEditing = editingCategoryName === category.name
          const canDelete = Number(category.productCount) === 0

          return (
            <article key={category.name} className="grid gap-4 rounded-md border border-lineStrong/60 bg-white p-4 shadow-liquid ring-1 ring-white/80 transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-liquidHover">
              {isEditing ? (
                <form className="grid gap-3" onSubmit={submitRename}>
                  <label>
                    {t('admin.categoryName')}
                    <input
                      aria-invalid={getAriaInvalid(categoryErrors.editingValue)}
                      autoFocus
                      value={editingValue}
                      onChange={(event) => {
                        setEditingValue(event.target.value)
                        setCategoryErrors((current) => ({ ...current, editingValue: '' }))
                      }}
                      disabled={isCategorySaving}
                    />
                    <FieldError error={categoryErrors.editingValue} />
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" className="border-lineStrong bg-white text-muted hover:border-primary hover:text-primaryDark" onClick={cancelEdit} disabled={isCategorySaving}>
                      <X size={15} />
                      {t('admin.cancelEdit')}
                    </button>
                    <button type="submit" className="border-primary bg-primary text-white hover:border-primaryDark hover:bg-primaryDark" disabled={isCategorySaving || !editingValue.trim()}>
                      <Save size={15} />
                      {t('admin.saveCategory')}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primaryDark shadow-soft">
                      <Tags size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <strong className="line-clamp-2 text-lg font-black text-ink">{formatCategoryLabel(category.name)}</strong>
                      <small className="block truncate text-sm font-bold text-muted">{category.name}</small>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <span className="grid gap-1 rounded-md border border-line bg-surfaceMuted p-3 text-sm font-bold text-muted">
                      <PackageCheck size={16} className="text-primaryDark" />
                      {t('admin.categoryProducts')}
                      <strong className="text-xl font-black text-ink">{category.productCount}</strong>
                    </span>
                    <span className="grid gap-1 rounded-md border border-line bg-surfaceMuted p-3 text-sm font-bold text-muted">
                      <Boxes size={16} className="text-primaryDark" />
                      {t('admin.categoryStock')}
                      <strong className="text-xl font-black text-ink">{category.stock}</strong>
                    </span>
                    <span className="grid gap-1 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm font-bold text-muted">
                      <Coins size={16} className="text-primaryDark" />
                      {t('admin.categoryValue')}
                      <strong className="break-words text-base font-black text-primaryDark">{formatCurrency(category.value)}</strong>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" className="border-lineStrong bg-white text-primaryDark hover:border-primary hover:bg-primary/5" onClick={() => startEdit(category)}>
                      <Pencil size={15} />
                      {t('admin.edit')}
                    </button>
                    <button
                      type="button"
                      className="border-red-200 bg-red-50 text-red-700 hover:border-red-400 hover:bg-red-100"
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

        {!isLoading && categoryRows.length === 0 && (
          <div className="rounded-md border border-dashed border-line bg-surfaceMuted p-6 text-center font-extrabold text-muted">{t('admin.noCategories')}</div>
        )}
      </div>
    </section>
  )
}

export default InventoryCategoriesTab
