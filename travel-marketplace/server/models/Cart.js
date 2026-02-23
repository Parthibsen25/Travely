const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema(
  {
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [CartItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cart', CartSchema);
