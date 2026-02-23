import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { useToast } from '../context/ToastContext';

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

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/bookings/my');
      setBookings(data.bookings || []);
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
              <div className="relative h-32 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600">
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
    </div>
  );
}
