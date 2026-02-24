import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../utils/api';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function StatCard({ icon, label, value, sub, color = 'cyan', delay = 0 }) {
  const colors = {
    cyan: 'from-cyan-500 to-blue-600',
    amber: 'from-amber-400 to-orange-500',
    emerald: 'from-emerald-500 to-teal-600',
    violet: 'from-violet-500 to-purple-600',
    rose: 'from-rose-500 to-pink-600',
    slate: 'from-slate-600 to-slate-800',
    indigo: 'from-indigo-500 to-blue-600',
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
              className="w-full rounded-t-lg bg-gradient-to-t from-cyan-500 to-blue-500 transition-all duration-700 hover:from-cyan-400 hover:to-blue-400"
              style={{ height: h }}
              title={`${MONTHS[d._id.month - 1]} ${d._id.year}: ₹${d.revenue.toLocaleString()} (${d.count} bookings)`}
            />
            <span className="text-[10px] font-medium text-slate-400">{MONTHS[d._id.month - 1]}</span>
          </div>
        );
      })}
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

function SkeletonDashboard() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 w-56 rounded-lg bg-slate-200" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(9)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-slate-100" />)}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-2xl bg-slate-100" />
        <div className="h-64 rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    async function fetchStats() {
      try {
        const data = await apiFetch('/api/admin/analytics');
        if (!ignore) setStats(data);
      } catch (err) {
        if (!ignore) setError(err.message || 'Failed to load analytics');
      }
    }
    fetchStats();
    return () => { ignore = true; };
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-page-enter">
        <div className="rounded-full bg-red-100 p-4">
          <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
        </div>
        <p className="mt-4 text-lg font-semibold text-slate-900">Failed to load analytics</p>
        <p className="mt-1 text-sm text-slate-500">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 rounded-xl bg-cyan-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-cyan-700 transition">Retry</button>
      </div>
    );
  }

  if (!stats) return <SkeletonDashboard />;

  return (
    <div className="space-y-8 animate-page-enter">
      {/* ── Header ── */}
      <header className="animate-slide-down">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Admin</p>
        <h1 className="font-display mt-2 text-3xl font-bold text-slate-900">Marketplace Analytics</h1>
        <p className="mt-1 text-sm text-slate-600">Live operational snapshot for admin decision making.</p>
      </header>

      {/* ── Revenue & Financial Stats ── */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Revenue & Financials</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            label="Total Revenue" value={`₹${(stats.totalRevenue || 0).toLocaleString()}`}
            sub="From confirmed & completed bookings" color="emerald" delay={0}
          />
          <StatCard
            icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>}
            label="Commission Revenue" value={`₹${(stats.totalCommissionRevenue || 0).toLocaleString()}`}
            sub={`GST ₹${(stats.totalGSTCollected || 0).toLocaleString()} · TDS ₹${(stats.totalTDSCollected || 0).toLocaleString()}`} color="cyan" delay={0.05}
          />
          <StatCard
            icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
            label="Total Payouts" value={`₹${(stats.totalPayoutAmount || 0).toLocaleString()}`}
            sub={`${stats.completedPayouts || 0} completed · ${stats.scheduledPayouts || 0} scheduled`} color="violet" delay={0.1}
          />
        </div>
      </div>

      {/* ── Booking & Platform Stats ── */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Platform Overview</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
            label="Total Bookings" value={stats.totalBookings || 0}
            sub={`Avg ₹${(stats.avgBookingValue || 0).toLocaleString()} per booking`} color="amber" delay={0}
          />
          <StatCard
            icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
            label="Total Users" value={stats.totalUsers || 0}
            color="indigo" delay={0.05}
          />
          <StatCard
            icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
            label="Agencies" value={stats.totalAgencies || 0}
            sub={`${stats.verifiedAgencies || 0} verified · ${stats.pendingAgencyVerifications || 0} pending · ${stats.suspendedAgencies || 0} suspended`} color="slate" delay={0.1}
          />
          <StatCard
            icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
            label="Packages" value={stats.totalPackages || 0}
            sub={`${stats.activePackages || 0} active`} color="amber" delay={0.15}
          />
          <StatCard
            icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
            label="Reviews" value={stats.totalReviews || 0}
            color="rose" delay={0.2}
          />
          <StatCard
            icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>}
            label="Disputed" value={stats.bookingsByStatus?.DISPUTED || 0}
            sub={`${stats.bookingsByStatus?.CANCELLED || 0} cancelled · ${stats.bookingsByStatus?.REFUNDED || 0} refunded`} color="rose" delay={0.25}
          />
        </div>
      </div>

      {/* ── Booking Status Breakdown ── */}
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-lg animate-scale-in" style={{ animationDelay: '0.15s' }}>
        <h2 className="text-lg font-bold">Booking Status Breakdown</h2>
        <p className="text-xs text-slate-400 mb-5">Distribution across all statuses</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
          {[
            { key: 'PENDING_PAYMENT', label: 'Pending', color: 'bg-yellow-500' },
            { key: 'CONFIRMED', label: 'Confirmed', color: 'bg-emerald-500' },
            { key: 'COMPLETED', label: 'Completed', color: 'bg-blue-500' },
            { key: 'CANCELLED', label: 'Cancelled', color: 'bg-slate-500' },
            { key: 'REFUND_INITIATED', label: 'Refunding', color: 'bg-orange-500' },
            { key: 'REFUNDED', label: 'Refunded', color: 'bg-purple-500' },
            { key: 'DISPUTED', label: 'Disputed', color: 'bg-red-500' },
          ].map(s => (
            <div key={s.key} className="rounded-xl bg-white/10 backdrop-blur p-3 text-center">
              <div className={`mx-auto h-2 w-2 rounded-full ${s.color} mb-2`} />
              <p className="text-2xl font-bold">{stats.bookingsByStatus?.[s.key] || 0}</p>
              <p className="text-[10px] text-slate-300 uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Charts & Lists ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card animate-scale-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-lg font-bold text-slate-900">Revenue Trend</h2>
          <p className="text-xs text-slate-500 mb-4">Last 6 months · Confirmed bookings</p>
          <MiniBarChart data={stats.monthlyRevenue} />
        </section>

        {/* Top Agencies */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card animate-scale-in" style={{ animationDelay: '0.25s' }}>
          <h2 className="text-lg font-bold text-slate-900">Top Revenue Agencies</h2>
          <p className="text-xs text-slate-500 mb-4">By gross revenue</p>
          {stats.topAgencies && stats.topAgencies.length > 0 ? (
            <div className="space-y-3">
              {stats.topAgencies.map((ag, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 transition hover:bg-slate-100">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white shadow">
                    #{i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{ag.businessName}</p>
                    <p className="text-xs text-slate-500">{ag.tier || 'STANDARD'} tier</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-slate-900">₹{(ag.totalRevenue || 0).toLocaleString()}</p>
                    <p className="text-xs text-cyan-600 font-medium">₹{(ag.commission || 0).toLocaleString()} commission</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-400">No agency data yet</p>
          )}
        </section>
      </div>

      {/* ── Top Packages ── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card animate-scale-in" style={{ animationDelay: '0.3s' }}>
        <h2 className="text-lg font-bold text-slate-900">Top Performing Packages</h2>
        <p className="text-xs text-slate-500 mb-4">Packages with the most bookings</p>
        {stats.topPackages && stats.topPackages.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {stats.topPackages.map((pkg, i) => (
              <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center transition hover:bg-slate-100 hover:shadow-card">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-bold text-white shadow mb-2">
                  #{i + 1}
                </span>
                <p className="text-sm font-semibold text-slate-900 truncate">{pkg.title}</p>
                <p className="text-xs text-slate-500">{pkg.destination}</p>
                <p className="mt-2 text-lg font-bold text-slate-900">{pkg.bookingCount}</p>
                <p className="text-[10px] text-slate-400 uppercase">bookings</p>
                <p className="text-xs text-emerald-600 font-medium mt-1">₹{(pkg.revenue || 0).toLocaleString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-400">No package data yet</p>
        )}
      </section>

      {/* ── Recent Bookings ── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card animate-scale-in" style={{ animationDelay: '0.35s' }}>
        <h2 className="text-lg font-bold text-slate-900">Recent Bookings</h2>
        <p className="text-xs text-slate-500 mb-4">Latest 10 platform-wide bookings</p>
        {stats.recentBookings && stats.recentBookings.length > 0 ? (
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
                {stats.recentBookings.map((b) => (
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
                    <td className="py-3 pr-4"><StatusBadge status={b.status} /></td>
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
    </div>
  );
}
