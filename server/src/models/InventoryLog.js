import mongoose from 'mongoose'

const inventoryLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: ['created', 'stock-adjusted', 'stock-updated', 'details-updated', 'deleted'],
      index: true,
    },
    actor: {
      id: { type: String, default: '' },
      name: { type: String, default: '' },
      email: { type: String, default: '' },
    },
    delta: { type: Number, default: 0 },
    newStock: { type: Number, default: null },
    previousStock: { type: Number, default: null },
    changes: [
      {
        field: { type: String, required: true },
        newValue: { type: mongoose.Schema.Types.Mixed, default: null },
        previousValue: { type: mongoose.Schema.Types.Mixed, default: null },
      },
    ],
    productCategory: { type: String, default: '', trim: true },
    productId: { type: Number, required: true, index: true },
    productImage: { type: String, default: '' },
    productName: { type: String, required: true, trim: true },
  },
  { timestamps: true },
)

inventoryLogSchema.index({ createdAt: -1 })
inventoryLogSchema.index({ productId: 1, createdAt: -1 })

export const InventoryLog = mongoose.model('InventoryLog', inventoryLogSchema)
