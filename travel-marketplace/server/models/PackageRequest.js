const mongoose = require('mongoose');

const PackageRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Step 1 — Where
    destination: { type: String, default: '' },
    exploringDestinations: { type: Boolean, default: false },
    departureCity: { type: String, default: '' },
    // Step 2 — When
    dateType: { type: String, enum: ['fixed', 'flexible', 'anytime'], default: 'anytime' },
    departureDate: { type: Date },
    returnDate: { type: Date },
    numberOfDays: { type: Number, default: 1, min: 1 },
    bookedTickets: { type: Boolean, default: false },
    flexibleYear: { type: Number },
    flexibleMonth: { type: Number },
    flexibleWeek: { type: Number },
    // Step 3 — Who & Budget
    travelers: { type: Number, default: 1, min: 1 },
    budgetPerPerson: { type: Number, default: 0 },
    // Step 4 — Preferences
    category: { type: String, enum: ['adventure', 'relaxation', 'cultural', 'romantic', 'budget', ''], default: '' },
    themes: [{ type: String }],
    specialRequirements: { type: String, default: '' },
    // Status
    status: {
      type: String,
      enum: ['PENDING', 'REVIEWED', 'QUOTED', 'ACCEPTED', 'EXPIRED', 'CANCELLED'],
      default: 'PENDING',
    },
    // Agency responses
    agencyResponses: [
      {
        agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' },
        message: { type: String },
        suggestedPackageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package' },
        quotedPrice: { type: Number },
        respondedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

PackageRequestSchema.index({ userId: 1, status: 1 });
PackageRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('PackageRequest', PackageRequestSchema);
