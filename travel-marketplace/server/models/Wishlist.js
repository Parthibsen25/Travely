const mongoose = require('mongoose');

const WishlistSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true }
  },
  { timestamps: true }
);

// One entry per user per package
WishlistSchema.index({ userId: 1, packageId: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', WishlistSchema);
