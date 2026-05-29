import { Cart } from '../models/Cart.js'
import { Product } from '../models/Product.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { httpError } from '../utils/httpError.js'
import { serializeProduct } from './productController.js'

async function getOrCreateCart(userId) {
  const cart = await Cart.findOne({ user: userId })
  if (cart) return cart
  return Cart.create({ user: userId, items: [] })
}

async function buildCartResponse(cart) {
  const productIds = cart.items.map((item) => item.productId)
  const products = await Product.find({ legacyId: { $in: productIds } })
  const productById = new Map(products.map((product) => [product.legacyId, product]))

  const lines = cart.items
    .map((item) => {
      const product = productById.get(item.productId)
      if (!product) return null
      return {
        productId: item.productId,
        quantity: item.quantity,
        product: serializeProduct(product),
      }
    })
    .filter(Boolean)

  const subtotal = lines.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const shipping = subtotal > 1200000 || subtotal === 0 ? 0 : 35000

  return {
    cart: lines.map(({ productId, quantity }) => ({ productId, quantity })),
    cartLines: lines,
    subtotal,
    shipping,
    total: subtotal + shipping,
  }
}

export const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id)
  res.json(await buildCartResponse(cart))
})

export const addCartItem = asyncHandler(async (req, res) => {
  const productId = Number(req.body.productId)
  const quantity = Number(req.body.quantity || 1)

  if (!productId || quantity < 1) {
    throw httpError(400, 'Sản phẩm và số lượng không hợp lệ.')
  }

  const product = await Product.findOne({ legacyId: productId })
  if (!product) {
    throw httpError(404, 'Không tìm thấy sản phẩm.')
  }

  const cart = await getOrCreateCart(req.user._id)
  const existingItem = cart.items.find((item) => item.productId === productId)

  if (existingItem) {
    existingItem.quantity += quantity
  } else {
    cart.items.push({ productId, quantity })
  }

  await cart.save()
  res.status(201).json(await buildCartResponse(cart))
})

export const updateCartItem = asyncHandler(async (req, res) => {
  const productId = Number(req.params.productId)
  const quantity = Number(req.body.quantity)

  if (!productId || quantity < 1) {
    throw httpError(400, 'Số lượng không hợp lệ.')
  }

  const cart = await getOrCreateCart(req.user._id)
  const existingItem = cart.items.find((item) => item.productId === productId)
  if (!existingItem) {
    throw httpError(404, 'Sản phẩm không có trong giỏ hàng.')
  }

  existingItem.quantity = quantity
  await cart.save()
  res.json(await buildCartResponse(cart))
})

export const removeCartItem = asyncHandler(async (req, res) => {
  const productId = Number(req.params.productId)
  const cart = await getOrCreateCart(req.user._id)

  cart.items = cart.items.filter((item) => item.productId !== productId)
  await cart.save()

  res.json(await buildCartResponse(cart))
})

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id)
  cart.items = []
  await cart.save()

  res.json(await buildCartResponse(cart))
})
