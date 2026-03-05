const mongoose = require('mongoose');
const crypto = require('crypto');

const BUDGET_CATEGORIES = ['Transport', 'Accommodation', 'Food', 'Activities', 'Shopping', 'Insurance', 'Visa', 'Other'];

const BudgetItemSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: BUDGET_CATEGORIES,
    required: true
  },
  description: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  // Actual spending vs planned amount
  actualAmount: { type: Number, default: 0, min: 0 },
  isPaid: { type: Boolean, default: false }
});

const DailyExpenseSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  category: { type: String, enum: BUDGET_CATEGORIES, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'other'],
    default: 'cash'
  },
  paidBy: { type: String, trim: true, default: '' },
  // Split configuration for this expense
  splitType: { type: String, enum: ['equal', 'custom', 'full'], default: 'equal' },
  splitAmong: [{ type: String, trim: true }],  // who shares this expense (empty = all travelers)
  customSplits: [{
    name: { type: String, trim: true },
    amount: { type: Number, min: 0 }
  }]
}, { timestamps: true });

const ChecklistItemSchema = new mongoose.Schema({
  text: { type: String, required: true },
  checked: { type: Boolean, default: false }
});

const ItineraryActivitySchema = new mongoose.Schema({
  time: { type: String, default: '' },      // e.g. "09:00"
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: {
    type: String,
    enum: ['Transport', 'Accommodation', 'Food', 'Activities', 'Shopping', 'Other'],
    default: 'Activities'
  },
  estimatedCost: { type: Number, default: 0, min: 0 },
  location: { type: String, default: '' },
  notes: { type: String, default: '' },
  completed: { type: Boolean, default: false }
});

const ItineraryDaySchema = new mongoose.Schema({
  dayNumber: { type: Number, required: true },
  date: { type: Date },
  title: { type: String, default: '' },       // e.g. "Arrival Day"
  activities: [ItineraryActivitySchema]
});

const CollaboratorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  role: { type: String, enum: ['editor', 'viewer'], default: 'editor' },
  joinedAt: { type: Date, default: Date.now }
});

const CustomTripSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    destinations: [{ type: String, trim: true }],
    startDate: { type: Date },
    endDate: { type: Date },
    travelers: { type: Number, default: 1, min: 1 },
    travelerNames: [{ type: String, trim: true }],
    budgetItems: [BudgetItemSchema],
    totalBudget: { type: Number, default: 0, min: 0 },
    totalActual: { type: Number, default: 0, min: 0 },
    dailyExpenses: [DailyExpenseSchema],
    checklist: [ChecklistItemSchema],
    itinerary: [ItineraryDaySchema],
    activityLog: [{
      action: { type: String, required: true },    // e.g. 'added_expense', 'updated_budget', 'invited_collaborator'
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      userName: { type: String, default: '' },
      details: { type: String, default: '' },
      timestamp: { type: Date, default: Date.now }
    }],
    budgetLimit: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR', maxlength: 3 },
    tags: [{ type: String, trim: true }],
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['PLANNING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
      default: 'PLANNING'
    },
    // Collaborative features
    shareToken: { type: String, unique: true, sparse: true },
    isShared: { type: Boolean, default: false },
    collaborators: [CollaboratorSchema]
  },
  { timestamps: true }
);

// Auto-calculate totals before saving
CustomTripSchema.pre('save', function (next) {
  if (this.budgetItems && this.budgetItems.length > 0) {
    this.totalBudget = this.budgetItems.reduce((sum, item) => sum + item.amount, 0);
    this.totalActual = this.budgetItems.reduce((sum, item) => sum + (item.actualAmount || 0), 0);
  } else {
    this.totalBudget = 0;
    this.totalActual = 0;
  }
  // Add daily expenses to totalActual
  if (this.dailyExpenses && this.dailyExpenses.length > 0) {
    this.totalActual += this.dailyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  }
  next();
});

module.exports = mongoose.model('CustomTrip', CustomTripSchema);
