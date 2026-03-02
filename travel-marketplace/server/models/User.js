const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['USER', 'AGENCY', 'ADMIN'], default: 'USER' },
    isSuspended: { type: Boolean, default: false },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// Auto-generate referral code before first save
UserSchema.pre('save', function (next) {
  if (!this.referralCode && this.role === 'USER') {
    const namePart = (this.name || 'USER').replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase();
    const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
    this.referralCode = `${namePart}${randomPart}`;
  }
  next();
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
