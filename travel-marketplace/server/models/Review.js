const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 1000 },
    images: [{ type: String }]
  },
  { timestamps: true }
);

// One review per user per package
ReviewSchema.index({ packageId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);
