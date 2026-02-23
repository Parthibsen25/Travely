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

export default function BookingResult() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [booking, setBooking] = useState(null);
  const [statusText, setStatusText] = useState('Checking booking status...');

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const data = await apiFetch(`/api/bookings/${id}`);
        if (!cancelled) {
          setBooking(data.booking);
          setStatusText(data.booking.status);
          // Stop polling on terminal states
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
  const finalAmount = useMemo(() => getBookingTotalAmount(booking), [booking]);
  const baseAmount = useMemo(() => getBookingAmount(booking, booking?.basePrice), [booking]);
  const discountAmount = useMemo(() => getBookingAmount(booking, booking?.discountApplied), [booking]);

  return (
    <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 my-8 animate-scale-in">
      <h1 className="font-display text-3xl font-bold text-slate-900">Booking Status</h1>
      <p className="mt-2 text-sm text-slate-600">Live updates every 3 seconds.</p>

      <div className="mt-6 rounded-2xl bg-slate-50 p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Current Status</p>
        <p className="mt-2 text-2xl font-bold text-slate-900 animate-pulse">{statusText}</p>

        {booking && (
          <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <p>
              <span className="font-semibold text-slate-700">Travel Date:</span> {new Date(booking.travelDate).toLocaleDateString()}
            </p>
            <p>
              <span className="font-semibold text-slate-700">People:</span> {booking.numberOfPeople}
            </p>
            <p>
              <span className="font-semibold text-slate-700">Base Amount:</span> ₹{baseAmount.toLocaleString()}
            </p>
            <p>
              <span className="font-semibold text-slate-700">Discount:</span> ₹{discountAmount.toLocaleString()}
            </p>
            <p>
              <span className="font-semibold text-slate-700">Final Amount:</span> ₹{finalAmount.toLocaleString()}
            </p>
            <p className="sm:col-span-2">
              <span className="font-semibold text-slate-700">Booking ID:</span> {booking._id}
            </p>
          </div>
        )}
      </div>

      {isPending && (
        <div className="mt-4 space-y-2">
          <p className="rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-700">
            Payments are temporarily disabled. Click below to confirm your booking directly.
          </p>
          <button
            onClick={async () => {
              try {
                await apiFetch(`/api/bookings/${id}/confirm`, { method: 'POST' });
                const data = await apiFetch(`/api/bookings/${id}`);
                setBooking(data.booking);
                setStatusText(data.booking.status);
              } catch (err) {
                showToast(err.message || 'Failed to confirm', 'error');
              }
            }}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-emerald-700 hover:scale-105"
          >
            Confirm Booking Now
          </button>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <Link to="/app/my-trips" className="rounded-lg bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:from-slate-800 hover:to-slate-600 hover:scale-105">
          Go to My Trips
        </Link>
        <Link to="/app/packages" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-50 hover:scale-105">
          Explore Packages
        </Link>
      </div>
    </div>
  );
}
