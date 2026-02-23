require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
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
const { startPayoutJob } = require('./jobs/payoutJob');
const adminRoutes = require('./routes/adminRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const customTripRoutes = require('./routes/customTripRoutes');
const homeRoutes = require('./routes/homeRoutes');

const app = express();
const PORT = process.env.PORT || 4000;
const uploadsDir = path.join(__dirname, 'uploads');

fs.mkdirSync(uploadsDir, { recursive: true });

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET is not set in environment variables');
  process.exit(1);
}

if (!process.env.MONGO_URI) {
  console.error('ERROR: MONGO_URI is not set in environment variables');
  process.exit(1);
}

connectDB();

// Configure CORS before other middleware
app.use(cors({ 
  origin: process.env.CLIENT_ORIGIN || ['http://localhost:5173', 'http://127.0.0.1:5173'], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie']
}));

// Handle preflight requests
app.options('*', cors());

app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
  crossOriginEmbedderPolicy: false,
  // Allow image resources to be embedded when frontend and backend run on different origins.
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(requestLogger);
app.use(rateLimiter);
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(uploadsDir));

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

app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Start scheduled jobs (only in non-test environments)
if (process.env.NODE_ENV !== 'test') {
  startPayoutJob();
}
