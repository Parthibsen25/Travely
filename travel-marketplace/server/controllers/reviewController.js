const Review = require('../models/Review');
const Package = require('../models/Package');
const mongoose = require('mongoose');

exports.createReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { packageId, rating, comment, images, bookingId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(packageId)) {
      return res.status(400).json({ message: 'Invalid package id' });
    }

    const pkg = await Package.findById(packageId);
    if (!pkg) return res.status(404).json({ message: 'Package not found' });

    // Check if user already reviewed this package
    const existing = await Review.findOne({ packageId, userId });
    if (existing) {
      return res.status(409).json({ message: 'You have already reviewed this package' });
    }

    const review = await Review.create({
      packageId,
      userId,
      bookingId,
      rating: Number(rating),
      comment: comment || '',
      images: images || []
    });

    // Update package rating average
    await updatePackageRating(packageId);

    res.status(201).json({ review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPackageReviews = async (req, res) => {
  try {
    const packageId = req.params.packageId;
    if (!mongoose.Types.ObjectId.isValid(packageId)) {
      return res.status(400).json({ message: 'Invalid package id' });
    }

    const reviews = await Review.find({ packageId })
      .populate('userId', 'name email')
      .sort('-createdAt')
      .lean();

    res.json({ reviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMyReviews = async (req, res) => {
  try {
    const userId = req.user.id;
    const reviews = await Review.find({ userId })
      .populate('packageId', 'title destination')
      .sort('-createdAt')
      .lean();

    res.json({ reviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/reviews/featured — public, returns top reviews with comments for the landing page
exports.getFeaturedReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ rating: { $gte: 3 }, comment: { $exists: true, $ne: '' } })
      .populate('userId', 'name')
      .populate('packageId', 'title destination imageUrl price')
      .sort({ rating: -1, createdAt: -1 })
      .limit(10)
      .lean();

    const stories = reviews.map((r) => ({
      _id: r._id,
      userName: r.userId?.name || 'Traveler',
      rating: r.rating,
      comment: r.comment,
      images: r.images || [],
      packageTitle: r.packageId?.title || '',
      destination: r.packageId?.destination || '',
      packageImage: r.packageId?.imageUrl || '',
      packageId: r.packageId?._id || null,
      createdAt: r.createdAt,
    }));

    res.json({ stories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

async function updatePackageRating(packageId) {
  try {
    const reviews = await Review.find({ packageId }).lean();
    if (reviews.length === 0) {
      await Package.findByIdAndUpdate(packageId, {
        $set: { rating: 0, reviewCount: 0 }
      });
      return;
    }

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Package.findByIdAndUpdate(packageId, {
      $set: {
        rating: Number(avgRating.toFixed(1)),
        reviewCount: reviews.length
      }
    });
  } catch (err) {
    console.error('Error updating package rating:', err);
  }
}
