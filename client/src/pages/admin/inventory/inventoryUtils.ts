import type { InventoryChange, InventoryLog, Product, StockStatus } from '../../../types/shop'

export function getProductStockStatus(product: Product): StockStatus {
  const stock = Number(product.stock) || 0
  if (stock <= 0) return 'out'
  if (stock <= 10) return 'low'
  return 'healthy'
}

export function formatStockDelta(value: number | undefined) {
  const delta = Number(value) || 0
  return delta > 0 ? `+${delta}` : String(delta)
}

export function getHistoryChanges(log: InventoryLog): InventoryChange[] {
  if (Array.isArray(log?.changes) && log.changes.length > 0) return log.changes
  if (log?.previousStock !== null && log?.newStock !== null && log?.previousStock !== log?.newStock) {
    return [{ field: 'stock', previousValue: log.previousStock, newValue: log.newStock }]
  }
  return []
}
