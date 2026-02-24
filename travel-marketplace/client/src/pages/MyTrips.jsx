import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, mediaUrl } from '../utils/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

const statusClass = {
  PENDING_PAYMENT: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-slate-200 text-slate-600',
  DISPUTED: 'bg-rose-100 text-rose-700'
};

function getBookingAmount(booking, rawAmount) {
  const amount = Number(rawAmount || 0);
  const peopleCount = Number(booking?.numberOfPeople || 1);
  if (booking?.amountMode === 'TOTAL') return amount;
  return Number((amount * (peopleCount > 0 ? peopleCount : 1)).toFixed(2));
}

export default function MyTrips() {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
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
      
      // Load reviews to check which bookings have been reviewed
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

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 animate-fade-in">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-8 text-white shadow-xl animate-slide-down">
        <div className="absolute -right-12 -top-12 h-64 w-64 animate-float rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <h1 className="font-display text-4xl font-bold sm:text-5xl">My Trips</h1>
          <p className="mt-3 text-base text-slate-200 sm:text-lg">Track booking status, view payment progress, and manage cancellations.</p>
        </div>
      </section>

      {loading ? (
        <p className="text-sm text-slate-500">Loading trips...</p>
      ) : error ? (
        <p className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p>
      ) : bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <svg className="mx-auto h-16 w-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mt-4 text-lg font-semibold text-slate-900">No bookings yet</p>
          <p className="mt-2 text-sm text-slate-600">Start exploring packages and book your first trip!</p>
          <Link
            to="/app/packages"
            className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-slate-800 hover:to-slate-600"
          >
            Explore Packages
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {bookings.map((booking, index) => (
            <article key={booking._id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="relative h-32 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 overflow-hidden">
                {booking.packageId?.imageUrl ? (
                  <img 
                    src={mediaUrl(booking.packageId.imageUrl)} 
                    alt={booking.packageId?.title || 'Travel Package'}
                    className="h-full w-full object-cover"
                  />
                ) : null}
                <div className="absolute top-3 right-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${statusClass[booking.status] || 'bg-slate-100 text-slate-700'}`}>
                    {booking.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <h2 className="font-display text-lg font-bold text-white line-clamp-1">
                    {booking.packageId?.title || 'Travel Package'}
                  </h2>
                </div>
              </div>

              <div className="p-5">
                <div className="mb-4 flex items-center gap-2 text-sm text-slate-600">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{booking.packageId?.destination || 'Destination not available'}</span>
                </div>

                <div className="mb-4 rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-500">Travel Date</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {new Date(booking.travelDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">People</p>
                    <p className="mt-1 font-semibold text-slate-900">{booking.numberOfPeople}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Base Price</p>
                    <p className="mt-1 font-semibold text-slate-900">₹{getBookingAmount(booking, booking.basePrice).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Discount</p>
                    <p className="mt-1 font-semibold text-emerald-600">₹{getBookingAmount(booking, booking.discountApplied).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Final Amount</p>
                    <p className="mt-1 font-semibold text-slate-900">₹{getBookingAmount(booking, booking.finalAmount).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/app/booking/result/${booking._id}`}
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    View Details
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
                      className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {busyId === booking._id ? 'Confirming...' : 'Confirm'}
                    </button>
                  )}

                  {(booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') && !reviewedBookings.has(booking.packageId._id) && (
                    <button
                      type="button"
                      disabled={busyId === booking._id}
                      onClick={() => openReviewModal(booking)}
                      className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                    >
                      Write Review
                    </button>
                  )}

                  {reviewedBookings.has(booking.packageId._id) && (
                    <div className="flex-1 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 text-center">
                      ✓ Reviewed
                    </div>
                  )}

                  {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                    <button
                      type="button"
                      disabled={busyId === booking._id}
                      onClick={() => handleCancel(booking._id)}
                      className="flex-1 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-rose-700 hover:to-rose-800 disabled:opacity-50"
                    >
                      {busyId === booking._id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)} title="Write a Review">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setReviewRating(rating)}
                  className={`rounded-lg p-2 ${
                    rating <= reviewRating ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Comment</label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-cyan-300 focus:ring-2"
              placeholder="Share your experience..."
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={submitReview}
              disabled={busyId === selectedBooking?._id}
              className="flex-1 rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:from-slate-800 hover:to-slate-600 hover:scale-105 disabled:opacity-50"
            >
              {busyId === selectedBooking?._id ? 'Submitting...' : 'Submit Review'}
            </button>
            <button
              onClick={() => setShowReviewModal(false)}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
