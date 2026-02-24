import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';

function PayoutStatusBadge({ status }) {
  const config = {
    SCHEDULED: { label: 'Scheduled', cls: 'bg-blue-100 text-blue-700' },
    PROCESSING: { label: 'Processing', cls: 'bg-amber-100 text-amber-700' },
    COMPLETED: { label: 'Completed', cls: 'bg-emerald-100 text-emerald-700' },
    PAID: { label: 'Paid', cls: 'bg-emerald-100 text-emerald-700' },
    FAILED: { label: 'Failed', cls: 'bg-red-100 text-red-700' },
    ON_HOLD: { label: 'On Hold', cls: 'bg-slate-100 text-slate-600' },
    PENDING: { label: 'Pending', cls: 'bg-yellow-100 text-yellow-700' },
  };
  const c = config[status] || { label: status, cls: 'bg-slate-100 text-slate-600' };
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.cls}`}>{c.label}</span>;
}

export default function AgencyPayouts() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

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

  // Summary totals
  const totals = payouts.reduce(
    (acc, p) => ({
      gross: acc.gross + (p.grossAmount || 0),
      commission: acc.commission + (p.platformCommission || 0),
      gst: acc.gst + (p.gstOnCommission || 0),
      tds: acc.tds + (p.tdsDeducted || 0),
      gateway: acc.gateway + (p.paymentGatewayFee || 0),
      net: acc.net + (p.netPayoutAmount || 0),
    }),
    { gross: 0, commission: 0, gst: 0, tds: 0, gateway: 0, net: 0 }
  );

  return (
    <div className="space-y-6 animate-page-enter">
      <header className="animate-slide-down">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">Financial</p>
        <h1 className="font-display mt-1 text-3xl font-bold text-slate-900">Payouts & Settlements</h1>
        <p className="mt-1 text-sm text-slate-600">Track released payouts, commission deductions, and all financial breakdowns.</p>
      </header>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-slate-100" />)}
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-center">
          <p className="text-sm font-medium text-red-700">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-3 rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 transition">Retry</button>
        </div>
      ) : payouts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="mt-4 text-lg font-semibold text-slate-900">No payouts yet</p>
          <p className="mt-1 text-sm text-slate-500">Payouts are automatically generated after trip completion + settlement period.</p>
        </div>
      ) : (
        <>
          {/* ── Summary Cards ── */}
          <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-lg animate-scale-in">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">Payout Summary</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <div className="rounded-xl bg-white/10 backdrop-blur p-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Gross</p>
                <p className="mt-1 text-lg font-bold">₹{totals.gross.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-white/10 backdrop-blur p-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Commission</p>
                <p className="mt-1 text-lg font-bold text-rose-400">−₹{totals.commission.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-white/10 backdrop-blur p-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">GST</p>
                <p className="mt-1 text-lg font-bold text-orange-400">−₹{totals.gst.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-white/10 backdrop-blur p-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">TDS</p>
                <p className="mt-1 text-lg font-bold text-yellow-400">−₹{totals.tds.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-white/10 backdrop-blur p-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Gateway</p>
                <p className="mt-1 text-lg font-bold text-blue-400">−₹{totals.gateway.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-white/10 backdrop-blur p-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Net Payout</p>
                <p className="mt-1 text-lg font-bold text-emerald-400">₹{totals.net.toLocaleString()}</p>
              </div>
            </div>
          </section>

          {/* ── Payout List ── */}
          <div className="space-y-4">
            {payouts.map((payout, index) => {
              const isExpanded = expandedId === payout._id;
              return (
                <article
                  key={payout._id}
                  className="rounded-2xl border border-slate-200 bg-white shadow-card transition-all duration-300 hover:shadow-lg animate-scale-in overflow-hidden"
                  style={{ animationDelay: `${index * 0.08}s` }}
                >
                  {/* Header Row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : payout._id)}
                    className="w-full p-5 text-left flex flex-wrap items-start justify-between gap-3 hover:bg-slate-50 transition"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-display text-base font-bold text-slate-900">
                          {payout.invoiceNumber || `Payout #${payout._id.slice(-6).toUpperCase()}`}
                        </h2>
                        <PayoutStatusBadge status={payout.status} />
                        {payout.settlementCycle && (
                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{payout.settlementCycle}</span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {payout.bookingIds?.length || 0} booking{(payout.bookingIds?.length || 0) !== 1 ? 's' : ''} &nbsp;·&nbsp;
                        {new Date(payout.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {payout.scheduledDate && (
                          <> &nbsp;·&nbsp; Settlement: {new Date(payout.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</>
                        )}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-emerald-600">₹{(payout.netPayoutAmount || 0).toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Net Payout</p>
                    </div>
                    <svg className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Expanded Financial Breakdown */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50 p-5 animate-page-enter">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Financial Breakdown</h3>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        <div className="rounded-xl bg-white p-3 border border-slate-100">
                          <p className="text-[10px] text-slate-400 uppercase">Gross Amount</p>
                          <p className="text-sm font-bold text-slate-900">₹{(payout.grossAmount || 0).toLocaleString()}</p>
                        </div>
                        <div className="rounded-xl bg-white p-3 border border-slate-100">
                          <p className="text-[10px] text-slate-400 uppercase">Commission ({payout.commissionRate || 0}%)</p>
                          <p className="text-sm font-bold text-rose-600">−₹{(payout.platformCommission || 0).toLocaleString()}</p>
                        </div>
                        <div className="rounded-xl bg-white p-3 border border-slate-100">
                          <p className="text-[10px] text-slate-400 uppercase">GST (18%)</p>
                          <p className="text-sm font-bold text-orange-600">−₹{(payout.gstOnCommission || 0).toLocaleString()}</p>
                        </div>
                        <div className="rounded-xl bg-white p-3 border border-slate-100">
                          <p className="text-[10px] text-slate-400 uppercase">TDS (1%)</p>
                          <p className="text-sm font-bold text-yellow-600">−₹{(payout.tdsDeducted || 0).toLocaleString()}</p>
                        </div>
                        <div className="rounded-xl bg-white p-3 border border-slate-100">
                          <p className="text-[10px] text-slate-400 uppercase">Gateway (2%)</p>
                          <p className="text-sm font-bold text-blue-600">−₹{(payout.paymentGatewayFee || 0).toLocaleString()}</p>
                        </div>
                        <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-200">
                          <p className="text-[10px] text-emerald-600 uppercase font-bold">Net Payout</p>
                          <p className="text-sm font-bold text-emerald-700">₹{(payout.netPayoutAmount || 0).toLocaleString()}</p>
                        </div>
                      </div>
                      {payout.remarks && (
                        <p className="mt-3 text-xs text-slate-500 italic">Remarks: {payout.remarks}</p>
                      )}
                      {payout.failureReason && (
                        <p className="mt-3 text-xs text-red-600 font-medium">Failure reason: {payout.failureReason}</p>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
