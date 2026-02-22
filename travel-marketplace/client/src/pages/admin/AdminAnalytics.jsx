import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../utils/api';

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
    return () => {
      ignore = true;
    };
  }, []);

  if (error) {
    return <p className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p>;
  }

  if (!stats) {
    return <p className="text-sm text-slate-500">Loading analytics...</p>;
  }

  const cards = [
    { title: 'Total Agencies', value: stats.totalAgencies },
    { title: 'Pending Verifications', value: stats.pendingAgencyVerifications },
    { title: 'Total Bookings', value: stats.totalBookings },
    { title: 'Disputed Bookings', value: stats.disputedBookings },
    { title: 'Commission Revenue', value: `Rs ${stats.totalCommissionRevenue}` }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="animate-slide-down">
        <h1 className="font-display text-3xl font-bold text-slate-900">Marketplace Analytics</h1>
        <p className="mt-1 text-sm text-slate-600">Live operational snapshot for admin decision making.</p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, index) => (
          <article
            key={card.title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-scale-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <p className="text-sm text-slate-500">{card.title}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 transition-all duration-300 hover:scale-110">{card.value}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
