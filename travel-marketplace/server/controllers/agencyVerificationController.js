const Agency = require('../models/Agency');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Package = require('../models/Package');

// POST /api/agency-verification/submit — submit verification documents
exports.submitVerification = async (req, res) => {
  try {
    const agencyId = req.user.id;
    const agency = await Agency.findById(agencyId);
    if (!agency) return res.status(404).json({ message: 'Agency not found' });

    if (agency.verificationStatus === 'VERIFIED') {
      return res.status(400).json({ message: 'Agency is already verified' });
    }

    const { gstNumber, panNumber, description, phone, website, address } = req.body;

    // Update agency details
    if (gstNumber) agency.gstNumber = gstNumber;
    if (panNumber) agency.panNumber = panNumber;
    if (description) agency.description = description;
    if (phone) agency.phone = phone;
    if (website) agency.website = website;
    if (address) agency.address = address;

    // Handle document uploads (Cloudinary URLs from middleware)
    if (req.uploadedFiles) {
      agency.verificationDocuments = {
        ...agency.verificationDocuments,
        ...req.uploadedFiles
      };
    }

    agency.verificationStatus = 'PENDING';
    agency.verificationSubmittedAt = new Date();
    await agency.save();

    res.json({ message: 'Verification documents submitted successfully', verificationStatus: agency.verificationStatus });
  } catch (err) {
    console.error('Submit verification error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/agency-verification/status — get verification status
exports.getVerificationStatus = async (req, res) => {
  try {
    const agencyId = req.user.id;
    const agency = await Agency.findById(agencyId).select(
      'verificationStatus verificationDocuments verificationSubmittedAt verificationReviewedAt verificationNotes trustScore gstNumber panNumber description phone website address'
    );
    if (!agency) return res.status(404).json({ message: 'Agency not found' });

    res.json({ verification: agency });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Compute trust score for an agency (called after actions that affect trust)
async function computeTrustScore(agencyId) {
  try {
    const agency = await Agency.findById(agencyId);
    if (!agency) return 0;

    let score = 0;

    // 1. Verification status (30 points)
    if (agency.verificationStatus === 'VERIFIED') score += 30;
    else if (agency.verificationStatus === 'PENDING') score += 10;

    // 2. Documents uploaded (10 points)
    const docs = agency.verificationDocuments || {};
    const docsUploaded = [docs.gstCertificate, docs.businessLicense, docs.panCard, docs.addressProof].filter(Boolean).length;
    score += Math.min(docsUploaded * 2.5, 10);

    // 3. GST & PAN (5 points each)
    if (agency.gstNumber) score += 5;
    if (agency.panNumber) score += 5;

    // 4. Completion rate (20 points)
    const bookings = await Booking.find({ status: { $in: ['COMPLETED', 'CONFIRMED', 'CANCELLED'] } });
    const agencyPackages = await Package.find({ agencyId }).select('_id').lean();
    const agencyPackageIds = agencyPackages.map((p) => p._id.toString());
    const agencyBookings = bookings.filter((b) => agencyPackageIds.includes(b.packageId.toString()));
    const completedCount = agencyBookings.filter((b) => b.status === 'COMPLETED').length;
    const totalBookings = agencyBookings.length;
    if (totalBookings > 0) {
      const completionRate = completedCount / totalBookings;
      score += Math.round(completionRate * 20);
    }

    // 5. Reviews average (15 points)
    const reviews = await Review.find({ packageId: { $in: agencyPackageIds } }).lean();
    if (reviews.length > 0) {
      const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
      score += Math.round((avgRating / 5) * 15);
    }

    // 6. Account age (10 points) — max at 1 year
    const ageInDays = (Date.now() - new Date(agency.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    score += Math.min(Math.round((ageInDays / 365) * 10), 10);

    // 7. Active packages (5 points)
    const activePackages = agencyPackages.length;
    score += Math.min(activePackages, 5);

    // Cap at 100
    score = Math.min(score, 100);

    agency.trustScore = score;
    await agency.save({ validateBeforeSave: false });

    return score;
  } catch (err) {
    console.error('Trust score computation error:', err);
    return 0;
  }
}

// GET /api/agency-verification/badge/:agencyId — public badge info
exports.getAgencyBadge = async (req, res) => {
  try {
    const { agencyId } = req.params;
    const agency = await Agency.findById(agencyId).select(
      'businessName verificationStatus trustScore createdAt description phone website logoUrl'
    );
    if (!agency) return res.status(404).json({ message: 'Agency not found' });

    // Compute live trust score
    const trustScore = await computeTrustScore(agencyId);

    // Badge tier
    let badgeTier = 'none';
    if (agency.verificationStatus === 'VERIFIED') {
      if (trustScore >= 80) badgeTier = 'gold';
      else if (trustScore >= 60) badgeTier = 'silver';
      else badgeTier = 'bronze';
    }

    // Stats
    const packages = await Package.countDocuments({ agencyId, status: 'ACTIVE' });
    const agencyPkgIds = (await Package.find({ agencyId }).select('_id').lean()).map((p) => p._id);
    const completedBookings = await Booking.countDocuments({
      packageId: { $in: agencyPkgIds },
      status: 'COMPLETED'
    });
    const reviews = await Review.find({ packageId: { $in: agencyPkgIds } }).lean();
    const avgRating = reviews.length > 0
      ? Number((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1))
      : 0;

    const memberSince = agency.createdAt;

    res.json({
      badge: {
        agencyId: agency._id,
        businessName: agency.businessName,
        verificationStatus: agency.verificationStatus,
        trustScore,
        badgeTier,
        description: agency.description,
        phone: agency.phone,
        website: agency.website,
        logoUrl: agency.logoUrl,
        stats: {
          activePackages: packages,
          completedTrips: completedBookings,
          totalReviews: reviews.length,
          avgRating
        },
        memberSince
      }
    });
  } catch (err) {
    console.error('Badge error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Review verification (approve/reject)
exports.reviewVerification = async (req, res) => {
  try {
    const { agencyId } = req.params;
    const { status, notes } = req.body;

    if (!['VERIFIED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Status must be VERIFIED or REJECTED' });
    }

    const agency = await Agency.findById(agencyId);
    if (!agency) return res.status(404).json({ message: 'Agency not found' });

    agency.verificationStatus = status;
    agency.verificationReviewedAt = new Date();
    agency.verificationNotes = notes || '';
    await agency.save();

    // Recompute trust score
    await computeTrustScore(agencyId);

    res.json({ message: `Agency ${status.toLowerCase()} successfully`, verificationStatus: status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports.computeTrustScore = computeTrustScore;
