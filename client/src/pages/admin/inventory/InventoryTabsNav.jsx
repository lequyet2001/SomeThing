import { Boxes, History, Tags } from 'lucide-react'

function InventoryTabsNav({
  activeTab,
  categoryCount = 0,
  hidden = false,
  historyCount = 0,
  onChangeTab,
  t,
}) {
  return (
    <div className="admin-inventory-tabs" role="tablist" aria-label={t('admin.products')} hidden={hidden}>
      <button
        type="button"
        className={activeTab === 'items' ? 'is-active' : ''}
        role="tab"
        aria-selected={activeTab === 'items'}
        onClick={() => onChangeTab('items')}
      >
        <Boxes size={16} />
        {t('admin.inventoryTabItems')}
      </button>
      <button
        type="button"
        className={activeTab === 'categories' ? 'is-active' : ''}
        role="tab"
        aria-selected={activeTab === 'categories'}
        onClick={() => onChangeTab('categories')}
      >
        <Tags size={16} />
        {t('admin.inventoryTabCategories')}
        <span>{categoryCount}</span>
      </button>
      <button
        type="button"
        className={activeTab === 'history' ? 'is-active' : ''}
        role="tab"
        aria-selected={activeTab === 'history'}
        onClick={() => onChangeTab('history')}
      >
        <History size={16} />
        {t('admin.inventoryTabHistory')}
        <span>{historyCount}</span>
      </button>
    </div>
  )
}

export default InventoryTabsNav
