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
    const {
      destination, category, q,
      destinationType, themes, inclusions,
      minPrice, maxPrice,
      minDuration, maxDuration,
      durationRanges, budgetRanges,
      hotelStarRating,
      sort: sortParam,
      page = 1, limit = 20
    } = req.query;
    const filter = { status: 'ACTIVE' };

    if (destination) {
      filter.destination = { $regex: destination, $options: 'i' };
    }
    if (category) {
      const cats = category.split(',').map(c => c.trim()).filter(Boolean);
      if (cats.length === 1) filter.category = cats[0];
      else if (cats.length > 1) filter.category = { $in: cats };
    }
    if (destinationType) {
      const types = destinationType.split(',').map(t => t.trim()).filter(Boolean);
      if (types.length === 1) filter.destinationType = types[0];
      else if (types.length > 1) filter.destinationType = { $in: types };
    }
    if (themes) {
      const themeArr = themes.split(',').map(t => t.trim()).filter(Boolean);
      filter.themes = { $in: themeArr };
    }
    if (inclusions) {
      const incArr = inclusions.split(',').map(i => i.trim()).filter(Boolean);
      filter.inclusions = { $in: incArr };
    }

    // Duration ranges: support non-contiguous ranges e.g. "1-3,7-9,13-"
    if (durationRanges) {
      const rangeConditions = durationRanges.split(',').map(r => r.trim()).filter(Boolean).map(r => {
        const [minStr, maxStr] = r.split('-');
        const cond = {};
        if (minStr) cond.$gte = Number(minStr);
        if (maxStr) cond.$lte = Number(maxStr);
        return Object.keys(cond).length > 0 ? { duration: cond } : null;
      }).filter(Boolean);
      if (rangeConditions.length === 1) {
        filter.duration = rangeConditions[0].duration;
      } else if (rangeConditions.length > 1) {
        filter.$and = filter.$and || [];
        filter.$and.push({ $or: rangeConditions });
      }
    } else if (minDuration || maxDuration) {
      filter.duration = {};
      if (minDuration) filter.duration.$gte = Number(minDuration);
      if (maxDuration) filter.duration.$lte = Number(maxDuration);
    }

    // Budget ranges: support non-contiguous ranges e.g. "0-10000,40000-60000,80000-"
    if (budgetRanges) {
      const rangeConditions = budgetRanges.split(',').map(r => r.trim()).filter(Boolean).map(r => {
        const [minStr, maxStr] = r.split('-');
        const cond = {};
        if (minStr) cond.$gte = Number(minStr);
        if (maxStr) cond.$lte = Number(maxStr);
        return Object.keys(cond).length > 0 ? { price: cond } : null;
      }).filter(Boolean);
      if (rangeConditions.length === 1) {
        filter.price = rangeConditions[0].price;
      } else if (rangeConditions.length > 1) {
        filter.$and = filter.$and || [];
        filter.$and.push({ $or: rangeConditions });
      }
    } else if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (hotelStarRating) {
      const stars = hotelStarRating.split(',').map(Number).filter(n => n >= 1 && n <= 5);
      if (stars.length === 1) filter.hotelStarRating = stars[0];
      else if (stars.length > 1) filter.hotelStarRating = { $in: stars };
    }
    if (q) {
      const searchConds = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { destination: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { 'cities': { $regex: q, $options: 'i' } },
        { 'themes': { $regex: q, $options: 'i' } }
      ];
      filter.$and = filter.$and || [];
      filter.$and.push({ $or: searchConds });
    }

    // Sorting
    let sortObj = { createdAt: -1 };
    switch (sortParam) {
      case 'price_asc': sortObj = { price: 1 }; break;
      case 'price_desc': sortObj = { price: -1 }; break;
      case 'rating': sortObj = { rating: -1, reviewCount: -1 }; break;
      case 'popularity': sortObj = { reviewCount: -1, rating: -1 }; break;
      case 'duration_asc': sortObj = { duration: 1 }; break;
      case 'duration_desc': sortObj = { duration: -1 }; break;
      case 'newest': default: sortObj = { createdAt: -1 }; break;
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(Math.max(1, Number(limit)), 50);
    const skip = (pageNum - 1) * limitNum;

    const [packages, total] = await Promise.all([
      Package.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .populate('agencyId', 'businessName verificationStatus')
        .select('title description destination category price duration agencyId status imageUrl rating reviewCount offers themes inclusions hotelStarRating cities nightCount customizable destinationType createdAt')
        .lean(),
      Package.countDocuments(filter)
    ]);

    res.json({
      packages,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });
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
  'staffPick', 'bestSeasons', 'themes', 'destinationType', 'inclusions',
  'hotelStarRating', 'cities', 'nightCount', 'customizable'
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
    const { title, description, destination, category, price, duration, itinerary, cancellationPolicy, offers, imageUrl, bestSeasons, themes, destinationType, inclusions, hotelStarRating, cities, nightCount, customizable } = req.body;
    const payload = { title, description, destination, category, price, duration, itinerary, cancellationPolicy, offers, imageUrl, bestSeasons, themes, destinationType, inclusions, hotelStarRating, cities, nightCount, customizable, agencyId };
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

    // Cloudinary stores the URL in req.file.path
    const imageUrl = req.file.path;

    res.status(201).json({ imageUrl, imagePath: imageUrl });
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
    const allowed = ['title', 'description', 'destination', 'category', 'price', 'duration', 'itinerary', 'cancellationPolicy', 'offers', 'imageUrl', 'bestSeasons', 'themes', 'status', 'destinationType', 'inclusions', 'hotelStarRating', 'cities', 'nightCount', 'customizable'];
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
