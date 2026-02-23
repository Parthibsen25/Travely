const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: '' },
    imageUrl: { type: String, required: true },
    linkUrl: { type: String, default: '' }, // optional CTA link
    position: { type: Number, default: 0 }, // ordering
    isActive: { type: Boolean, default: true },
    style: {
      type: String,
      enum: ['full-width', 'card'],
      default: 'full-width',
    },
    gradient: { type: String, default: '' }, // e.g. "from-pink-400 to-rose-500"
  },
  { timestamps: true }
);

BannerSchema.index({ isActive: 1, position: 1 });

module.exports = mongoose.model('Banner', BannerSchema);
