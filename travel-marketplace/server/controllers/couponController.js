const Coupon = require('../models/Coupon');
const Package = require('../models/Package');
const Notification = require('../models/Notification');
const User = require('../models/User');

// ───── Agency endpoints ─────

// Create a coupon (agency)
exports.createCoupon = async (req, res) => {
  try {
    const agencyId = req.user.id;
    const { code, description, discountType, discountValue, applicablePackages, maxUsage, minOrderAmount, maxDiscount, expiresAt } = req.body;

    if (!code || !discountType || discountValue == null) {
      return res.status(400).json({ message: 'code, discountType and discountValue are required' });
    }

    // validate packages belong to this agency
    if (applicablePackages && applicablePackages.length > 0) {
      const pkgs = await Package.find({ _id: { $in: applicablePackages }, agencyId }).select('_id').lean();
      if (pkgs.length !== applicablePackages.length) {
        return res.status(400).json({ message: 'Some packages do not belong to your agency' });
      }
    }

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) return res.status(400).json({ message: 'Coupon code already exists' });

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      description: description || '',
      discountType,
      discountValue: Number(discountValue),
      applicablePackages: applicablePackages || [],
      agencyId,
      maxUsage: maxUsage || 0,
      minOrderAmount: minOrderAmount || 0,
      maxDiscount: maxDiscount || 0,
      expiresAt: expiresAt || null,
    });

    // Notify all admins about new coupon
    const admins = await User.find({ role: 'ADMIN' }).select('_id').lean();
    const agencyName = req.user.businessName || req.user.email;
    const notifications = admins.map((admin) => ({
      recipientId: admin._id,
      recipientRole: 'ADMIN',
      type: 'COUPON_CREATED',
      title: 'New Coupon Pending Approval',
      message: `Agency "${agencyName}" created coupon "${coupon.code}" (${discountType === 'PERCENTAGE' ? discountValue + '%' : '₹' + discountValue} off). Needs your approval.`,
      referenceId: coupon._id,
      referenceModel: 'Coupon',
    }));
    if (notifications.length > 0) await Notification.insertMany(notifications);

    res.status(201).json({ coupon });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) return res.status(400).json({ message: 'Coupon code already exists' });
    res.status(500).json({ message: 'Server error' });
  }
};

// List agency's own coupons
exports.getMyCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({ agencyId: req.user.id })
      .sort('-createdAt')
      .populate('applicablePackages', 'title destination')
      .lean();
    res.json({ coupons });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a coupon (agency, only if still PENDING)
exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ _id: req.params.id, agencyId: req.user.id });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });

    const { description, discountType, discountValue, applicablePackages, maxUsage, minOrderAmount, maxDiscount, expiresAt, isActive } = req.body;

    if (description !== undefined) coupon.description = description;
    if (discountType) coupon.discountType = discountType;
    if (discountValue != null) coupon.discountValue = Number(discountValue);
    if (applicablePackages !== undefined) coupon.applicablePackages = applicablePackages;
    if (maxUsage != null) coupon.maxUsage = Number(maxUsage);
    if (minOrderAmount != null) coupon.minOrderAmount = Number(minOrderAmount);
    if (maxDiscount != null) coupon.maxDiscount = Number(maxDiscount);
    if (expiresAt !== undefined) coupon.expiresAt = expiresAt || null;
    if (isActive !== undefined) coupon.isActive = isActive;

    // If coupon was updated, reset to PENDING for re-approval
    if (coupon.status === 'APPROVED' || coupon.status === 'REJECTED') {
      coupon.status = 'PENDING';
      // Notify admins about update
      const admins = await User.find({ role: 'ADMIN' }).select('_id').lean();
      const agencyName = req.user.businessName || req.user.email;
      const notifications = admins.map((admin) => ({
        recipientId: admin._id,
        recipientRole: 'ADMIN',
        type: 'COUPON_CREATED',
        title: 'Coupon Updated — Re-approval Needed',
        message: `Agency "${agencyName}" updated coupon "${coupon.code}". Needs your approval again.`,
        referenceId: coupon._id,
        referenceModel: 'Coupon',
      }));
      if (notifications.length > 0) await Notification.insertMany(notifications);
    }

    await coupon.save();
    res.json({ coupon });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a coupon (agency)
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findOneAndDelete({ _id: req.params.id, agencyId: req.user.id });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.json({ message: 'Coupon deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ───── Admin endpoints ─────

// List all coupons (admin)
exports.listAllCoupons = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status.toUpperCase();
    const coupons = await Coupon.find(filter)
      .sort('-createdAt')
      .populate('agencyId', 'businessName email')
      .populate('applicablePackages', 'title destination')
      .lean();
    res.json({ coupons });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Approve / Reject coupon (admin)
exports.reviewCoupon = async (req, res) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'action must be approve or reject' });
    }
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });

    coupon.status = action === 'approve' ? 'APPROVED' : 'REJECTED';
    await coupon.save();

    // Notify the agency
    await Notification.create({
      recipientId: coupon.agencyId,
      recipientRole: 'AGENCY',
      type: action === 'approve' ? 'COUPON_APPROVED' : 'COUPON_REJECTED',
      title: action === 'approve' ? 'Coupon Approved!' : 'Coupon Rejected',
      message: action === 'approve'
        ? `Your coupon "${coupon.code}" has been approved and is now active for customers.`
        : `Your coupon "${coupon.code}" has been rejected by admin.`,
      referenceId: coupon._id,
      referenceModel: 'Coupon',
    });

    res.json({ coupon });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ───── User endpoints ─────

// List available coupons for a package (user can browse before applying)
exports.getAvailableCoupons = async (req, res) => {
  try {
    const { packageId } = req.query;
    if (!packageId) {
      return res.status(400).json({ message: 'packageId query param is required' });
    }

    const pkg = await Package.findById(packageId).lean();
    if (!pkg) return res.status(404).json({ message: 'Package not found' });

    const now = new Date();

    // Find all approved, active coupons from the same agency
    const coupons = await Coupon.find({
      agencyId: pkg.agencyId,
      status: 'APPROVED',
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: now } },
      ],
    })
      .select('code description discountType discountValue applicablePackages maxUsage usedCount minOrderAmount maxDiscount expiresAt')
      .lean();

    // Filter: only coupons that apply to this package (general or package-specific)
    const available = coupons.filter((c) => {
      // Usage limit check
      if (c.maxUsage > 0 && c.usedCount >= c.maxUsage) return false;
      // Package applicability check
      if (c.applicablePackages.length > 0) {
        return c.applicablePackages.some((id) => id.toString() === packageId);
      }
      return true; // general coupon (applies to all agency packages)
    });

    // Compute estimated discount for each coupon
    const result = available.map((c) => {
      let discount = 0;
      if (c.discountType === 'PERCENTAGE') {
        discount = (pkg.price * c.discountValue) / 100;
        if (c.maxDiscount > 0) discount = Math.min(discount, c.maxDiscount);
      } else {
        discount = c.discountValue;
      }
      discount = Math.min(discount, pkg.price);

      return {
        code: c.code,
        description: c.description,
        discountType: c.discountType,
        discountValue: c.discountValue,
        estimatedDiscount: Number(discount.toFixed(2)),
        minOrderAmount: c.minOrderAmount,
        maxDiscount: c.maxDiscount,
        expiresAt: c.expiresAt,
      };
    });

    res.json({ coupons: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Validate and compute discount for a coupon code
exports.validateCoupon = async (req, res) => {
  try {
    const { code, packageId } = req.body;
    if (!code || !packageId) {
      return res.status(400).json({ message: 'code and packageId are required' });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), status: 'APPROVED', isActive: true });
    if (!coupon) return res.status(404).json({ message: 'Invalid or expired coupon code' });

    // Check expiry
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({ message: 'This coupon has expired' });
    }

    // Check usage limit
    if (coupon.maxUsage > 0 && coupon.usedCount >= coupon.maxUsage) {
      return res.status(400).json({ message: 'This coupon has reached its usage limit' });
    }

    // Check package applicability
    const pkg = await Package.findById(packageId).lean();
    if (!pkg) return res.status(404).json({ message: 'Package not found' });

    // Coupon must belong to the same agency as the package
    if (coupon.agencyId.toString() !== pkg.agencyId.toString()) {
      return res.status(400).json({ message: 'This coupon is not valid for the selected package' });
    }

    // If coupon has specific packages, check membership
    if (coupon.applicablePackages.length > 0) {
      const isApplicable = coupon.applicablePackages.some((id) => id.toString() === packageId);
      if (!isApplicable) {
        return res.status(400).json({ message: 'This coupon is not valid for the selected package' });
      }
    }

    // Check minimum order amount
    if (coupon.minOrderAmount > 0 && pkg.price < coupon.minOrderAmount) {
      return res.status(400).json({ message: `Minimum order amount for this coupon is ₹${coupon.minOrderAmount}` });
    }

    // Compute discount
    let discount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discount = (pkg.price * coupon.discountValue) / 100;
      if (coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
    } else {
      discount = coupon.discountValue;
    }
    discount = Math.min(discount, pkg.price);

    res.json({
      valid: true,
      couponId: coupon._id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: Number(discount.toFixed(2)),
      description: coupon.description,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
