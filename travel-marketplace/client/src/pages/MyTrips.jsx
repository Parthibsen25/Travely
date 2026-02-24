import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, mediaUrl } from '../utils/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

const STATUS_CONFIG = {
  PENDING_PAYMENT: {
    label: 'Pending Payment',
    class: 'bg-amber-50 text-amber-700 border border-amber-200',
    dot: 'bg-amber-500',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  CONFIRMED: {
    label: 'Confirmed',
    class: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    dot: 'bg-emerald-500',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  COMPLETED: {
    label: 'Completed',
    class: 'bg-sky-50 text-sky-700 border border-sky-200',
    dot: 'bg-sky-500',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  CANCELLED: {
    label: 'Cancelled',
    class: 'bg-slate-50 text-slate-500 border border-slate-200',
    dot: 'bg-slate-400',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  REFUNDED: {
    label: 'Refunded',
    class: 'bg-violet-50 text-violet-700 border border-violet-200',
    dot: 'bg-violet-500',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
      </svg>
    ),
  },
  DISPUTED: {
    label: 'Disputed',
    class: 'bg-rose-50 text-rose-700 border border-rose-200',
    dot: 'bg-rose-500',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

const FILTER_TABS = [
  { key: 'ALL', label: 'All Trips' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PENDING_PAYMENT', label: 'Pending' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

function getBookingAmount(booking, rawAmount) {
  const amount = Number(rawAmount || 0);
  const peopleCount = Number(booking?.numberOfPeople || 1);
  if (booking?.amountMode === 'TOTAL') return amount;
  return Number((amount * (peopleCount > 0 ? peopleCount : 1)).toFixed(2));
}

function daysUntilTrip(dateStr) {
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function MyTrips() {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [filterTab, setFilterTab] = useState('ALL');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewedBookings, setReviewedBookings] = useState(new Set());

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/bookings/my');
      setBookings(data.bookings || []);
      const reviews = await apiFetch('/api/reviews/my');
      const reviewedPackageIds = new Set(reviews.reviews?.map(r => r.packageId?._id) || []);
      setReviewedBookings(reviewedPackageIds);
    } catch (err) {
      setError(err.message || 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const stats = useMemo(() => {
    const total = bookings.length;
    const confirmed = bookings.filter(b => b.status === 'CONFIRMED').length;
    const pending = bookings.filter(b => b.status === 'PENDING_PAYMENT').length;
    const completed = bookings.filter(b => b.status === 'COMPLETED').length;
    const cancelled = bookings.filter(b => b.status === 'CANCELLED').length;
    const totalSpent = bookings
      .filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
      .reduce((sum, b) => sum + getBookingAmount(b, b.finalAmount), 0);
    return { total, confirmed, pending, completed, cancelled, totalSpent };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    if (filterTab === 'ALL') return bookings;
    return bookings.filter(b => b.status === filterTab);
  }, [bookings, filterTab]);

  async function handleCancel(bookingId) {
    const ok = window.confirm('Cancel this booking?');
    if (!ok) return;
    setBusyId(bookingId);
    try {
      const data = await apiFetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({})
      });
      showToast(data.message || 'Booking cancelled.', 'success');
      await fetchBookings();
    } catch (err) {
      showToast(err.message || 'Failed to cancel booking', 'error');
    } finally {
      setBusyId('');
    }
  }

  async function submitReview() {
    if (!selectedBooking) return;
    setBusyId(selectedBooking._id);
    try {
      await apiFetch('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          packageId: selectedBooking.packageId._id,
          bookingId: selectedBooking._id,
          rating: reviewRating,
          comment: reviewComment
        })
      });
      showToast('Review submitted successfully!', 'success');
      setShowReviewModal(false);
      setReviewComment('');
      setReviewRating(5);
      setSelectedBooking(null);
      const newReviewedSet = new Set(reviewedBookings);
      newReviewedSet.add(selectedBooking.packageId._id);
      setReviewedBookings(newReviewedSet);
    } catch (err) {
      showToast(err.message || 'Failed to submit review', 'error');
    } finally {
      setBusyId('');
    }
  }

  function openReviewModal(booking) {
    setSelectedBooking(booking);
    setReviewRating(5);
    setReviewComment('');
    setShowReviewModal(true);
  }

  /* ──────────── Skeleton Loader ──────────── */
  function SkeletonCard() {
    return (
      <div className="animate-pulse rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="h-44 bg-slate-200" />
        <div className="p-5 space-y-3">
          <div className="h-4 w-3/4 rounded bg-slate-200" />
          <div className="h-3 w-1/2 rounded bg-slate-200" />
          <div className="flex gap-3 mt-4">
            <div className="h-10 flex-1 rounded-xl bg-slate-200" />
            <div className="h-10 flex-1 rounded-xl bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">

        {/* ════════ Hero Header ════════ */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 p-8 sm:p-10 text-white shadow-2xl animate-slide-down mb-8">
          <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/10 blur-3xl animate-float" />
          <div className="absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-gradient-to-tr from-purple-500/15 to-pink-400/10 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-cyan-200 backdrop-blur-sm border border-white/10">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Travel Dashboard
              </div>
              <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">My Trips</h1>
              <p className="mt-3 max-w-lg text-base text-blue-100/80 sm:text-lg">Manage your bookings, track upcoming adventures, and relive past experiences.</p>
            </div>
            <Link
              to="/app/packages"
              className="group inline-flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm border border-white/20 transition-all hover:bg-white/20 hover:scale-[1.02] shrink-0"
            >
              <svg className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Book New Trip
            </Link>
          </div>
        </section>

        {/* ════════ Stats Row ════════ */}
        {!loading && bookings.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8 animate-scale-in">
            {[
              { label: 'Total Trips', value: stats.total, color: 'from-slate-500 to-slate-700', icon: '✈️' },
              { label: 'Confirmed', value: stats.confirmed, color: 'from-emerald-500 to-emerald-700', icon: '✅' },
              { label: 'Upcoming', value: stats.pending, color: 'from-amber-500 to-amber-700', icon: '⏳' },
              { label: 'Total Spent', value: `₹${stats.totalSpent.toLocaleString()}`, color: 'from-blue-500 to-blue-700', icon: '💰' },
            ].map((stat) => (
              <div key={stat.label} className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                <div className={`absolute top-0 left-0 h-1 w-full bg-gradient-to-r ${stat.color}`} />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
                    <p className="mt-1.5 text-2xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                  <span className="text-2xl opacity-60 group-hover:scale-110 transition-transform">{stat.icon}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ════════ Filter Tabs ════════ */}
        {!loading && bookings.length > 0 && (
          <div className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-hide animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {FILTER_TABS.map(tab => {
              const count = tab.key === 'ALL' ? bookings.length : bookings.filter(b => b.status === tab.key).length;
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilterTab(tab.key)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                    filterTab === tab.key
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                    filterTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ════════ Content ════════ */}
        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-red-50 border border-red-100 p-8 text-center animate-scale-in">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-sm font-medium text-red-700">{error}</p>
            <button onClick={fetchBookings} className="mt-4 rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 transition">Retry</button>
          </div>
        ) : bookings.length === 0 ? (
          /* ── Empty State ── */
          <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-slate-200 bg-white p-16 text-center animate-scale-in">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50" />
            <div className="relative">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-cyan-100">
                <svg className="h-12 w-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Your adventure starts here</h2>
              <p className="mt-3 text-base text-slate-500 max-w-md mx-auto">
                Discover amazing travel packages and create memories that last a lifetime. Your booked trips will appear here.
              </p>
              <Link
                to="/app/packages"
                className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-700 px-8 py-3.5 text-sm font-semibold text-white shadow-xl transition-all hover:from-slate-800 hover:to-slate-600 hover:scale-105 hover:shadow-2xl"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                Explore Packages
              </Link>
            </div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-12 text-center animate-scale-in">
            <p className="text-sm text-slate-500">No trips found in this category.</p>
            <button onClick={() => setFilterTab('ALL')} className="mt-3 text-sm font-semibold text-blue-600 hover:underline">View all trips</button>
          </div>
        ) : (
          /* ── Booking Cards Grid ── */
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredBookings.map((booking, index) => {
              const sConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_PAYMENT;
              const days = daysUntilTrip(booking.travelDate);
              const isUpcoming = days > 0 && (booking.status === 'CONFIRMED' || booking.status === 'PENDING_PAYMENT');
              const isCancelled = booking.status === 'CANCELLED';
              const hasReview = reviewedBookings.has(booking.packageId?._id);
              const canReview = (booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') && !hasReview;

              return (
                <article
                  key={booking._id}
                  className={`group relative overflow-hidden rounded-2xl bg-white border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-scale-in ${
                    isCancelled ? 'border-slate-200/60 opacity-75 hover:opacity-100' : 'border-slate-200 shadow-sm'
                  }`}
                  style={{ animationDelay: `${index * 0.07}s` }}
                >
                  {/* Card Image */}
                  <div className="relative h-44 overflow-hidden bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600">
                    {booking.packageId?.imageUrl ? (
                      <img
                        src={mediaUrl(booking.packageId.imageUrl)}
                        alt={booking.packageId?.title || 'Travel Package'}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="h-16 w-16 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                    )}

                    {/* Dark overlay for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Status Badge — top left */}
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md ${sConfig.class}`}>
                        {sConfig.icon}
                        {sConfig.label}
                      </span>
                    </div>

                    {/* Countdown badge — top right */}
                    {isUpcoming && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-slate-800 shadow-sm">
                          <svg className="h-3 w-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3" /></svg>
                          {days === 1 ? 'Tomorrow' : `${days} days`}
                        </span>
                      </div>
                    )}

                    {/* Package Title — bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h2 className="font-display text-lg font-bold text-white leading-tight line-clamp-1 drop-shadow-md">
                        {booking.packageId?.title || 'Travel Package'}
                      </h2>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-white/80">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {booking.packageId?.destination || 'Destination'}
                        {booking.packageId?.duration && (
                          <>
                            <span className="mx-1 text-white/40">·</span>
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {booking.packageId.duration} days
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-5 space-y-4">

                    {/* Travel date & people row */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Travel Date</p>
                          <p className="text-sm font-semibold text-slate-900">
                            {new Date(booking.travelDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Travelers</p>
                          <p className="text-sm font-semibold text-slate-900">{booking.numberOfPeople}</p>
                        </div>
                      </div>
                    </div>

                    {/* Price section */}
                    <div className="rounded-xl bg-gradient-to-r from-slate-50 to-slate-100/80 p-3.5 border border-slate-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-500">Amount Paid</p>
                          <p className="text-xl font-bold text-slate-900">₹{getBookingAmount(booking, booking.finalAmount).toLocaleString()}</p>
                        </div>
                        {getBookingAmount(booking, booking.discountApplied) > 0 && (
                          <div className="text-right">
                            <p className="text-xs text-slate-500 line-through">₹{getBookingAmount(booking, booking.basePrice).toLocaleString()}</p>
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                              ₹{getBookingAmount(booking, booking.discountApplied).toLocaleString()} saved
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Reviewed badge inline */}
                    {hasReview && (booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') && (
                      <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-100 px-3.5 py-2.5">
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                          ))}
                        </div>
                        <span className="text-xs font-semibold text-amber-700">Review Submitted</span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Link
                        to={`/app/booking/result/${booking._id}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        Details
                      </Link>

                      {booking.status === 'PENDING_PAYMENT' && (
                        <button
                          type="button"
                          disabled={busyId === booking._id}
                          onClick={async () => {
                            setBusyId(booking._id);
                            try {
                              await apiFetch(`/api/bookings/${booking._id}/confirm`, { method: 'POST' });
                              showToast('Booking confirmed!', 'success');
                              await fetchBookings();
                            } catch (err) {
                              showToast(err.message || 'Failed to confirm', 'error');
                            } finally {
                              setBusyId('');
                            }
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md disabled:opacity-50"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          {busyId === booking._id ? 'Confirming...' : 'Confirm'}
                        </button>
                      )}

                      {canReview && (
                        <button
                          type="button"
                          disabled={busyId === booking._id}
                          onClick={() => openReviewModal(booking)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-md disabled:opacity-50"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                          Write Review
                        </button>
                      )}

                      {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                        <button
                          type="button"
                          disabled={busyId === booking._id}
                          onClick={() => handleCancel(booking._id)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600 transition-all hover:bg-rose-100 hover:border-rose-300 disabled:opacity-50"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          {busyId === booking._id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* ════════ Review Modal ════════ */}
      <Modal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)} title="">
        <div className="space-y-5">
          {/* Modal header with package info */}
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 border border-slate-100">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500">
              {selectedBooking?.packageId?.imageUrl && (
                <img src={mediaUrl(selectedBooking.packageId.imageUrl)} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 line-clamp-1">{selectedBooking?.packageId?.title || 'Travel Package'}</p>
              <p className="text-xs text-slate-500">{selectedBooking?.packageId?.destination}</p>
            </div>
          </div>

          {/* Star Rating */}
          <div>
            <label className="mb-2.5 block text-sm font-semibold text-slate-700">How would you rate your experience?</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setReviewRating(rating)}
                  className="group/star p-1 transition-transform hover:scale-125"
                >
                  <svg className={`h-8 w-8 transition-colors ${
                    rating <= reviewRating ? 'text-amber-400 drop-shadow-sm' : 'text-slate-200'
                  }`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
              <span className="ml-2 self-center text-sm font-semibold text-slate-600">
                {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][reviewRating]}
              </span>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Share your experience</label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-blue-300 focus:ring-2 focus:ring-blue-100 focus:bg-white placeholder:text-slate-400"
              placeholder="What did you enjoy most about this trip? Any tips for future travelers?"
              maxLength={1000}
            />
            <p className="mt-1 text-right text-xs text-slate-400">{reviewComment.length}/1000</p>
          </div>

          {/* Submit buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={submitReview}
              disabled={busyId === selectedBooking?._id}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:from-slate-800 hover:to-slate-600 hover:scale-[1.02] hover:shadow-xl disabled:opacity-50"
            >
              {busyId === selectedBooking?._id ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Submitting...
                </>
              ) : 'Submit Review'}
            </button>
            <button
              onClick={() => setShowReviewModal(false)}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
