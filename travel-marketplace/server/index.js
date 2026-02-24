const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const packageRoutes = require('./routes/packageRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const rateLimiter = require('./middleware/rateLimiter');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const payoutRoutes = require('./routes/payoutRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const customTripRoutes = require('./routes/customTripRoutes');
const homeRoutes = require('./routes/homeRoutes');
const couponRoutes = require('./routes/couponRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const packageRequestRoutes = require('./routes/packageRequestRoutes');
const cartRoutes = require('./routes/cartRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

// Validate required environment variables (warn instead of crash for serverless)
if (!process.env.JWT_SECRET) {
  console.error('WARNING: JWT_SECRET is not set in environment variables');
}
if (!process.env.MONGO_URI) {
  console.error('WARNING: MONGO_URI is not set in environment variables');
}

// Configure CORS first — preflight requests must not need DB
const corsOptions = {
  origin: process.env.CLIENT_ORIGIN
    ? process.env.CLIENT_ORIGIN.split(',').map((s) => s.trim())
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(requestLogger);
app.use(rateLimiter);
app.use(express.json());
app.use(cookieParser());

// Ensure DB is connected before each request (serverless-safe)
let dbConnected = false;
app.use(async (req, res, next) => {
  try {
    if (!dbConnected) {
      await connectDB();
      dbConnected = true;
    }
    next();
  } catch (err) {
    console.error('DB connection middleware error:', err.message);
    res.status(503).json({ message: 'Database connection failed. Please try again.' });
  }
});

app.get('/', (req, res) => res.json({ status: 'ok', message: 'Travely API is running' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/bookings', bookingRoutes);

// Razorpay webhook - use raw body for signature verification
// Razorpay webhook disabled until payment provider is configured.
// app.post('/api/payments/razorpay-webhook', express.raw({ type: 'application/json' }), paymentController.razorpayWebhook);

app.use('/api/payouts', payoutRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/custom-trips', customTripRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/package-requests', packageRequestRoutes);
app.use('/api/cart', cartRoutes);

app.use(errorHandler);

// Export for Vercel serverless deployment
module.exports = app;

// Only listen when running directly (not on Vercel)
if (!process.env.VERCEL) {
  // Connect DB eagerly when running as a long-lived server
  connectDB().catch((err) => {
    console.error('Initial DB connection failed:', err.message);
    process.exit(1);
  });

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

  // Start scheduled jobs (only in non-test/non-serverless environments)
  if (process.env.NODE_ENV !== 'test') {
    const { startPayoutJob } = require('./jobs/payoutJob');
    startPayoutJob();
  }
}
