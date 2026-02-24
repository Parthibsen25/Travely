import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../utils/api';
import { useToast } from '../context/ToastContext';
import Loading from '../components/Loading';
import Modal from '../components/Modal';

const STATUS_COLORS = {
  PENDING_PAYMENT: 'bg-amber-100 text-amber-700 border-amber-200',
  PAID: 'bg-blue-100 text-blue-700 border-blue-200',
  CONFIRMED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
  COMPLETED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  REFUND_INITIATED: 'bg-purple-100 text-purple-700 border-purple-200',
  REFUNDED: 'bg-slate-100 text-slate-700 border-slate-200',
  DISPUTED: 'bg-orange-100 text-orange-700 border-orange-200',
};

const STATUS_LABELS = {
  PENDING_PAYMENT: 'Pending Payment',
  PAID: 'Paid — Awaiting Confirmation',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
  REFUND_INITIATED: 'Refund Initiated',
  REFUNDED: 'Refunded',
  DISPUTED: 'Disputed',
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatCurrency(n) {
  if (n == null) return '—';
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

export default function AgencyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [sortKey, setSortKey] = useState('date-desc');
  const [busyId, setBusyId] = useState('');
  const { showToast } = useToast();

  const fetchBookings = useCallback(async () => {
    try {
      const data = await apiFetch('/api/bookings/agency');
      setBookings(data.bookings || []);
    } catch (err) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleConfirm = async (bookingId, e) => {
    e?.stopPropagation();
    setBusyId(bookingId);
    try {
      await apiFetch(`/api/bookings/${bookingId}/confirm`, { method: 'POST' });
      showToast('Booking confirmed!', 'success');
      await fetchBookings();
    } catch (err) {
      showToast(err.message || 'Failed to confirm booking', 'error');
    } finally {
      setBusyId('');
    }
  };

  const handleComplete = async (bookingId, e) => {
    e?.stopPropagation();
    setBusyId(bookingId);
    try {
      await apiFetch(`/api/bookings/${bookingId}/complete`, { method: 'POST' });
      showToast('Booking marked as completed!', 'success');
      await fetchBookings();
    } catch (err) {
      showToast(err.message || 'Failed to complete booking', 'error');
    } finally {
      setBusyId('');
    }
  };

  const stats = useMemo(() => {
    const total = bookings.length;
    const confirmed = bookings.filter((b) => b.status === 'CONFIRMED').length;
    const paid = bookings.filter((b) => b.status === 'PAID').length;
    const pending = bookings.filter((b) => b.status === 'PENDING_PAYMENT').length;
    const cancelled = bookings.filter((b) => b.status === 'CANCELLED').length;
    const totalRevenue = bookings
      .filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
      .reduce((sum, b) => sum + (b.finalAmount || 0), 0);
    return { total, confirmed, paid, pending, cancelled, totalRevenue };
  }, [bookings]);

  const filtered = useMemo(() => {
    let list = bookings;
    if (statusFilter !== 'ALL') {
      list = list.filter((b) => b.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (b) =>
          (b.packageId?.title || '').toLowerCase().includes(q) ||
          (b.packageId?.destination || '').toLowerCase().includes(q) ||
          (b.userId?.name || '').toLowerCase().includes(q) ||
          (b.userId?.email || '').toLowerCase().includes(q) ||
          (b._id || '').toLowerCase().includes(q)
      );
    }
    // sort
    list = [...list].sort((a, b) => {
      if (sortKey === 'date-desc') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortKey === 'date-asc') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortKey === 'amount-desc') return (b.finalAmount || 0) - (a.finalAmount || 0);
      if (sortKey === 'amount-asc') return (a.finalAmount || 0) - (b.finalAmount || 0);
      return 0;
    });
    return list;
  }, [bookings, statusFilter, searchQuery, sortKey]);

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="mx-auto max-w-4xl py-12 text-center">
        <p className="text-red-600 font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 animate-fade-in">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Bookings</h1>
          <p className="text-sm text-slate-500">Customer bookings for your packages</p>
        </div>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-6">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm text-center">
          <p className="text-sm font-medium text-slate-500">Total</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm text-center">
          <p className="text-sm font-medium text-blue-600">Paid</p>
          <p className="mt-1 text-2xl font-bold text-blue-700">{stats.paid}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm text-center">
          <p className="text-sm font-medium text-emerald-600">Confirmed</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{stats.confirmed}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm text-center">
          <p className="text-sm font-medium text-amber-600">Pending</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{stats.pending}</p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-5 shadow-sm text-center">
          <p className="text-sm font-medium text-red-600">Cancelled</p>
          <p className="mt-1 text-2xl font-bold text-red-700">{stats.cancelled}</p>
        </div>
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm text-center">
          <p className="text-sm font-medium text-indigo-600">Revenue</p>
          <p className="mt-1 text-2xl font-bold text-indigo-700">{formatCurrency(stats.totalRevenue)}</p>
        </div>
      </section>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by package, customer, or booking ID…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-[200px] rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING_PAYMENT">Pending Payment</option>
          <option value="PAID">Paid — Awaiting Confirmation</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="COMPLETED">Completed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
        >
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="amount-desc">Highest Amount</option>
          <option value="amount-asc">Lowest Amount</option>
        </select>
      </div>

      {/* Bookings List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="mt-4 text-lg font-semibold text-slate-700">No bookings found</p>
          <p className="mt-1 text-sm text-slate-500">
            {statusFilter !== 'ALL' || searchQuery ? 'Try adjusting your filters.' : 'Bookings will appear here when customers book your packages.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => (
            <div
              key={booking._id}
              onClick={() => setSelectedBooking(booking)}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm cursor-pointer transition hover:shadow-md hover:border-amber-200"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-900 truncate">
                    {booking.packageId?.title || 'Deleted Package'}
                  </h3>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[booking.status] || 'bg-slate-100 text-slate-600'}`}>
                    {STATUS_LABELS[booking.status] || booking.status}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    {booking.userId?.name || booking.userId?.email || 'Unknown'}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Travel: {formatDate(booking.travelDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {booking.numberOfPeople} {booking.numberOfPeople === 1 ? 'person' : 'people'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Booked on {formatDate(booking.createdAt)} &middot; ID: {booking._id?.slice(-8)}
                </p>
              </div>
              <div className="text-right shrink-0 flex flex-col items-end gap-2">
                <p className="text-lg font-bold text-slate-900">{formatCurrency(booking.finalAmount)}</p>
                {booking.discountApplied > 0 && (
                  <p className="text-xs text-emerald-600">Discount: {formatCurrency(booking.discountApplied)}</p>
                )}
                {booking.status === 'PAID' && (
                  <button
                    type="button"
                    disabled={busyId === booking._id}
                    onClick={(e) => handleConfirm(booking._id, e)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {busyId === booking._id ? 'Confirming…' : 'Confirm Booking'}
                  </button>
                )}
                {booking.status === 'CONFIRMED' && (
                  <button
                    type="button"
                    disabled={busyId === booking._id}
                    onClick={(e) => handleComplete(booking._id, e)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {busyId === booking._id ? 'Completing…' : 'Mark Complete'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Detail Modal */}
      <Modal isOpen={!!selectedBooking} onClose={() => setSelectedBooking(null)} title="Booking Details">
        {selectedBooking && (
          <div className="space-y-5 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Booking Details</h2>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_COLORS[selectedBooking.status] || 'bg-slate-100 text-slate-600'}`}>
                {STATUS_LABELS[selectedBooking.status] || selectedBooking.status}
              </span>
            </div>

            {/* Package Info */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Package</h3>
              <p className="mt-1 text-lg font-bold text-slate-900">{selectedBooking.packageId?.title || 'Deleted Package'}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                {selectedBooking.packageId?.destination && <span>📍 {selectedBooking.packageId.destination}</span>}
                {selectedBooking.packageId?.duration && <span>📅 {selectedBooking.packageId.duration} days</span>}
                {selectedBooking.packageId?.category && (
                  <span className="capitalize">🏷️ {selectedBooking.packageId.category}</span>
                )}
              </div>
            </div>

            {/* Customer Info */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Customer</h3>
              <p className="mt-1 font-semibold text-slate-900">{selectedBooking.userId?.name || 'Unknown'}</p>
              <p className="text-sm text-slate-600">{selectedBooking.userId?.email || '—'}</p>
            </div>

            {/* Booking Info */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Booking Info</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500">Booking ID</span>
                  <p className="font-mono font-semibold text-slate-900 text-xs mt-0.5">{selectedBooking._id}</p>
                </div>
                <div>
                  <span className="text-slate-500">Travel Date</span>
                  <p className="font-semibold text-slate-900 mt-0.5">{formatDate(selectedBooking.travelDate)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Travelers</span>
                  <p className="font-semibold text-slate-900 mt-0.5">{selectedBooking.numberOfPeople}</p>
                </div>
                <div>
                  <span className="text-slate-500">Booked On</span>
                  <p className="font-semibold text-slate-900 mt-0.5">{formatDate(selectedBooking.createdAt)}</p>
                </div>
                {selectedBooking.confirmedAt && (
                  <div>
                    <span className="text-slate-500">Confirmed At</span>
                    <p className="font-semibold text-emerald-700 mt-0.5">{formatDate(selectedBooking.confirmedAt)}</p>
                  </div>
                )}
                {selectedBooking.paidAt && (
                  <div>
                    <span className="text-slate-500">Paid At</span>
                    <p className="font-semibold text-blue-700 mt-0.5">{formatDate(selectedBooking.paidAt)}</p>
                  </div>
                )}
                {selectedBooking.completedAt && (
                  <div>
                    <span className="text-slate-500">Completed At</span>
                    <p className="font-semibold text-indigo-700 mt-0.5">{formatDate(selectedBooking.completedAt)}</p>
                  </div>
                )}
                {selectedBooking.cancelledAt && (
                  <div>
                    <span className="text-slate-500">Cancelled At</span>
                    <p className="font-semibold text-red-700 mt-0.5">{formatDate(selectedBooking.cancelledAt)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Info */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Payment</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Base Price</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(selectedBooking.basePrice)}</span>
                </div>
                {selectedBooking.discountApplied > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Discount</span>
                    <span className="font-semibold text-emerald-600">-{formatCurrency(selectedBooking.discountApplied)}</span>
                  </div>
                )}
                {selectedBooking.couponCode && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Coupon ({selectedBooking.couponCode})</span>
                    <span className="font-semibold text-emerald-600">-{formatCurrency(selectedBooking.couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2">
                  <span className="font-semibold text-slate-700">Total Amount</span>
                  <span className="text-lg font-bold text-slate-900">{formatCurrency(selectedBooking.finalAmount)}</span>
                </div>
                {selectedBooking.refundAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Refund Amount</span>
                    <span className="font-semibold text-purple-600">{formatCurrency(selectedBooking.refundAmount)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {selectedBooking.status === 'PAID' && (
              <button
                type="button"
                disabled={busyId === selectedBooking._id}
                onClick={() => {
                  handleConfirm(selectedBooking._id);
                  setSelectedBooking(null);
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {busyId === selectedBooking._id ? 'Confirming…' : 'Confirm This Booking'}
              </button>
            )}
            {selectedBooking.status === 'CONFIRMED' && (
              <button
                type="button"
                disabled={busyId === selectedBooking._id}
                onClick={() => {
                  handleComplete(selectedBooking._id);
                  setSelectedBooking(null);
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {busyId === selectedBooking._id ? 'Completing…' : 'Mark Trip as Completed'}
              </button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
