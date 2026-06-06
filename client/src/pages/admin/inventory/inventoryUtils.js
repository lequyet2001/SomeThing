export function getProductStockStatus(product) {
  const stock = Number(product.stock) || 0
  if (stock <= 0) return 'out'
  if (stock <= 10) return 'low'
  return 'healthy'
}

export function formatStockDelta(value) {
  const delta = Number(value) || 0
  return delta > 0 ? `+${delta}` : String(delta)
}

export function getHistoryChanges(log) {
  if (Array.isArray(log?.changes) && log.changes.length > 0) return log.changes
  if (log?.previousStock !== null && log?.newStock !== null && log?.previousStock !== log?.newStock) {
    return [{ field: 'stock', previousValue: log.previousStock, newValue: log.newStock }]
  }
  return []
}
