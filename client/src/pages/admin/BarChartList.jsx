function maxValue(items, key) {
  return Math.max(1, ...items.map((item) => Number(item[key]) || 0))
}

function BarChartList({ emptyText, items, labelKey, valueFormatter, valueKey }) {
  if (items.length === 0) {
    return <div className="admin-empty">{emptyText}</div>
  }

  const max = maxValue(items, valueKey)

  return (
    <div className="admin-bar-chart">
      {items.slice(0, 5).map((item) => {
        const value = Number(item[valueKey]) || 0
        const width = Math.max(6, Math.round((value / max) * 100))
        return (
          <article key={item[labelKey]}>
            <div>
              <span>{item[labelKey]}</span>
              <strong>{valueFormatter(value, item)}</strong>
            </div>
            <div className="admin-bar-track" aria-hidden="true">
              <i style={{ width: `${width}%` }} />
            </div>
          </article>
        )
      })}
    </div>
  )
}

export default BarChartList
