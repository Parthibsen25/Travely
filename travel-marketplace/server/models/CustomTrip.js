const mongoose = require('mongoose');

const BudgetItemSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['Transport', 'Accommodation', 'Food', 'Activities', 'Shopping', 'Insurance', 'Visa', 'Other'],
    required: true
  },
  description: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 }
});

const CustomTripSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    destinations: [{ type: String, trim: true }],
    startDate: { type: Date },
    endDate: { type: Date },
    travelers: { type: Number, default: 1, min: 1 },
    budgetItems: [BudgetItemSchema],
    totalBudget: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['PLANNING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
      default: 'PLANNING'
    }
  },
  { timestamps: true }
);

// Auto-calculate totalBudget before saving
CustomTripSchema.pre('save', function (next) {
  if (this.budgetItems && this.budgetItems.length > 0) {
    this.totalBudget = this.budgetItems.reduce((sum, item) => sum + item.amount, 0);
  }
  next();
});

module.exports = mongoose.model('CustomTrip', CustomTripSchema);
