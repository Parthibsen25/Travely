import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../utils/api';

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function fetchBookings() {
    setLoading(true);
    setError('');

    try {
      const data = await apiFetch('/api/admin/bookings');
      setBookings(data.bookings || []);
    } catch (err) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBookings();
  }, []);

  async function manageDispute(id, action) {
    try {
      await apiFetch(`/api/admin/bookings/${id}/dispute`, {
        method: 'POST',
        body: JSON.stringify({ action })
      });
      await fetchBookings();
    } catch (err) {
      window.alert(err.message || 'Action failed');
    }
  }

  return (
    <div className="space-y-6 animate-page-enter">
      <header className="animate-slide-down">
        <h1 className="font-display text-3xl font-bold text-slate-900">Booking Operations</h1>
        <p className="mt-1 text-sm text-slate-600">Review marketplace bookings and manage dispute states.</p>
      </header>

      {loading ? (
        <p className="text-sm text-slate-500">Loading bookings...</p>
      ) : error ? (
        <p className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p>
      ) : bookings.length === 0 ? (
        <p className="rounded-xl bg-slate-100 p-4 text-sm text-slate-600">No bookings available.</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking, index) => (
            <article
              key={booking._id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-900">Booking #{booking._id}</h2>
                  <p className="text-sm text-slate-600">
                    User: {booking.userId?.name || booking.userId?.email || 'Unknown'}
                  </p>
                  <p className="text-sm text-slate-600">
                    Package: {booking.packageId?.title || booking.packageId || 'Unknown'}
                  </p>
                  <p className="text-sm text-slate-500">
                    Travel: {new Date(booking.travelDate).toLocaleDateString()} | Status: {booking.status}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {booking.status !== 'DISPUTED' ? (
                    <button
                      type="button"
                      onClick={() => manageDispute(booking._id, 'mark')}
                      className="rounded-lg bg-gradient-to-r from-rose-600 to-rose-700 px-3 py-2 text-xs font-semibold text-white shadow-md transition-all duration-300 hover:from-rose-700 hover:to-rose-800 hover:scale-105"
                    >
                      Mark Disputed
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => manageDispute(booking._id, 'resolve')}
                      className="rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 px-3 py-2 text-xs font-semibold text-white shadow-md transition-all duration-300 hover:from-emerald-700 hover:to-emerald-800 hover:scale-105"
                    >
                      Resolve Dispute
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
