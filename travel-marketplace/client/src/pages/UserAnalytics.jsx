import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';

const PERSONALITY_EMOJI = {
  'Explorer': '🧭',
  'Adventurer': '🏔️',
  'Relaxation Seeker': '🏖️',
  'Culture Enthusiast': '🎭',
  'Budget Traveler': '💰',
  'Luxury Traveler': '✨',
  'New Traveler': '🌱'
};

const BADGE_STYLES = {
  gold: 'from-amber-400 to-yellow-500 text-white',
  silver: 'from-slate-300 to-slate-400 text-slate-800',
  bronze: 'from-orange-300 to-amber-400 text-white',
  locked: 'from-slate-100 to-slate-200 text-slate-400'
};

export default function UserAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch('/api/analytics/user')
      .then((json) => { setData(json.data || json); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600" />
    </div>
  );

  if (error) return (
    <div className="mx-auto max-w-2xl p-8 text-center">
      <p className="text-lg text-red-500">Failed to load analytics: {error}</p>
    </div>
  );

  if (!data) return null;

  const { overview = {}, destinations = [], categoryBreakdown: categories = [], topThemes: themes = [], monthlySpending = [], upcomingTrips = [], achievements = [] } = data;

  const maxSpend = Math.max(...monthlySpending.map((m) => m.amount), 1);

  return (
    <div className="mx-auto max-w-6xl animate-page-enter space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Your Travel Dashboard</h1>
        <p className="mt-1 text-slate-500">Insights from your journeys</p>
      </div>

      {/* Personality Banner */}
      {overview.travelPersonality && (
        <div className="rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 p-6 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{PERSONALITY_EMOJI[overview.travelPersonality] || '✈️'}</span>
            <div>
              <p className="text-sm font-medium text-cyan-100">Your Travel Personality</p>
              <p className="text-2xl font-bold">{overview.travelPersonality}</p>
            </div>
          </div>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Total Trips', value: overview.totalTrips || 0, icon: '✈️' },
          { label: 'Total Spent', value: `₹${(overview.totalSpent || 0).toLocaleString()}`, icon: '💳' },
          { label: 'Avg Trip Cost', value: `₹${(overview.avgTripCost || 0).toLocaleString()}`, icon: '📊' },
          { label: 'Days Traveled', value: overview.totalDaysTraveled || 0, icon: '📅' },
          { label: 'Destinations', value: overview.destinationsVisited || 0, icon: '📍' }
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>{stat.icon}</span> {stat.label}
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-800">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly Spending Chart */}
      {monthlySpending.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Monthly Spending</h2>
          <div className="flex items-end gap-2" style={{ height: 180 }}>
            {monthlySpending.map((m) => {
              const h = Math.max((m.amount / maxSpend) * 150, 4);
              return (
                <div key={m.month} className="group flex flex-1 flex-col items-center gap-1">
                  <div className="relative">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                      ₹{m.amount.toLocaleString()}
                    </div>
                  </div>
                  <div className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-cyan-500 to-blue-400 transition-all group-hover:from-cyan-400 group-hover:to-blue-300" style={{ height: h }} />
                  <span className="text-[10px] text-slate-400">{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Destinations */}
        {destinations.length > 0 && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Your Destinations</h2>
            <div className="space-y-3">
              {destinations.slice(0, 8).map((d, i) => {
                const name = typeof d === 'string' ? d : d.destination;
                const count = typeof d === 'object' ? d.count : null;
                return (
                <div key={name || i} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-50 text-xs font-bold text-cyan-700">{i + 1}</span>
                  <span className="flex-1 font-medium text-slate-700">{name}</span>
                  {count != null && <span className="text-sm text-slate-400">{count} trip{count > 1 ? 's' : ''}</span>}
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Categories */}
        {categories.length > 0 && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Trip Categories</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <div key={c.name || c.category} className="rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-2 text-sm font-medium text-cyan-700">
                  {c.name || c.category} <span className="ml-1 text-cyan-400">×{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Themes */}
        {themes.length > 0 && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Favorite Themes</h2>
            <div className="flex flex-wrap gap-2">
              {themes.map((t) => (
                <div key={t.theme} className="rounded-full bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-700">
                  {t.theme} <span className="text-violet-400">({t.count})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Trips */}
        {upcomingTrips.length > 0 && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Upcoming Trips</h2>
            <div className="space-y-3">
              {upcomingTrips.map((trip) => (
                <div key={trip._id} className="flex items-center gap-3 rounded-xl bg-emerald-50/60 p-3">
                  <span className="text-2xl">🗓️</span>
                  <div className="flex-1">
                    <p className="font-medium text-slate-700">{trip.packageTitle || trip.destination}</p>
                    <p className="text-xs text-slate-400">{new Date(trip.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">{trip.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Achievements & Milestones</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((a) => {
              const progressNum = a.unlocked ? 100 : (typeof a.progress === 'number' ? a.progress : 0);
              const tier = a.unlocked ? 'gold' : 'locked';
              return (
                <div key={a.id} className={`relative overflow-hidden rounded-xl p-4 ${a.unlocked ? 'bg-white ring-1 ring-amber-200' : 'bg-slate-50 opacity-60'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${BADGE_STYLES[tier]} text-lg`}>
                      {a.icon || '🏆'}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-700">{a.title || a.label}</p>
                      <p className="text-xs text-slate-400">{a.description || (typeof a.progress === 'string' ? a.progress : '')}</p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${a.unlocked ? 'bg-gradient-to-r from-amber-400 to-yellow-400' : 'bg-slate-300'}`}
                      style={{ width: `${Math.min(progressNum, 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-right text-[10px] text-slate-400">{a.unlocked ? '100%' : (typeof a.progress === 'string' ? a.progress : `${progressNum}%`)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(overview.totalTrips || 0) === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <p className="text-5xl">🌍</p>
          <p className="mt-4 text-lg font-semibold text-slate-600">No trips yet!</p>
          <p className="mt-1 text-slate-400">Book your first trip to start building your travel profile.</p>
        </div>
      )}
    </div>
  );
}
