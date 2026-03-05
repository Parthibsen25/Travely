const Package = require('../models/Package');

// GET /api/search/autocomplete?q=goa — fast autocomplete for search bar
exports.autocomplete = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    // Get distinct destination matches
    const destinations = await Package.distinct('destination', {
      status: 'ACTIVE',
      destination: regex
    });

    // Get matching package titles
    const packages = await Package.find(
      { status: 'ACTIVE', $or: [{ title: regex }, { destination: regex }, { category: regex }] },
      { title: 1, destination: 1, category: 1, price: 1, duration: 1, imageUrl: 1 }
    )
      .limit(6)
      .lean();

    // Get distinct cities matching
    const cityPackages = await Package.find(
      { status: 'ACTIVE', cities: regex },
      { cities: 1 }
    ).lean();
    const cities = [...new Set(cityPackages.flatMap((p) => p.cities || []).filter((c) => regex.test(c)))].slice(0, 5);

    // Get matching themes
    const themes = ['beach', 'hill-station', 'wildlife', 'heritage', 'pilgrimage', 'honeymoon', 'family', 'adventure', 'luxury', 'backpacking']
      .filter((t) => regex.test(t));

    res.json({
      suggestions: {
        destinations: destinations.slice(0, 5),
        packages: packages.map((p) => ({
          id: p._id,
          title: p.title,
          destination: p.destination,
          price: p.price,
          duration: p.duration,
          imageUrl: p.imageUrl
        })),
        cities: cities.slice(0, 5),
        themes
      }
    });
  } catch (err) {
    console.error('Autocomplete error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/search?q=beach+goa&minPrice=5000&maxPrice=50000&themes=beach,adventure&sort=price_asc
exports.advancedSearch = async (req, res) => {
  try {
    const {
      q,
      destination,
      category,
      destinationType,
      themes,
      inclusions,
      minPrice,
      maxPrice,
      minDuration,
      maxDuration,
      minRating,
      hotelStarRating,
      bestSeasons,
      sort = 'relevance',
      page = 1,
      limit = 20
    } = req.query;

    const filter = { status: 'ACTIVE' };
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

    // Fuzzy text search using regex with word-boundary-like matching
    if (q) {
      const words = q.trim().split(/\s+/).filter(Boolean);
      const regexParts = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

      // Build OR condition across searchable fields
      const searchConditions = regexParts.flatMap((word) => {
        const rx = new RegExp(word, 'i');
        return [
          { title: rx },
          { description: rx },
          { destination: rx },
          { category: rx },
          { cities: rx },
          { themes: rx }
        ];
      });
      filter.$or = searchConditions;
    }

    if (destination) filter.destination = { $regex: destination, $options: 'i' };
    if (category) {
      const cats = category.split(',').map((c) => c.trim()).filter(Boolean);
      filter.category = cats.length === 1 ? cats[0] : { $in: cats };
    }
    if (destinationType) {
      const types = destinationType.split(',').map((t) => t.trim()).filter(Boolean);
      filter.destinationType = types.length === 1 ? types[0] : { $in: types };
    }
    if (themes) {
      filter.themes = { $in: themes.split(',').map((t) => t.trim()).filter(Boolean) };
    }
    if (inclusions) {
      filter.inclusions = { $in: inclusions.split(',').map((i) => i.trim()).filter(Boolean) };
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (minDuration || maxDuration) {
      filter.duration = {};
      if (minDuration) filter.duration.$gte = Number(minDuration);
      if (maxDuration) filter.duration.$lte = Number(maxDuration);
    }
    if (minRating) {
      filter.rating = { $gte: Number(minRating) };
    }
    if (hotelStarRating) {
      filter.hotelStarRating = Number(hotelStarRating);
    }
    if (bestSeasons) {
      filter.bestSeasons = { $in: bestSeasons.split(',').map((s) => s.trim()).filter(Boolean) };
    }

    // Sort options
    let sortObj = {};
    switch (sort) {
      case 'price_asc':
        sortObj = { price: 1 };
        break;
      case 'price_desc':
        sortObj = { price: -1 };
        break;
      case 'rating':
        sortObj = { rating: -1 };
        break;
      case 'duration_asc':
        sortObj = { duration: 1 };
        break;
      case 'duration_desc':
        sortObj = { duration: -1 };
        break;
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      case 'popular':
        sortObj = { reviewCount: -1, rating: -1 };
        break;
      default:
        sortObj = q ? { reviewCount: -1, rating: -1 } : { createdAt: -1 };
    }

    const skip = (pageNum - 1) * limitNum;

    const [packages, total] = await Promise.all([
      Package.find(filter)
        .populate('agencyId', 'businessName verificationStatus trustScore')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Package.countDocuments(filter)
    ]);

    // Generate facets for filter sidebar
    const facets = await Package.aggregate([
      { $match: { status: 'ACTIVE' } },
      {
        $facet: {
          categories: [{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
          destinationTypes: [{ $group: { _id: '$destinationType', count: { $sum: 1 } } }],
          priceRange: [{ $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' }, avg: { $avg: '$price' } } }],
          durationRange: [{ $group: { _id: null, min: { $min: '$duration' }, max: { $max: '$duration' } } }],
          themes: [{ $unwind: '$themes' }, { $group: { _id: '$themes', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
          topDestinations: [{ $group: { _id: '$destination', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]
        }
      }
    ]);

    res.json({
      packages,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      facets: facets[0] || {}
    });
  } catch (err) {
    console.error('Advanced search error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/search/trending — trending destinations and searches
exports.trending = async (req, res) => {
  try {
    const Booking = require('../models/Booking');

    const [topDestinations, recentPopular] = await Promise.all([
      // Most booked destinations in last 30 days
      Booking.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        { $lookup: { from: 'packages', localField: 'packageId', foreignField: '_id', as: 'pkg' } },
        { $unwind: '$pkg' },
        { $group: { _id: '$pkg.destination', bookingCount: { $sum: 1 }, avgPrice: { $avg: '$pkg.price' } } },
        { $sort: { bookingCount: -1 } },
        { $limit: 8 }
      ]),
      // Recently popular packages (most booked)
      Package.find({ status: 'ACTIVE' })
        .sort({ reviewCount: -1, rating: -1 })
        .limit(6)
        .select('title destination price duration imageUrl rating reviewCount')
        .lean()
    ]);

    res.json({
      trending: {
        destinations: topDestinations,
        popularPackages: recentPopular
      }
    });
  } catch (err) {
    console.error('Trending error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
