const mongoose = require('mongoose');

const OfferSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    discountType: { type: String, enum: ['PERCENTAGE', 'FIXED'], required: true },
    value: { type: Number, required: true },
    validFrom: { type: Date },
    validTo: { type: Date },
    minPrice: { type: Number },
    destination: { type: String },
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package' }
  },
  { timestamps: true }
);

// Indexes for efficient lookups
OfferSchema.index({ packageId: 1 });
OfferSchema.index({ destination: 1 });
OfferSchema.index({ validFrom: 1, validTo: 1 });

module.exports = mongoose.model('Offer', OfferSchema);
