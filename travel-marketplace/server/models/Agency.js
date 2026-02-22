const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AgencySchema = new mongoose.Schema(
  {
    businessName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING'
    },
    commissionTier: { type: String, default: 'STANDARD' },
    isSuspended: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// index businessName and email for quick lookup
AgencySchema.index({ businessName: 1 });

AgencySchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

AgencySchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Agency', AgencySchema);
