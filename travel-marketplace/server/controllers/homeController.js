const Package = require('../models/Package');
const Booking = require('../models/Booking');
const CustomTrip = require('../models/CustomTrip');

function highestOfferPercent(pkg) {
  if (!pkg?.offers?.length) return 0;
  return pkg.offers.reduce((maxPercent, offer) => {
    const value = Number(offer?.discountPercent || 0);
    return value > maxPercent ? value : maxPercent;
  }, 0);
}

exports.getHomeSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const [packages, upcomingBooking, latestTrip, popularDestinations] = await Promise.all([
      Package.find({ status: 'ACTIVE' })
        .select('title destination price duration imageUrl offers rating reviewCount category themes')
        .lean(),
      Booking.findOne({ userId, status: 'CONFIRMED', travelDate: { $gte: now } })
        .sort({ travelDate: 1 })
        .populate('packageId', 'title destination imageUrl duration')
        .lean(),
      CustomTrip.findOne({ userId, status: { $in: ['PLANNING', 'CONFIRMED'] } })
        .sort({ updatedAt: -1 })
        .lean(),
      Package.aggregate([
        { $match: { status: 'ACTIVE', destination: { $exists: true, $ne: '' } } },
        {
          $group: {
            _id: '$destination',
            count: { $sum: 1 },
            imageUrl: { $first: '$imageUrl' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 8 }
      ])
    ]);

    const withOfferMeta = packages.map((pkg) => ({
      ...pkg,
      offerPercent: highestOfferPercent(pkg)
    }));

    const featuredDeal = [...withOfferMeta]
      .sort((a, b) => (b.offerPercent - a.offerPercent) || ((b.rating || 0) - (a.rating || 0)))[0] || null;

    const trendingDeals = [...withOfferMeta]
      .sort((a, b) => ((b.rating || 0) - (a.rating || 0)) || ((b.reviewCount || 0) - (a.reviewCount || 0)))
      .slice(0, 10);

    const topOffers = withOfferMeta
      .filter((pkg) => pkg.offerPercent > 0)
      .sort((a, b) => b.offerPercent - a.offerPercent)
      .slice(0, 2)
      .map((pkg) => ({
        ...pkg,
        topOffer: (pkg.offers || []).find((offer) => Number(offer?.discountPercent || 0) === pkg.offerPercent) || null
      }));

    const curatedCategories = [
      { label: 'Adventure', value: 'adventure' },
      { label: 'Romantic', value: 'romantic' },
      { label: 'Cultural', value: 'cultural' },
      { label: 'Relaxation', value: 'relaxation' },
      { label: 'Budget', value: 'budget' }
    ];

    res.json({
      featuredDeal,
      trendingDeals,
      topOffers,
      curatedCategories,
      popularDestinations: popularDestinations.map((item) => ({
        name: item._id,
        imageUrl: item.imageUrl,
        count: item.count
      })),
      upcomingBooking,
      latestTrip
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
