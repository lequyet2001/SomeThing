import mongoose from 'mongoose'

const inventoryLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'created',
        'stock-adjusted',
        'stock-updated',
        'details-updated',
        'deleted',
        'category-created',
        'category-updated',
        'category-deleted',
        'order-deducted',
      ],
      index: true,
    },
    actor: {
      id: { type: String, default: '' },
      name: { type: String, default: '' },
      email: { type: String, default: '' },
    },
    delta: { type: Number, default: 0 },
    entityType: { type: String, default: 'product', enum: ['product', 'category'], index: true },
    newStock: { type: Number, default: null },
    orderCode: { type: String, default: '', trim: true, index: true },
    previousStock: { type: Number, default: null },
    changes: [
      {
        field: { type: String, required: true },
        newValue: { type: mongoose.Schema.Types.Mixed, default: null },
        previousValue: { type: mongoose.Schema.Types.Mixed, default: null },
      },
    ],
    categoryName: { type: String, default: '', trim: true },
    productCategory: { type: String, default: '', trim: true },
    productId: { type: Number, default: 0, index: true },
    productImage: { type: String, default: '' },
    productName: { type: String, default: '', trim: true },
  },
  { timestamps: true },
)

inventoryLogSchema.index({ createdAt: -1 })
inventoryLogSchema.index({ productId: 1, createdAt: -1 })

export const InventoryLog = mongoose.model('InventoryLog', inventoryLogSchema)
