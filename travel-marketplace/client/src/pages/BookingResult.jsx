import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { useToast } from '../context/ToastContext';

function getBookingTotalAmount(booking) {
  if (!booking) return 0;
  const amount = Number(booking.finalAmount || 0);
  const peopleCount = Number(booking.numberOfPeople || 1);
  if (booking.amountMode === 'TOTAL') return amount;
  return Number((amount * (peopleCount > 0 ? peopleCount : 1)).toFixed(2));
}

function getBookingAmount(booking, rawAmount) {
  if (!booking) return 0;
  const amount = Number(rawAmount || 0);
  const peopleCount = Number(booking.numberOfPeople || 1);
  if (booking.amountMode === 'TOTAL') return amount;
  return Number((amount * (peopleCount > 0 ? peopleCount : 1)).toFixed(2));
}

const STATUS_CONFIG = {
  PENDING_PAYMENT: { label: 'Pending Payment', color: 'amber', icon: '🕐', bg: 'from-amber-500 to-orange-500' },
  PAID: { label: 'Paid — Awaiting Confirmation', color: 'blue', icon: '💳', bg: 'from-blue-500 to-cyan-500' },
  CONFIRMED: { label: 'Confirmed', color: 'emerald', icon: '✅', bg: 'from-emerald-500 to-green-500' },
  COMPLETED: { label: 'Completed', color: 'indigo', icon: '🎉', bg: 'from-indigo-500 to-purple-500' },
  CANCELLED: { label: 'Cancelled', color: 'red', icon: '❌', bg: 'from-red-500 to-rose-500' },
  REFUND_INITIATED: { label: 'Refund Initiated', color: 'purple', icon: '🔄', bg: 'from-purple-500 to-violet-500' },
  REFUNDED: { label: 'Refunded', color: 'slate', icon: '💰', bg: 'from-slate-500 to-gray-500' },
};

export default function BookingResult() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [booking, setBooking] = useState(null);
  const [statusText, setStatusText] = useState('Checking booking status...');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const data = await apiFetch(`/api/bookings/${id}`);
        if (!cancelled) {
          setBooking(data.booking);
          setStatusText(data.booking.status);
          if (['CONFIRMED', 'CANCELLED', 'COMPLETED', 'REFUNDED'].includes(data.booking.status)) {
            window.clearInterval(intervalRef);
          }
        }
      } catch (err) {
        if (!cancelled) setStatusText(err.message || 'Error fetching booking');
      }
    }

    check();
    const intervalRef = window.setInterval(check, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalRef);
    };
  }, [id]);

  const isPending = useMemo(() => statusText === 'PENDING_PAYMENT', [statusText]);
  const isPaid = useMemo(() => statusText === 'PAID', [statusText]);
  const isConfirmed = useMemo(() => statusText === 'CONFIRMED', [statusText]);
  const isCompleted = useMemo(() => statusText === 'COMPLETED', [statusText]);
  const finalAmount = useMemo(() => getBookingTotalAmount(booking), [booking]);
  const baseAmount = useMemo(() => getBookingAmount(booking, booking?.basePrice), [booking]);
  const discountAmount = useMemo(() => getBookingAmount(booking, booking?.discountApplied), [booking]);
  const sConfig = STATUS_CONFIG[statusText] || STATUS_CONFIG.PENDING_PAYMENT;

  async function handlePay() {
    setPaying(true);
    try {
      await apiFetch(`/api/bookings/${id}/pay`, { method: 'POST' });
      showToast('Payment successful! Awaiting agency confirmation.', 'success');
      const data = await apiFetch(`/api/bookings/${id}`);
      setBooking(data.booking);
      setStatusText(data.booking.status);
    } catch (err) {
      showToast(err.message || 'Payment failed', 'error');
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="min-h-[60vh] px-4 py-8 sm:px-6 animate-fade-in">
      <div className="mx-auto w-full max-w-2xl">

        {/* Status Hero Banner */}
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${sConfig.bg} p-8 text-white shadow-2xl`}>
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{sConfig.icon}</span>
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-white/70">Booking Status</p>
                <h1 className="text-2xl font-bold sm:text-3xl">{sConfig.label}</h1>
              </div>
            </div>
            {booking?.packageId?.title && (
              <p className="mt-4 text-sm font-medium text-white/80">
                {booking.packageId.title}
                {booking.packageId.destination && ` · ${booking.packageId.destination}`}
              </p>
            )}
          </div>
        </div>

        {/* Booking Details Card */}
        {booking && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Trip Info */}
            <div className="grid grid-cols-2 gap-px bg-slate-100">
              <div className="bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Travel Date</p>
                <p className="mt-1.5 text-lg font-bold text-slate-900">
                  {new Date(booking.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Travelers</p>
                <p className="mt-1.5 text-lg font-bold text-slate-900">
                  {booking.numberOfPeople} {booking.numberOfPeople === 1 ? 'Person' : 'People'}
                </p>
              </div>
            </div>

            {/* Payment Breakdown */}
            <div className="border-t border-slate-100 p-5 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Payment Summary</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Base Amount</span>
                  <span className="font-semibold text-slate-900">₹{baseAmount.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Discount</span>
                    <span className="font-semibold text-emerald-600">−₹{discountAmount.toLocaleString()}</span>
                  </div>
                )}
                {booking.couponCode && booking.couponDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Coupon ({booking.couponCode})</span>
                    <span className="font-semibold text-emerald-600">−₹{getBookingAmount(booking, booking.couponDiscount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-dashed border-slate-200 pt-2.5">
                  <span className="font-semibold text-slate-700">Total Amount</span>
                  <span className="text-xl font-bold text-slate-900">₹{finalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Booking ID */}
            <div className="border-t border-slate-100 px-5 py-3 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Booking ID</span>
                <span className="font-mono text-xs font-semibold text-slate-600">{booking._id}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Section — Pay Now */}
        {isPending && (
          <div className="mt-6 space-y-4">
            <button
              onClick={handlePay}
              disabled={paying}
              className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-4 text-white shadow-lg transition-all duration-300 hover:from-emerald-700 hover:to-green-700 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <div className="relative flex items-center justify-center gap-3">
                {paying ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="font-semibold">Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    <span className="text-lg font-bold">Pay Now — ₹{finalAmount.toLocaleString()}</span>
                  </>
                )}
              </div>
            </button>
            <p className="text-center text-xs text-slate-400">
              Secure simulated payment · Agency will confirm after payment
            </p>
          </div>
        )}

        {/* Status-specific messages */}
        {isPaid && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <svg className="h-5 w-5 text-blue-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="font-semibold text-blue-800">Payment received!</p>
              <p className="text-sm text-blue-600">The agency will review and confirm your booking shortly.</p>
            </div>
          </div>
        )}

        {isConfirmed && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <div>
              <p className="font-semibold text-emerald-800">Booking confirmed!</p>
              <p className="text-sm text-emerald-600">Your trip is all set. Have an amazing journey!</p>
            </div>
          </div>
        )}

        {isCompleted && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100">
              <span className="text-lg">🎉</span>
            </div>
            <div>
              <p className="font-semibold text-indigo-800">Trip completed!</p>
              <p className="text-sm text-indigo-600">We hope you had a wonderful experience. Don't forget to leave a review!</p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/app/my-trips"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-slate-800 hover:to-slate-600 hover:shadow-lg hover:scale-[1.02]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            My Trips
          </Link>
          <Link
            to="/app/packages"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md hover:scale-[1.02]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            Explore Packages
          </Link>
        </div>
      </div>
    </div>
  );
}
