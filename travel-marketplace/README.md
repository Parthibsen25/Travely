# Travely - Travel Marketplace & Budget App

A full-stack travel marketplace application built with Node.js, Express, MongoDB, and React. Features role-based access control for Users, Agencies, and Admins.

## Features

### ✨ User Features
- Browse and search travel packages
- Advanced filtering by category, price range, and destination
- Package details with reviews and ratings
- Wishlist functionality
- Book travel packages
- Track bookings and trip status
- Cancel bookings with refund calculation
- Review packages after booking

### 🏢 Agency Features
- Create and manage travel packages
- Set cancellation policies
- Add offers and discounts
- Track package performance
- View payouts

### 👨‍💼 Admin Features
- Manage agencies and users
- View all bookings
- Analytics dashboard
- Handle disputes

## Tech Stack

### Frontend
- React 18
- React Router DOM
- Tailwind CSS
- Vite
- PWA Support

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Cookie-based sessions
- Winston Logger

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
cd travel-marketplace
```

2. **Install server dependencies**
```bash
cd server
npm install
```

3. **Install client dependencies**
```bash
cd ../client
npm install
```

4. **Set up environment variables**

Create a `.env` file in the `server` directory:
```env
PORT=4000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

5. **Start the development servers**

Terminal 1 - Backend:
```bash
cd server
npm run server
```

Terminal 2 - Frontend:
```bash
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

## Project Structure

```
travel-marketplace/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── layouts/       # Layout components
│   │   ├── context/       # React context
│   │   ├── routes/        # Route guards
│   │   └── utils/         # Utility functions
│   └── package.json
│
└── server/                 # Node.js backend
    ├── config/            # Database config
    ├── controllers/       # Route controllers
    ├── middleware/        # Express middleware
    ├── models/            # Mongoose models
    ├── routes/            # API routes
    ├── services/          # Business logic
    ├── jobs/              # Scheduled jobs
    └── index.js           # Entry point
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/agency-register` - Agency registration
- `POST /api/auth/agency-login` - Agency login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Packages
- `GET /api/packages` - List packages (public)
- `GET /api/packages/:id` - Get package details
- `GET /api/packages/my` - Get agency's packages (protected)
- `POST /api/packages` - Create package (agency)
- `PUT /api/packages/:id` - Update package (agency)
- `DELETE /api/packages/:id` - Delete package (agency)

### Bookings
- `POST /api/bookings` - Create booking (user)
- `GET /api/bookings/my` - Get user bookings
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings/:id/cancel` - Cancel booking

### Reviews
- `POST /api/reviews` - Create review (user)
- `GET /api/reviews/package/:packageId` - Get package reviews
- `GET /api/reviews/my` - Get user's reviews

### Wishlist
- `POST /api/wishlist` - Add to wishlist
- `DELETE /api/wishlist/:packageId` - Remove from wishlist
- `GET /api/wishlist/my` - Get user's wishlist
- `GET /api/wishlist/check` - Check wishlist status

## Default Roles

- **USER**: Regular travelers who can book packages
- **AGENCY**: Travel agencies who create packages
- **ADMIN**: Platform administrators

## Features Implemented

✅ Modern, responsive UI with Tailwind CSS
✅ Advanced package search and filtering
✅ Package reviews and ratings system
✅ Wishlist functionality
✅ Enhanced booking flow
✅ Real-time booking status updates
✅ Cancellation with refund calculation
✅ Role-based access control
✅ Error handling and validation
✅ Loading states and animations
✅ Production-ready code structure

## Development Notes

- The app uses cookie-based authentication
- CORS is configured for development
- Payment integration is currently disabled (Razorpay commented out)
- MongoDB connection is required for the app to run
- All API routes are prefixed with `/api`

## License

MIT
