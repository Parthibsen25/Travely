import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { Link } from 'react-router-dom';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function StatCard({ icon, label, value, sub, color = 'cyan', delay = 0 }) {
  const colors = {
    cyan: 'from-cyan-500 to-blue-600',
    amber: 'from-amber-400 to-orange-500',
    emerald: 'from-emerald-500 to-teal-600',
    violet: 'from-violet-500 to-purple-600',
    rose: 'from-rose-500 to-pink-600',
    slate: 'from-slate-600 to-slate-800',
  };
  return (
    <article
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-scale-in"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${colors[color]} opacity-10 transition-transform duration-500 group-hover:scale-150`} />
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${colors[color]} text-white shadow-lg`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
        </div>
      </div>
    </article>
  );
}

function MiniBarChart({ data, maxHeight = 120 }) {
  if (!data || data.length === 0) return <p className="text-sm text-slate-400 py-8 text-center">No revenue data yet</p>;
  const maxVal = Math.max(...data.map(d => d.revenue), 1);
  return (
    <div className="flex items-end gap-2 justify-center" style={{ height: maxHeight }}>
      {data.map((d, i) => {
        const h = Math.max((d.revenue / maxVal) * maxHeight * 0.85, 4);
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1 max-w-[60px]">
            <span className="text-[10px] font-semibold text-slate-500">₹{d.revenue >= 1000 ? `${(d.revenue / 1000).toFixed(0)}k` : d.revenue}</span>
            <div
              className="w-full rounded-t-lg bg-gradient-to-t from-amber-500 to-orange-400 transition-all duration-700 hover:from-amber-400 hover:to-orange-300"
              style={{ height: h, animationDelay: `${i * 0.1}s` }}
              title={`${MONTHS[d._id.month - 1]} ${d._id.year}: ₹${d.revenue.toLocaleString()} (${d.count} bookings)`}
            />
            <span className="text-[10px] font-medium text-slate-400">{MONTHS[d._id.month - 1]}</span>
          </div>
        );
      })}
    </div>
  );
}

function SkeletonDashboard() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-slate-200" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-100" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-2xl bg-slate-100" />
        <div className="h-64 rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}

export default function AgencyDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    async function fetch() {
      try {
        const res = await apiFetch('/api/payouts/analytics');
        if (!ignore) setData(res);
      } catch (err) {
        if (!ignore) setError(err.message || 'Failed to load analytics');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetch();
    return () => { ignore = true; };
  }, []);

  if (loading) return <SkeletonDashboard />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-page-enter">
        <div className="rounded-full bg-red-100 p-4">
          <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
        </div>
        <p className="mt-4 text-lg font-semibold text-slate-900">Failed to load analytics</p>
        <p className="mt-1 text-sm text-slate-500">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-amber-600 transition">
          Retry
        </button>
      </div>
    );
  }

  const { agency, packages, bookings, earnings, reviews, monthlyRevenue, topPackages, recentBookings } = data;

  return (
    <div className="space-y-8 animate-page-enter">
      {/* ── Header ── */}
      <header className="animate-slide-down">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">Analytics & Insights</p>
            <h1 className="font-display mt-1 text-3xl font-bold text-slate-900">{agency?.businessName || 'Agency Dashboard'}</h1>
            <p className="mt-1 text-sm text-slate-500">
              Member since {agency?.memberSince ? new Date(agency.memberSince).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—'} &nbsp;·&nbsp;
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                {agency?.tierLabel || agency?.commissionTier || 'Starter'} Tier · {agency?.commissionRate || 20}% commission · {agency?.settlementCycle || 'T+14'}
              </span>
            </p>
          </div>
          <Link to="/agency/packages" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg hover:scale-105">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            Manage Packages
          </Link>
        </div>
      </header>

      {/* ── Stat Cards ── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          label="Total Revenue" value={`₹${(earnings.totalRevenue || 0).toLocaleString()}`}
          sub="From confirmed bookings" color="emerald" delay={0}
        />
        <StatCard
          icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          label="Net Payouts" value={`₹${(earnings.netPayout || earnings.estimatedNetEarnings || 0).toLocaleString()}`}
          sub={earnings.netPayout ? `${earnings.completedPayouts || 0} paid · ${earnings.scheduledPayouts || 0} scheduled` : 'Estimated — payouts pending'} color="cyan" delay={0.05}
        />
        <StatCard
          icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>}
          label="Commission" value={`₹${(earnings.commissionPaid || earnings.estimatedCommission || 0).toLocaleString()}`}
          sub={`${agency?.commissionRate || 20}% platform fee${!earnings.commissionPaid && earnings.estimatedCommission ? ' (est.)' : ''}`} color="rose" delay={0.1}
        />
        <StatCard
          icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
          label="Total Bookings" value={bookings.total}
          sub={`Avg ₹${bookings.avgValue.toLocaleString()} per booking`} color="violet" delay={0.15}
        />
        <StatCard
          icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
          label="Packages" value={packages.total}
          sub={`${packages.active} active · ${packages.inactive} inactive`} color="amber" delay={0.2}
        />
        <StatCard
          icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          label="Confirmed" value={bookings.byStatus?.CONFIRMED || 0}
          sub={`${bookings.byStatus?.COMPLETED || 0} completed`} color="emerald" delay={0.25}
        />
        <StatCard
          icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
          label="Reviews" value={reviews.total}
          sub={reviews.avgRating > 0 ? `${reviews.avgRating} ★ average rating` : 'No reviews yet'} color="amber" delay={0.3}
        />
        <StatCard
          icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          label="Pending Payment" value={bookings.byStatus?.PENDING_PAYMENT || 0}
          sub={`${bookings.byStatus?.CANCELLED || 0} cancelled`} color="slate" delay={0.35}
        />
      </section>

      {/* ── Charts & Lists ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card animate-scale-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-lg font-bold text-slate-900">Revenue Trend</h2>
          <p className="text-xs text-slate-500 mb-4">Last 6 months · Confirmed bookings</p>
          <MiniBarChart data={monthlyRevenue} />
        </section>

        {/* Top Packages */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card animate-scale-in" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-lg font-bold text-slate-900">Top Performing Packages</h2>
          <p className="text-xs text-slate-500 mb-4">By booking count</p>
          {topPackages && topPackages.length > 0 ? (
            <div className="space-y-3">
              {topPackages.map((pkg, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 transition hover:bg-slate-100">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-bold text-white shadow">
                    #{i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{pkg.title}</p>
                    <p className="text-xs text-slate-500">{pkg.destination} · {pkg.rating ? `${pkg.rating} ★` : 'No rating'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-slate-900">{pkg.bookingCount} bookings</p>
                    <p className="text-xs text-emerald-600 font-medium">₹{pkg.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-400">No booking data yet</p>
          )}
        </section>
      </div>

      {/* ── Earnings Breakdown ── */}
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-lg animate-scale-in" style={{ animationDelay: '0.35s' }}>
        <h2 className="text-lg font-bold">Earnings Breakdown</h2>
        <p className="text-xs text-slate-400 mb-5">Complete financial summary with all deductions</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white/10 backdrop-blur p-4">
            <p className="text-xs text-slate-300 uppercase tracking-wider">Gross Revenue</p>
            <p className="mt-1 text-2xl font-bold">₹{(earnings.grossPayoutRevenue || earnings.totalRevenue || 0).toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-white/10 backdrop-blur p-4">
            <p className="text-xs text-slate-300 uppercase tracking-wider">Platform Commission</p>
            <p className="mt-1 text-2xl font-bold text-rose-400">−₹{(earnings.commissionPaid || earnings.estimatedCommission || 0).toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-0.5">{agency?.commissionRate || 20}% of revenue{!earnings.commissionPaid && earnings.estimatedCommission ? ' (est.)' : ''}</p>
          </div>
          <div className="rounded-xl bg-white/10 backdrop-blur p-4">
            <p className="text-xs text-slate-300 uppercase tracking-wider">GST on Commission</p>
            <p className="mt-1 text-2xl font-bold text-orange-400">−₹{(earnings.gstPaid || earnings.estimatedGST || 0).toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-0.5">18% of commission</p>
          </div>
          <div className="rounded-xl bg-white/10 backdrop-blur p-4">
            <p className="text-xs text-slate-300 uppercase tracking-wider">TDS Deducted</p>
            <p className="mt-1 text-2xl font-bold text-yellow-400">−₹{(earnings.tdsDeducted || earnings.estimatedTDS || 0).toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-0.5">1% TDS u/s 194O</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-4">
          <div className="rounded-xl bg-white/10 backdrop-blur p-4">
            <p className="text-xs text-slate-300 uppercase tracking-wider">Payment Gateway Fee</p>
            <p className="mt-1 text-2xl font-bold text-blue-400">−₹{(earnings.gatewayFees || earnings.estimatedGateway || 0).toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-0.5">2% processing fee</p>
          </div>
          <div className="rounded-xl bg-white/10 backdrop-blur p-4">
            <p className="text-xs text-slate-300 uppercase tracking-wider">Total Deductions</p>
            <p className="mt-1 text-2xl font-bold text-rose-300">−₹{(earnings.totalDeductions || earnings.estimatedTotalDeductions || 0).toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-white/10 backdrop-blur p-4">
            <p className="text-xs text-slate-300 uppercase tracking-wider">Net Earnings</p>
            <p className="mt-1 text-2xl font-bold text-emerald-400">₹{(earnings.netPayout || earnings.estimatedNetEarnings || 0).toLocaleString()}</p>
            {!earnings.netPayout && earnings.estimatedNetEarnings > 0 && (
              <p className="text-xs text-emerald-300/60 mt-0.5">Estimated — payouts pending</p>
            )}
          </div>
          <div className="rounded-xl bg-white/10 backdrop-blur p-4">
            <p className="text-xs text-slate-300 uppercase tracking-wider">Payout Status</p>
            <div className="mt-1 flex items-baseline gap-2 flex-wrap">
              <div>
                <span className="text-xl font-bold text-emerald-400">{earnings.completedPayouts || 0}</span>
                <span className="text-[10px] text-slate-400 ml-1">paid</span>
              </div>
              <div>
                <span className="text-xl font-bold text-amber-400">{earnings.scheduledPayouts || 0}</span>
                <span className="text-[10px] text-slate-400 ml-1">scheduled</span>
              </div>
              <div>
                <span className="text-xl font-bold text-blue-400">{earnings.processingPayouts || 0}</span>
                <span className="text-[10px] text-slate-400 ml-1">processing</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── GMV & Tier Progress ── */}
        {agency?.nextTierGMV && (
          <div className="mt-5 rounded-xl bg-white/10 backdrop-blur p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-300 uppercase tracking-wider">Tier Progress</p>
              <p className="text-xs text-slate-400">₹{(agency.quarterlyGMV || 0).toLocaleString()} / ₹{(agency.nextTierGMV).toLocaleString()} quarterly GMV</p>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-amber-400 to-orange-500 h-2.5 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(((agency.quarterlyGMV || 0) / agency.nextTierGMV) * 100, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">Reach ₹{agency.nextTierGMV.toLocaleString()} quarterly GMV to unlock lower commission rates</p>
          </div>
        )}
      </section>

      {/* ── Recent Bookings ── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card animate-scale-in" style={{ animationDelay: '0.4s' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Bookings</h2>
            <p className="text-xs text-slate-500">Latest 10 bookings across your packages</p>
          </div>
          <Link to="/agency/bookings" className="text-sm font-semibold text-amber-600 hover:text-amber-700 transition">
            View all →
          </Link>
        </div>
        {recentBookings && recentBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400">
                  <th className="pb-3 pr-4 font-semibold">Package</th>
                  <th className="pb-3 pr-4 font-semibold">Customer</th>
                  <th className="pb-3 pr-4 font-semibold">Amount</th>
                  <th className="pb-3 pr-4 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentBookings.map((b) => (
                  <tr key={b._id} className="transition hover:bg-slate-50">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-slate-900 truncate max-w-[180px]">{b.packageId?.title || '—'}</p>
                      <p className="text-xs text-slate-400">{b.packageId?.destination || ''}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="text-slate-700">{b.userId?.name || '—'}</p>
                      <p className="text-xs text-slate-400">{b.userId?.email || ''}</p>
                    </td>
                    <td className="py-3 pr-4 font-semibold text-slate-900">₹{(b.finalAmount || 0).toLocaleString()}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="py-3 text-xs text-slate-500">{new Date(b.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-400">No bookings yet</p>
        )}
      </section>

      {/* ── Quick Actions ── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3 animate-scale-in" style={{ animationDelay: '0.45s' }}>
        <Link to="/agency/packages" className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:shadow-lg hover:-translate-y-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 transition group-hover:bg-amber-500 group-hover:text-white">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          </div>
          <h3 className="mt-3 font-semibold text-slate-900">Manage Packages</h3>
          <p className="mt-1 text-xs text-slate-500">Create, edit and manage your travel packages</p>
        </Link>
        <Link to="/agency/bookings" className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:shadow-lg hover:-translate-y-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600 transition group-hover:bg-cyan-500 group-hover:text-white">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          </div>
          <h3 className="mt-3 font-semibold text-slate-900">View Bookings</h3>
          <p className="mt-1 text-xs text-slate-500">Track all customer bookings and their status</p>
        </Link>
        <Link to="/agency/payouts" className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:shadow-lg hover:-translate-y-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition group-hover:bg-emerald-500 group-hover:text-white">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h3 className="mt-3 font-semibold text-slate-900">Payout History</h3>
          <p className="mt-1 text-xs text-slate-500">View your earnings and payout records</p>
        </Link>
      </section>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    PENDING_PAYMENT: { label: 'Pending', cls: 'bg-yellow-100 text-yellow-700' },
    CONFIRMED: { label: 'Confirmed', cls: 'bg-emerald-100 text-emerald-700' },
    COMPLETED: { label: 'Completed', cls: 'bg-blue-100 text-blue-700' },
    CANCELLED: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-600' },
    REFUND_INITIATED: { label: 'Refunding', cls: 'bg-orange-100 text-orange-700' },
    REFUNDED: { label: 'Refunded', cls: 'bg-purple-100 text-purple-700' },
    DISPUTED: { label: 'Disputed', cls: 'bg-red-100 text-red-700' },
  };
  const c = config[status] || { label: status, cls: 'bg-slate-100 text-slate-600' };
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.cls}`}>{c.label}</span>;
}
