const Package = require('../models/Package');
const Offer = require('../models/Offer');
const mongoose = require('mongoose');
const { computeFinalPrice } = require('../services/pricingService');

// GET /api/packages/stats - public stats for homepage
exports.getStats = async (req, res) => {
  try {
    const Agency = require('../models/Agency');
    const Booking = require('../models/Booking');

    const [packages, agencies, bookings, ratingAgg] = await Promise.all([
      Package.countDocuments({ status: 'ACTIVE' }),
      Agency.countDocuments({ verificationStatus: 'VERIFIED' }),
      Booking.countDocuments(),
      Package.aggregate([
        { $match: { status: 'ACTIVE', rating: { $gt: 0 } } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ])
    ]);

    res.json({
      packages,
      agencies,
      bookings,
      avgRating: ratingAgg[0]?.avgRating || 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.listPackages = async (req, res) => {
  try {
    const { destination, category, q } = req.query;
    const filter = { status: 'ACTIVE' };

    if (destination) {
      filter.destination = { $regex: destination, $options: 'i' };
    }
    if (category) {
      filter.category = category;
    }
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { destination: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ];
    }

    const packages = await Package.find(filter)
      .sort('-createdAt')
      .populate('agencyId', 'businessName verificationStatus')
      .select('title description destination category price duration agencyId status imageUrl rating reviewCount createdAt')
      .lean();

    res.json({ packages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const Agency = require('../models/Agency');
    const Booking = require('../models/Booking');
    const [packages, agencies, bookings, ratingAgg] = await Promise.all([
      Package.countDocuments({ status: 'ACTIVE' }),
      Agency.countDocuments({ verificationStatus: 'VERIFIED' }),
      Booking.countDocuments(),
      Package.aggregate([
        { $match: { status: 'ACTIVE', rating: { $gt: 0 } } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ])
    ]);
    res.json({
      packages,
      agencies,
      bookings,
      avgRating: ratingAgg[0]?.avgRating || 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const ALLOWED_PACKAGE_FIELDS = [
  'title', 'description', 'destination', 'category', 'price', 'duration',
  'itinerary', 'cancellationPolicy', 'offers', 'imageUrl',
  'staffPick', 'bestSeasons', 'themes'
];

function pickFields(body) {
  const result = {};
  for (const key of ALLOWED_PACKAGE_FIELDS) {
    if (body[key] !== undefined) result[key] = body[key];
  }
  return result;
}

exports.createPackage = async (req, res) => {
  try {
    const agencyId = req.user.id;
    // Whitelist allowed fields to prevent mass-assignment
    const { title, description, destination, category, price, duration, itinerary, cancellationPolicy, offers, imageUrl, bestSeasons, themes } = req.body;
    const payload = { title, description, destination, category, price, duration, itinerary, cancellationPolicy, offers, imageUrl, bestSeasons, themes, agencyId };
    const pkg = await Package.create(payload);
    res.status(201).json({ package: pkg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.uploadPackageImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    const imagePath = `/uploads/packages/${req.file.filename}`;
    const imageUrl = `${req.protocol}://${req.get('host')}${imagePath}`;

    res.status(201).json({ imageUrl, imagePath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMyPackages = async (req, res) => {
  try {
    const agencyId = req.user.id;
    const packages = await Package.find({ agencyId }).sort('-createdAt');
    res.json({ packages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePackage = async (req, res) => {
  try {
    const agencyId = req.user.id;
    const pkg = await Package.findById(req.params.id);
    if (!pkg) return res.status(404).json({ message: 'Package not found' });
    if (pkg.agencyId.toString() !== agencyId) return res.status(403).json({ message: 'Forbidden' });
    // Whitelist allowed fields
    const allowed = ['title', 'description', 'destination', 'category', 'price', 'duration', 'itinerary', 'cancellationPolicy', 'offers', 'imageUrl', 'bestSeasons', 'themes', 'status'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) pkg[key] = req.body[key];
    }
    await pkg.save();
    res.json({ package: pkg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deletePackage = async (req, res) => {
  try {
    const agencyId = req.user.id;
    const pkg = await Package.findById(req.params.id);
    if (!pkg) return res.status(404).json({ message: 'Package not found' });
    if (pkg.agencyId.toString() !== agencyId) return res.status(403).json({ message: 'Forbidden' });
    await pkg.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/packages/by-duration?minDays=4&maxDays=6&limit=10
exports.getPackagesByDuration = async (req, res) => {
  try {
    const { minDays, maxDays, limit = 10 } = req.query;
    const filter = { status: 'ACTIVE' };

    if (minDays) filter.duration = { ...filter.duration, $gte: Number(minDays) };
    if (maxDays) filter.duration = { ...filter.duration, $lte: Number(maxDays) };

    const packages = await Package.find(filter)
      .sort({ price: 1 }) // best priced first
      .limit(Number(limit))
      .populate('agencyId', 'businessName verificationStatus')
      .select('title description destination category price duration agencyId status imageUrl rating reviewCount createdAt')
      .lean();

    const total = await Package.countDocuments(filter);

    res.json({ packages, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/packages/by-season?season=jan-feb-mar&limit=10
exports.getPackagesBySeason = async (req, res) => {
  try {
    const { season, limit = 10 } = req.query;
    const filter = { status: 'ACTIVE' };

    if (season) {
      filter.bestSeasons = season;
    }

    const packages = await Package.find(filter)
      .sort({ staffPick: -1, rating: -1, reviewCount: -1 })
      .limit(Number(limit))
      .populate('agencyId', 'businessName verificationStatus')
      .select('title description destination category price duration agencyId status imageUrl rating reviewCount bestSeasons staffPick createdAt')
      .lean();

    res.json({ packages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/packages/by-theme?theme=beach&limit=10
exports.getPackagesByTheme = async (req, res) => {
  try {
    const { theme, limit = 10 } = req.query;
    const filter = { status: 'ACTIVE' };

    if (theme) {
      filter.themes = theme;
    }

    const packages = await Package.find(filter)
      .sort({ rating: -1, reviewCount: -1 })
      .limit(Number(limit))
      .populate('agencyId', 'businessName verificationStatus')
      .select('title description destination category price duration agencyId status imageUrl rating reviewCount themes createdAt')
      .lean();

    // Also return available themes with counts
    const themeCounts = await Package.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $unwind: '$themes' },
      { $group: { _id: '$themes', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({ packages, themes: themeCounts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/packages/by-budget?min=0&max=10000&limit=10
exports.getPackagesByBudget = async (req, res) => {
  try {
    const { min = 0, max, limit = 10 } = req.query;
    const filter = { status: 'ACTIVE' };

    filter.price = { $gte: Number(min) };
    if (max) filter.price.$lte = Number(max);

    const packages = await Package.find(filter)
      .sort({ rating: -1, price: 1 })
      .limit(Number(limit))
      .populate('agencyId', 'businessName verificationStatus')
      .select('title destination category price duration agencyId imageUrl rating reviewCount offers createdAt')
      .lean();

    const total = await Package.countDocuments(filter);

    res.json({ packages, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPackageById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid package id' });
    }
    const pkg = await Package.findById(req.params.id).lean();
    if (!pkg) return res.status(404).json({ message: 'Package not found' });

    // collect available offers: embedded package offers + global offers that match
    const embeddedOffers = (pkg.offers || []).map((o) => ({
      title: o.title,
      discountType: 'PERCENTAGE',
      value: Number(o.discountPercent || 0),
      packageId: pkg._id,
      destination: pkg.destination
    }));

    // find global offers that either target this package, match destination, or are general
    const globalOffers = await Offer.find({
      $or: [
        { packageId: pkg._id },
        { destination: pkg.destination },
        { $and: [{ packageId: { $exists: false } }, { destination: { $exists: false } }] },
        { packageId: null, destination: null }
      ]
    }).lean();

    const availableOffers = [...embeddedOffers, ...globalOffers];

    // determine travelDate from query string (optional)
    const travelDate = req.query.travelDate || null;

    const pricing = await computeFinalPrice({ basePrice: pkg.price, travelDate, availableOffers });

    res.json({ package: pkg, pricing, offers: availableOffers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
