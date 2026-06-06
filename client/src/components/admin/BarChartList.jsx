function maxValue(items, key) {
  return Math.max(1, ...items.map((item) => Number(item[key]) || 0))
}

function BarChartList({ emptyText, items, labelKey, onOpenItem, valueFormatter, valueKey }) {
  if (items.length === 0) {
    return <div className="admin-empty">{emptyText}</div>
  }

  const max = maxValue(items, valueKey)

  return (
    <div className="admin-bar-chart">
      {items.slice(0, 5).map((item, index) => {
        const value = Number(item[valueKey]) || 0
        const width = Math.max(6, Math.round((value / max) * 100))
        const itemKey = item.id || item.productId || item.email || `${item[labelKey]}-${index}`
        const content = (
          <>
            <div>
              <span>{item[labelKey]}</span>
              <strong>{valueFormatter(value, item)}</strong>
            </div>
            <div className="admin-bar-track" aria-hidden="true">
              <i style={{ width: `${width}%` }} />
            </div>
          </>
        )

        return onOpenItem ? (
          <button key={itemKey} type="button" className="admin-bar-row" onClick={() => onOpenItem(item)}>
            {content}
          </button>
        ) : (
          <article key={itemKey}>
            {content}
          </article>
        )
      })}
    </div>
  )
}

export default BarChartList
