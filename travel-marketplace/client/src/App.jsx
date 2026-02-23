import React, { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Loading from './components/Loading';
import ProtectedRoute from './routes/ProtectedRoute';

import PublicLayout from './layouts/PublicLayout';
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';
import AgencyLayout from './layouts/AgencyLayout';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import AgencyLogin from './pages/AgencyLogin';
import AgencyRegister from './pages/AgencyRegister';

import UserDashboard from './pages/UserDashboard';
import Packages from './pages/Packages';
import PackageDetail from './pages/PackageDetail';
import Booking from './pages/Booking';
import BookingResult from './pages/BookingResult';
import MyTrips from './pages/MyTrips';
import SavedTrips from './pages/SavedTrips';
import Wishlist from './pages/Wishlist';
import Profile from './pages/Profile';
import PlanTrip from './pages/PlanTrip';

import AgencyDashboard from './pages/AgencyDashboard';
import AgencyPayouts from './pages/AgencyPayouts';

import NotFound from './pages/NotFound';

const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminAgencies = React.lazy(() => import('./pages/admin/AdminAgencies'));
const AdminBookings = React.lazy(() => import('./pages/admin/AdminBookings'));
const AdminAnalytics = React.lazy(() => import('./pages/admin/AdminAnalytics'));

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="admin/login" element={<AdminLogin />} />
        <Route path="agency/login" element={<AgencyLogin />} />
        <Route path="agency/register" element={<AgencyRegister />} />
      </Route>

      <Route element={<ProtectedRoute roles={['USER']} />}>
        <Route path="/app" element={<UserLayout />}>
          <Route index element={<UserDashboard />} />
          <Route path="packages" element={<Packages />} />
          <Route path="packages/:id" element={<PackageDetail />} />
          <Route path="booking" element={<Booking />} />
          <Route path="booking/result/:id" element={<BookingResult />} />
          <Route path="my-trips" element={<MyTrips />} />
          <Route path="saved-trips" element={<SavedTrips />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="profile" element={<Profile />} />
          <Route path="plan-trip" element={<PlanTrip />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['ADMIN']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route
            index
            element={
              <Suspense fallback={<Loading />}>
                <AdminDashboard />
              </Suspense>
            }
          />
          <Route
            path="agencies"
            element={
              <Suspense fallback={<Loading />}>
                <AdminAgencies />
              </Suspense>
            }
          />
          <Route
            path="bookings"
            element={
              <Suspense fallback={<Loading />}>
                <AdminBookings />
              </Suspense>
            }
          />
          <Route
            path="analytics"
            element={
              <Suspense fallback={<Loading />}>
                <AdminAnalytics />
              </Suspense>
            }
          />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['AGENCY']} />}>
        <Route path="/agency" element={<AgencyLayout />}>
          <Route index element={<Navigate to="/agency/dashboard" replace />} />
          <Route path="dashboard" element={<AgencyDashboard />} />
          <Route path="payouts" element={<AgencyPayouts />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
