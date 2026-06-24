import { Boxes, History, Tags } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import type { InventoryTabId, TranslateFn } from '../../../types/shop'

function InventoryTabsNav({
  activeTab,
  categoryCount = 0,
  hidden = false,
  historyCount = 0,
  onChangeTab,
  t,
}: {
  activeTab: InventoryTabId
  categoryCount?: number
  hidden?: boolean
  historyCount?: number
  onChangeTab: Dispatch<SetStateAction<InventoryTabId>>
  t: TranslateFn
}) {
  const tabClass = 'flex min-h-10 items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2 text-sm font-black text-muted transition hover:border-line hover:bg-white hover:text-primaryDark'
  const activeClass = 'border-primary/30 bg-white text-primaryDark shadow-soft'

  return (
    <div className="ml-3 grid gap-1 border-l border-line pl-3" role="tablist" aria-label={t('admin.products')} hidden={hidden}>
      <button
        type="button"
        className={`${tabClass} ${activeTab === 'items' ? activeClass : ''}`}
        role="tab"
        aria-selected={activeTab === 'items'}
        onClick={() => onChangeTab('items')}
      >
        <Boxes size={16} />
        {t('admin.inventoryTabItems')}
      </button>
      <button
        type="button"
        className={`${tabClass} ${activeTab === 'categories' ? activeClass : ''}`}
        role="tab"
        aria-selected={activeTab === 'categories'}
        onClick={() => onChangeTab('categories')}
      >
        <Tags size={16} />
        {t('admin.inventoryTabCategories')}
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primaryDark">{categoryCount}</span>
      </button>
      <button
        type="button"
        className={`${tabClass} ${activeTab === 'history' ? activeClass : ''}`}
        role="tab"
        aria-selected={activeTab === 'history'}
        onClick={() => onChangeTab('history')}
      >
        <History size={16} />
        {t('admin.inventoryTabHistory')}
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primaryDark">{historyCount}</span>
      </button>
    </div>
  )
}

export default InventoryTabsNav
