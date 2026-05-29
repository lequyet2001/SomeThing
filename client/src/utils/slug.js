export function createProductSlug(productName) {
  return productName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const PRODUCT_ID_MULTIPLIER = 7919
const PRODUCT_ID_OFFSET = 104729

export function encodeProductId(productId) {
  return (productId * PRODUCT_ID_MULTIPLIER + PRODUCT_ID_OFFSET).toString(36)
}

export function decodeProductId(encodedProductId) {
  const encodedNumber = Number.parseInt(encodedProductId, 36)
  if (!Number.isFinite(encodedNumber)) return null

  const productId = (encodedNumber - PRODUCT_ID_OFFSET) / PRODUCT_ID_MULTIPLIER
  return Number.isInteger(productId) && productId > 0 ? productId : null
}

export function createProductPath(product) {
  return `/products-${createProductSlug(product.name)}-x${encodeProductId(product.id)}`
}

export function getProductIdFromPathSlug(pathSlug) {
  const encodedMatch = pathSlug.match(/-x([a-z0-9]+)$/)
  if (encodedMatch) {
    return decodeProductId(encodedMatch[1])
  }

  const legacyMatch = pathSlug.match(/-(\d+)$/)
  return legacyMatch ? Number(legacyMatch[1]) : null
}
