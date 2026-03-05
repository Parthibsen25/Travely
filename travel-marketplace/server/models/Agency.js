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
    commissionTier: {
      type: String,
      enum: ['STARTER', 'GROWTH', 'PROFESSIONAL', 'ENTERPRISE'],
      default: 'STARTER'
    },
    lifetimeGMV: { type: Number, default: 0 },
    quarterlyGMV: { type: Number, default: 0 },
    quarterlyGMVResetAt: { type: Date },
    bankDetails: {
      accountHolder: { type: String },
      accountNumber: { type: String },
      ifscCode: { type: String },
      bankName: { type: String }
    },
    gstNumber: { type: String },
    panNumber: { type: String },
    isSuspended: { type: Boolean, default: false },

    // Password reset
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },

    // Verification badge system
    verificationDocuments: {
      gstCertificate: { type: String }, // Cloudinary URL
      businessLicense: { type: String },
      panCard: { type: String },
      addressProof: { type: String }
    },
    verificationSubmittedAt: { type: Date },
    verificationReviewedAt: { type: Date },
    verificationNotes: { type: String },
    trustScore: { type: Number, default: 0, min: 0, max: 100 },

    // Agency profile extras
    description: { type: String, maxlength: 1000 },
    phone: { type: String },
    website: { type: String },
    address: { type: String },
    logoUrl: { type: String }
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
