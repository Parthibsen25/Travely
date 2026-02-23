import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';

export default function AgencyPayouts() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    async function fetchPayouts() {
      try {
        const data = await apiFetch('/api/payouts/my');
        if (!ignore) setPayouts(data.payouts || []);
      } catch (err) {
        if (!ignore) setError(err.message || 'Failed to load payouts');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchPayouts();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="animate-slide-down">
        <h1 className="font-display text-3xl font-bold text-slate-900">Payouts</h1>
        <p className="mt-1 text-sm text-slate-600">Track released payouts and commission deductions.</p>
      </header>

      {loading ? (
        <p className="text-sm text-slate-500">Loading payouts...</p>
      ) : error ? (
        <p className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p>
      ) : payouts.length === 0 ? (
        <p className="rounded-xl bg-slate-100 p-4 text-sm text-slate-600">No payouts yet.</p>
      ) : (
        <div className="space-y-3">
          {payouts.map((payout, index) => (
            <article key={payout._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-900">Payout #{payout._id}</h2>
                  <p className="text-sm text-slate-600">Bookings: {payout.bookingIds?.length || 0}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">₹{payout.payoutAmount}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{payout.status}</p>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Revenue: ₹{payout.totalRevenue} | Commission: ₹{payout.commissionDeducted}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
