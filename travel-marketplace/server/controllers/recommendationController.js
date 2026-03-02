const Package = require('../models/Package');
const Booking = require('../models/Booking');
const Wishlist = require('../models/Wishlist');
const Cart = require('../models/Cart');

/**
 * Content-based recommendation engine (zero external API costs).
 *
 * Strategy:
 * 1. Build a user profile from their bookings, wishlist, and cart
 *    – extract preferred themes, categories, destinations, budget range, duration range
 * 2. Score every active package against the user profile
 * 3. Collaborative: "users who booked X also booked Y"
 * 4. Return top N packages the user has NOT already booked/wishlisted/carted
 */

async function buildUserProfile(userId) {
  const [bookings, wishlistItems, cart] = await Promise.all([
    Booking.find({ userId, status: { $in: ['CONFIRMED', 'COMPLETED', 'PAID'] } })
      .populate('packageId', 'themes category destination price duration destinationType inclusions')
      .lean(),
    Wishlist.find({ userId })
      .populate('packageId', 'themes category destination price duration destinationType inclusions')
      .lean(),
    Cart.findOne({ userId })
      .populate('items.packageId', 'themes category destination price duration destinationType inclusions')
      .lean()
  ]);

  const cartItems = (cart?.items || []).map((item) => ({ packageId: item.packageId }));

  const interacted = [];
  const interactedIds = new Set();

  // Weight: bookings 3x, wishlist 2x, cart 1x
  for (const b of bookings) {
    if (b.packageId) {
      interacted.push({ pkg: b.packageId, weight: 3 });
      interactedIds.add(String(b.packageId._id));
    }
  }
  for (const w of wishlistItems) {
    if (w.packageId) {
      interacted.push({ pkg: w.packageId, weight: 2 });
      interactedIds.add(String(w.packageId._id));
    }
  }
  for (const c of cartItems) {
    if (c.packageId) {
      interacted.push({ pkg: c.packageId, weight: 1 });
      interactedIds.add(String(c.packageId._id));
    }
  }

  if (interacted.length === 0) return { profile: null, interactedIds };

  // Build weighted preference maps
  const themeScores = {};
  const categoryScores = {};
  const destinationScores = {};
  const destinationTypeScores = {};
  let totalPrice = 0;
  let totalDuration = 0;
  let totalWeight = 0;

  for (const { pkg, weight } of interacted) {
    (pkg.themes || []).forEach((t) => { themeScores[t] = (themeScores[t] || 0) + weight; });
    if (pkg.category) categoryScores[pkg.category] = (categoryScores[pkg.category] || 0) + weight;
    if (pkg.destination) destinationScores[pkg.destination] = (destinationScores[pkg.destination] || 0) + weight;
    if (pkg.destinationType) destinationTypeScores[pkg.destinationType] = (destinationTypeScores[pkg.destinationType] || 0) + weight;
    totalPrice += (pkg.price || 0) * weight;
    totalDuration += (pkg.duration || 0) * weight;
    totalWeight += weight;
  }

  const avgPrice = totalPrice / totalWeight;
  const avgDuration = totalDuration / totalWeight;

  return {
    profile: {
      themeScores,
      categoryScores,
      destinationScores,
      destinationTypeScores,
      avgPrice,
      avgDuration,
      totalWeight
    },
    interactedIds,
    bookedPackageIds: bookings.map((b) => String(b.packageId?._id)).filter(Boolean)
  };
}

function scorePackage(pkg, profile) {
  let score = 0;
  const maxThemeScore = Math.max(...Object.values(profile.themeScores), 1);
  const maxCatScore = Math.max(...Object.values(profile.categoryScores), 1);

  // Theme match (up to 40 points)
  (pkg.themes || []).forEach((t) => {
    if (profile.themeScores[t]) {
      score += (profile.themeScores[t] / maxThemeScore) * 40;
    }
  });

  // Category match (up to 20 points)
  if (pkg.category && profile.categoryScores[pkg.category]) {
    score += (profile.categoryScores[pkg.category] / maxCatScore) * 20;
  }

  // Destination match (up to 15 points)
  if (pkg.destination && profile.destinationScores[pkg.destination]) {
    score += 15;
  }

  // Destination type match (up to 5 points)
  if (pkg.destinationType && profile.destinationTypeScores[pkg.destinationType]) {
    score += 5;
  }

  // Budget proximity (up to 10 points) — closer to avg preferred price = better
  if (profile.avgPrice > 0 && pkg.price) {
    const priceDiff = Math.abs(pkg.price - profile.avgPrice) / profile.avgPrice;
    score += Math.max(0, 10 * (1 - priceDiff));
  }

  // Duration proximity (up to 5 points)
  if (profile.avgDuration > 0 && pkg.duration) {
    const durDiff = Math.abs(pkg.duration - profile.avgDuration) / profile.avgDuration;
    score += Math.max(0, 5 * (1 - durDiff));
  }

  // Boost highly rated packages (up to 5 points)
  score += (pkg.rating || 0);

  return score;
}

// GET /api/recommendations/for-you
exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 10));

    const { profile, interactedIds, bookedPackageIds } = await buildUserProfile(userId);

    // Fetch all active packages
    const allPackages = await Package.find({ status: 'ACTIVE' })
      .select('title description destination category price duration imageUrl offers rating reviewCount themes destinationType inclusions hotelStarRating cities agencyId')
      .populate('agencyId', 'businessName')
      .lean();

    if (!profile) {
      // Cold start: no interaction history — return popular packages
      const popular = allPackages
        .sort((a, b) => ((b.rating || 0) - (a.rating || 0)) || ((b.reviewCount || 0) - (a.reviewCount || 0)))
        .slice(0, limit);
      return res.json({ recommendations: popular, strategy: 'popular' });
    }

    // Filter out already-interacted packages and score the rest
    const candidates = allPackages
      .filter((pkg) => !interactedIds.has(String(pkg._id)))
      .map((pkg) => ({
        ...pkg,
        _score: scorePackage(pkg, profile)
      }))
      .sort((a, b) => b._score - a._score);

    const contentBased = candidates.slice(0, limit);

    res.json({ recommendations: contentBased, strategy: 'personalized' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/recommendations/similar/:packageId
exports.getSimilarPackages = async (req, res) => {
  try {
    const { packageId } = req.params;
    const limit = Math.min(10, Math.max(1, parseInt(req.query.limit) || 6));

    const source = await Package.findById(packageId).lean();
    if (!source) return res.status(404).json({ message: 'Package not found' });

    // Find packages that share themes, category, destination, or similar price
    const similar = await Package.find({
      _id: { $ne: source._id },
      status: 'ACTIVE'
    })
      .select('title description destination category price duration imageUrl offers rating reviewCount themes destinationType agencyId')
      .populate('agencyId', 'businessName')
      .lean();

    // Score similarity
    const scored = similar.map((pkg) => {
      let score = 0;

      // Same themes
      const sharedThemes = (pkg.themes || []).filter((t) => (source.themes || []).includes(t));
      score += sharedThemes.length * 15;

      // Same category
      if (pkg.category === source.category) score += 20;

      // Same destination
      if (pkg.destination === source.destination) score += 25;

      // Same destination type
      if (pkg.destinationType === source.destinationType) score += 5;

      // Price proximity
      if (source.price && pkg.price) {
        const diff = Math.abs(pkg.price - source.price) / source.price;
        score += Math.max(0, 15 * (1 - diff));
      }

      // Duration proximity
      if (source.duration && pkg.duration) {
        const diff = Math.abs(pkg.duration - source.duration) / source.duration;
        score += Math.max(0, 10 * (1 - diff));
      }

      // Rating boost
      score += (pkg.rating || 0);

      return { ...pkg, _score: score };
    })
      .sort((a, b) => b._score - a._score)
      .slice(0, limit);

    res.json({ similar: scored });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/recommendations/also-booked/:packageId
exports.getAlsoBooked = async (req, res) => {
  try {
    const { packageId } = req.params;
    const limit = Math.min(10, Math.max(1, parseInt(req.query.limit) || 6));

    // Find users who booked this package
    const bookings = await Booking.find({
      packageId,
      status: { $in: ['CONFIRMED', 'COMPLETED', 'PAID'] }
    }).select('userId').lean();

    const userIds = [...new Set(bookings.map((b) => String(b.userId)))];

    if (userIds.length === 0) {
      return res.json({ alsoBooked: [] });
    }

    // Find other packages those users booked
    const otherBookings = await Booking.aggregate([
      {
        $match: {
          userId: { $in: userIds.map((id) => require('mongoose').Types.ObjectId.createFromHexString(id)) },
          packageId: { $ne: require('mongoose').Types.ObjectId.createFromHexString(packageId) },
          status: { $in: ['CONFIRMED', 'COMPLETED', 'PAID'] }
        }
      },
      { $group: { _id: '$packageId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit }
    ]);

    const packageIds = otherBookings.map((b) => b._id);
    const packages = await Package.find({ _id: { $in: packageIds }, status: 'ACTIVE' })
      .select('title destination category price duration imageUrl offers rating reviewCount themes agencyId')
      .populate('agencyId', 'businessName')
      .lean();

    // Maintain order by count
    const countMap = Object.fromEntries(otherBookings.map((b) => [String(b._id), b.count]));
    packages.sort((a, b) => (countMap[String(b._id)] || 0) - (countMap[String(a._id)] || 0));

    res.json({ alsoBooked: packages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
