const Booking = require('../models/Booking');
const Package = require('../models/Package');
const Review = require('../models/Review');
const Wishlist = require('../models/Wishlist');
const CustomTrip = require('../models/CustomTrip');

// GET /api/analytics/user — comprehensive user travel analytics
exports.getUserAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    const [bookings, reviews, wishlist, trips] = await Promise.all([
      Booking.find({ userId }).populate('packageId', 'title destination category price duration themes imageUrl cities').lean(),
      Review.find({ userId }).lean(),
      Wishlist.find({ userId }).lean(),
      CustomTrip.find({ userId }).lean()
    ]);

    // === Trip Stats ===
    const completedBookings = bookings.filter((b) => b.status === 'COMPLETED');
    const confirmedBookings = bookings.filter((b) => b.status === 'CONFIRMED');
    const cancelledBookings = bookings.filter((b) => b.status === 'CANCELLED');
    const totalSpent = bookings
      .filter((b) => ['PAID', 'CONFIRMED', 'COMPLETED'].includes(b.status))
      .reduce((sum, b) => sum + (b.finalAmount || 0), 0);
    const avgTripCost = completedBookings.length > 0
      ? totalSpent / completedBookings.length
      : 0;

    // === Destinations Visited ===
    const destinationsVisited = [...new Set(
      completedBookings
        .map((b) => b.packageId?.destination)
        .filter(Boolean)
    )];

    // === Cities Visited ===
    const citiesVisited = [...new Set(
      completedBookings
        .flatMap((b) => b.packageId?.cities || [])
        .filter(Boolean)
    )];

    // === Category Breakdown ===
    const categoryCount = {};
    bookings.forEach((b) => {
      const cat = b.packageId?.category;
      if (cat) categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });
    const favoriteCategory = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // === Theme Preferences ===
    const themeCount = {};
    bookings.forEach((b) => {
      (b.packageId?.themes || []).forEach((t) => {
        themeCount[t] = (themeCount[t] || 0) + 1;
      });
    });
    const topThemes = Object.entries(themeCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([theme, count]) => ({ theme, count }));

    // === Monthly Spending (last 12 months) ===
    const monthlySpending = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthBookings = bookings.filter((b) => {
        const d = new Date(b.createdAt);
        return d >= monthStart && d <= monthEnd && ['PAID', 'CONFIRMED', 'COMPLETED'].includes(b.status);
      });
      monthlySpending.push({
        month: monthStart.toLocaleString('en', { month: 'short' }),
        year: monthStart.getFullYear(),
        amount: monthBookings.reduce((s, b) => s + (b.finalAmount || 0), 0),
        trips: monthBookings.length
      });
    }

    // === Travel Personality ===
    let travelPersonality = 'Explorer';
    if (completedBookings.length >= 10) travelPersonality = 'Globetrotter';
    else if (completedBookings.length >= 5) travelPersonality = 'Wanderer';
    else if (favoriteCategory === 'adventure') travelPersonality = 'Thrill Seeker';
    else if (favoriteCategory === 'relaxation') travelPersonality = 'Zen Traveler';
    else if (favoriteCategory === 'cultural') travelPersonality = 'Culture Enthusiast';
    else if (favoriteCategory === 'romantic') travelPersonality = 'Romantic Soul';
    else if (favoriteCategory === 'budget') travelPersonality = 'Smart Traveler';

    // === Upcoming Trips ===
    const upcomingTrips = bookings
      .filter((b) => ['CONFIRMED', 'PAID'].includes(b.status) && new Date(b.travelDate) > now)
      .sort((a, b) => new Date(a.travelDate) - new Date(b.travelDate))
      .slice(0, 5)
      .map((b) => ({
        bookingId: b._id,
        packageTitle: b.packageId?.title,
        destination: b.packageId?.destination,
        travelDate: b.travelDate,
        amount: b.finalAmount,
        daysUntil: Math.ceil((new Date(b.travelDate) - now) / (1000 * 60 * 60 * 24))
      }));

    // === Total days traveled (approx) ===
    const totalDaysTraveled = completedBookings.reduce((s, b) => s + (b.packageId?.duration || 0), 0);

    // === Achievements / Milestones ===
    const achievements = [];
    if (completedBookings.length >= 1) achievements.push({ id: 'first_trip', label: 'First Trip', icon: '🎒', unlocked: true });
    else achievements.push({ id: 'first_trip', label: 'First Trip', icon: '🎒', unlocked: false });

    if (destinationsVisited.length >= 5) achievements.push({ id: 'explorer', label: '5 Destinations', icon: '🗺️', unlocked: true });
    else achievements.push({ id: 'explorer', label: '5 Destinations', icon: '🗺️', unlocked: false, progress: `${destinationsVisited.length}/5` });

    if (reviews.length >= 3) achievements.push({ id: 'reviewer', label: 'Active Reviewer', icon: '⭐', unlocked: true });
    else achievements.push({ id: 'reviewer', label: 'Active Reviewer', icon: '⭐', unlocked: false, progress: `${reviews.length}/3` });

    if (totalSpent >= 100000) achievements.push({ id: 'big_spender', label: 'Premium Traveler (₹1L+)', icon: '💎', unlocked: true });
    else achievements.push({ id: 'big_spender', label: 'Premium Traveler (₹1L+)', icon: '💎', unlocked: false, progress: `₹${totalSpent.toLocaleString()}/₹1,00,000` });

    if (totalDaysTraveled >= 30) achievements.push({ id: 'nomad', label: '30 Days Traveled', icon: '🌍', unlocked: true });
    else achievements.push({ id: 'nomad', label: '30 Days Traveled', icon: '🌍', unlocked: false, progress: `${totalDaysTraveled}/30 days` });

    if (completedBookings.length >= 10) achievements.push({ id: 'veteran', label: '10 Trips', icon: '🏆', unlocked: true });
    else achievements.push({ id: 'veteran', label: '10 Trips', icon: '🏆', unlocked: false, progress: `${completedBookings.length}/10` });

    res.json({
      overview: {
        totalTrips: completedBookings.length,
        confirmedTrips: confirmedBookings.length,
        cancelledTrips: cancelledBookings.length,
        totalBookings: bookings.length,
        totalSpent,
        avgTripCost: Math.round(avgTripCost),
        totalDaysTraveled,
        destinationsVisited: destinationsVisited.length,
        citiesVisited: citiesVisited.length,
        reviewsWritten: reviews.length,
        wishlistItems: wishlist.length,
        plannedTrips: trips.length,
        travelPersonality
      },
      destinations: destinationsVisited,
      cities: citiesVisited,
      categoryBreakdown: Object.entries(categoryCount).map(([name, count]) => ({ name, count })),
      topThemes,
      monthlySpending,
      upcomingTrips,
      achievements
    });
  } catch (err) {
    console.error('User analytics error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
