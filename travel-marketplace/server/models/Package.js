const mongoose = require('mongoose');

const ItineraryItemSchema = new mongoose.Schema({
  day: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true }
});

const CancellationSlabSchema = new mongoose.Schema({
  daysBefore: { type: Number, required: true },
  refundPercent: { type: Number, required: true }
});

const OfferSchema = new mongoose.Schema({
  title: { type: String },
  discountPercent: { type: Number }
});

const PackageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true, trim: true },
    destination: { type: String, required: true },
    category: { type: String, enum: ['adventure', 'relaxation', 'cultural', 'romantic', 'budget'], required: true },
    price: { type: Number, required: true },
    duration: { type: Number, required: true },
    itinerary: [ItineraryItemSchema],
    cancellationPolicy: [CancellationSlabSchema],
    offers: [OfferSchema],
    agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    imageUrl: { type: String },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    staffPick: { type: Boolean, default: false },
    bestSeasons: [{ type: String, enum: ['jan-feb-mar', 'apr-may-jun', 'jul-aug-sep', 'oct-nov-dec'] }],
    themes: [{ type: String, enum: ['beach', 'hill-station', 'wildlife', 'heritage', 'pilgrimage', 'honeymoon', 'family', 'adventure', 'luxury', 'backpacking'] }]
  },
  { timestamps: true }
);

// Text index for search
PackageSchema.index({ title: 'text', description: 'text', destination: 'text', category: 'text' });

module.exports = mongoose.model('Package', PackageSchema);
