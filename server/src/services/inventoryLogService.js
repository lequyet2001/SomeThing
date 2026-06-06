import { InventoryLog } from '../models/InventoryLog.js'
import { Order } from '../models/Order.js'
import { Product } from '../models/Product.js'

export const ORDER_INVENTORY_STATUSES = ['shipping', 'completed']

export function serializeInventoryLog(log) {
  return {
    id: log._id.toString(),
    action: log.action,
    actor: log.actor || {},
    categoryName: log.categoryName || '',
    changes: (log.changes || []).map((change) => ({
      field: change.field,
      newValue: change.newValue,
      previousValue: change.previousValue,
    })),
    delta: log.delta,
    entityType: log.entityType || 'product',
    newStock: log.newStock,
    orderCode: log.orderCode || '',
    previousStock: log.previousStock,
    productCategory: log.productCategory,
    productId: log.productId,
    productImage: log.productImage,
    productName: log.productName,
    createdAt: log.createdAt,
  }
}

function buildInventoryActor(user) {
  return {
    id: user?._id?.toString() || '',
    name: user?.name || '',
    email: user?.email || '',
  }
}

function normalizeStock(value) {
  return value === undefined || value === null ? null : Number(value)
}

export async function createInventoryLog({
  action,
  categoryName = '',
  changes = [],
  entityType = 'product',
  newStock,
  orderCode = '',
  previousStock,
  product,
  productSnapshot = {},
  user,
}) {
  const normalizedPreviousStock = normalizeStock(previousStock)
  const normalizedNewStock = normalizeStock(newStock)
  const delta =
    normalizedPreviousStock === null || normalizedNewStock === null
      ? 0
      : normalizedNewStock - normalizedPreviousStock

  return InventoryLog.create({
    action,
    actor: buildInventoryActor(user),
    categoryName,
    changes,
    delta,
    entityType,
    newStock: normalizedNewStock,
    orderCode,
    previousStock: normalizedPreviousStock,
    productCategory: product?.category || productSnapshot.productCategory || categoryName,
    productId: product?.legacyId || productSnapshot.productId || 0,
    productImage: product?.image || productSnapshot.productImage || '',
    productName: product?.name || productSnapshot.productName || categoryName || orderCode || 'Inventory update',
  })
}

export async function createProductInventoryLog({
  action,
  changes = [],
  newStock,
  orderCode = '',
  previousStock,
  product,
  user,
}) {
  return createInventoryLog({
    action,
    changes,
    entityType: 'product',
    newStock,
    orderCode,
    previousStock,
    product,
    user,
  })
}

export async function createCategoryInventoryLog({
  action,
  categoryName,
  changes = [],
  nextName = '',
  previousName = '',
  productCount = 0,
  user,
}) {
  const displayName = nextName || categoryName || previousName

  return createInventoryLog({
    action,
    categoryName: displayName,
    changes: [
      ...changes,
      { field: 'categoryProductCount', previousValue: null, newValue: productCount },
    ],
    entityType: 'category',
    productSnapshot: {
      productId: 0,
      productName: `Danh mục: ${displayName}`,
      productCategory: displayName,
    },
    user,
  })
}

export async function applyOrderInventoryIfNeeded(order, user) {
  if (!ORDER_INVENTORY_STATUSES.includes(order.status) || order.inventoryAppliedAt) {
    return []
  }

  const claimedOrder = await Order.findOneAndUpdate(
    { _id: order._id, inventoryAppliedAt: null },
    {
      inventoryAppliedAt: new Date(),
      inventoryAppliedStatus: order.status,
    },
    { returnDocument: 'after' },
  )

  if (!claimedOrder) {
    return []
  }

  order.inventoryAppliedAt = claimedOrder.inventoryAppliedAt
  order.inventoryAppliedStatus = claimedOrder.inventoryAppliedStatus

  const productIds = [...new Set(claimedOrder.items.map((item) => Number(item.productId)).filter(Boolean))]
  const products = await Product.find({ legacyId: { $in: productIds } })
  const productsById = new Map(products.map((product) => [product.legacyId, product]))
  const logs = []

  for (const item of claimedOrder.items) {
    const product = productsById.get(Number(item.productId))
    if (!product) continue

    const quantity = Number(item.quantity) || 0
    const previousStock = Number(product.stock) || 0
    const nextStock = Math.max(0, previousStock - quantity)
    product.stock = nextStock
    await product.save()

    logs.push(await createProductInventoryLog({
      action: 'order-deducted',
      changes: [
        { field: 'stock', previousValue: previousStock, newValue: nextStock },
        { field: 'deductedQuantity', previousValue: null, newValue: quantity },
        { field: 'orderCode', previousValue: null, newValue: claimedOrder.orderCode },
        { field: 'orderStatus', previousValue: null, newValue: claimedOrder.status },
        { field: 'customer', previousValue: null, newValue: claimedOrder.customer?.email || '' },
      ],
      newStock: nextStock,
      orderCode: claimedOrder.orderCode,
      previousStock,
      product,
      user,
    }))
  }

  return logs
}
