import React, { useContext, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const CATEGORY_ICONS = {
  Transport: '🚆', Accommodation: '🏨', Food: '🍽️', Activities: '🎯',
  Shopping: '🛍️', Insurance: '🛡️', Visa: '📋', Other: '📦'
};

function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency, maximumFractionDigits: 0
  }).format(Number(amount || 0));
}

export default function SharedTripPage() {
  const { token } = useParams();
  const { user } = useContext(AuthContext);
  const [trip, setTrip] = useState(null);
  const [settlements, setSettlements] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    loadTrip();
  }, [token]);

  async function loadTrip() {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/custom-trips/shared/${token}`);
      setTrip(data.trip);
      // Check if user is already a collaborator
      if (user && data.trip.collaborators?.some((c) => c.userId === user._id)) {
        setJoined(true);
      }
    } catch (err) {
      setError(err.message || 'Trip not found or sharing is disabled.');
    } finally {
      setLoading(false);
    }
  }

  async function loadSettlements() {
    try {
      const data = await apiFetch(`/api/custom-trips/shared/${token}/settlements`);
      setSettlements(data);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (trip && tab === 'splits') loadSettlements();
  }, [tab, trip]);

  async function handleJoin() {
    if (!user) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }
    setJoining(true);
    try {
      await apiFetch(`/api/custom-trips/shared/${token}/join`, { method: 'POST' });
      setJoined(true);
      loadTrip();
    } catch (err) {
      setError(err.message);
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600" />
          <p className="mt-4 text-sm text-slate-500">Loading shared trip...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-lg">
          <span className="text-4xl">🔒</span>
          <h2 className="mt-3 text-xl font-bold text-slate-900">Sharing Unavailable</h2>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
          <Link to="/app/plan-trip"
            className="mt-4 inline-block rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow transition hover:shadow-lg">
            Plan Your Own Trip
          </Link>
        </div>
      </div>
    );
  }

  if (!trip) return null;

  const currency = trip.currency || 'INR';
  const totalBudget = trip.totalBudget || 0;
  const totalActual = trip.totalActual || 0;
  const remaining = totalBudget - totalActual;
  const budgetPct = totalBudget > 0 ? Math.min((totalActual / totalBudget) * 100, 100) : 0;
  const names = trip.travelerNames || [];
  const TABS = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'budget', label: 'Budget', icon: '💰' },
    { key: 'expenses', label: 'Expenses', icon: '💳' },
    { key: 'checklist', label: 'Checklist', icon: '✅' },
    ...(names.length >= 2 ? [{ key: 'splits', label: 'Split Bills', icon: '💸' }] : [])
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50/30 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-bold text-cyan-700">Shared Trip</span>
                {trip.isShared && <span className="text-green-500 text-xs">● Live</span>}
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{trip.title}</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {trip.destination && `📍 ${trip.destination} · `}
                {trip.travelers} traveler{trip.travelers !== 1 ? 's' : ''} · {trip.budgetItems?.length || 0} budget items
              </p>
            </div>
            {!joined && user && (
              <button onClick={handleJoin} disabled={joining}
                className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow transition hover:shadow-lg disabled:opacity-50">
                {joining ? 'Joining...' : '🤝 Join as Collaborator'}
              </button>
            )}
            {!user && (
              <button onClick={handleJoin}
                className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow transition hover:shadow-lg">
                🔑 Login to Collaborate
              </button>
            )}
            {joined && (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700">
                ✓ Collaborator
              </span>
            )}
          </div>

          {/* Budget bar */}
          <div className="mt-4 rounded-xl bg-slate-50 p-3">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-slate-500">Budget: {formatCurrency(totalBudget, currency)}</span>
              <span className={remaining >= 0 ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                {remaining >= 0 ? `${formatCurrency(remaining, currency)} left` : `${formatCurrency(-remaining, currency)} over`}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${budgetPct > 90 ? 'bg-rose-500' : budgetPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${budgetPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-100">
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition ${
                  tab === t.key ? 'border-cyan-500 text-cyan-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}>
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 pt-6">
        {tab === 'overview' && (
          <div className="space-y-5 animate-page-enter">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Budget', value: formatCurrency(totalBudget, currency), color: 'bg-cyan-50 text-cyan-700' },
                { label: 'Spent', value: formatCurrency(totalActual, currency), color: 'bg-amber-50 text-amber-700' },
                { label: 'Remaining', value: formatCurrency(Math.max(0, remaining), currency), color: remaining >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700' },
                { label: 'Travelers', value: names.length || trip.travelers, color: 'bg-indigo-50 text-indigo-700' },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
                  <p className="text-[10px] font-bold uppercase opacity-60">{s.label}</p>
                  <p className="text-lg font-bold mt-1">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Collaborators */}
            {trip.collaborators?.length > 0 && (
              <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-card">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Collaborators ({trip.collaborators.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {trip.collaborators.map((c) => (
                    <span key={c._id} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-white">
                        {(c.name || '?').charAt(0).toUpperCase()}
                      </span>
                      {c.name || 'Anonymous'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Traveler names */}
            {names.length > 0 && (
              <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-card">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Travelers</h4>
                <div className="flex flex-wrap gap-2">
                  {names.map((n) => (
                    <span key={n} className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">{n}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'budget' && (
          <div className="space-y-3 animate-page-enter">
            {(trip.budgetItems || []).map((item, i) => {
              const pct = totalBudget > 0 ? ((item.amount / totalBudget) * 100).toFixed(0) : 0;
              return (
                <div key={i} className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{CATEGORY_ICONS[item.category] || '📦'}</span>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{item.category}</p>
                        {item.description && <p className="text-xs text-slate-500">{item.description}</p>}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{formatCurrency(item.amount, currency)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-400"
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {(!trip.budgetItems || trip.budgetItems.length === 0) && (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
                <p className="text-sm text-slate-400">No budget items yet.</p>
              </div>
            )}
          </div>
        )}

        {tab === 'expenses' && (
          <div className="space-y-2 animate-page-enter">
            {(trip.dailyExpenses || []).length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
                <p className="text-sm text-slate-400">No expenses logged yet.</p>
              </div>
            ) : (
              (trip.dailyExpenses || []).map((e, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                  <span className="text-xl">{CATEGORY_ICONS[e.category] || '📦'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{e.description || e.category}</p>
                    <p className="text-xs text-slate-400">
                      Day {e.day} · {e.paidBy || 'Unknown'}
                      {e.splitType && e.splitType !== 'equal' && ` · ${e.splitType} split`}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{formatCurrency(e.amount, currency)}</span>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'checklist' && (
          <div className="space-y-2 animate-page-enter">
            {(trip.checklist || []).length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
                <p className="text-sm text-slate-400">No checklist items.</p>
              </div>
            ) : (
              (trip.checklist || []).map((c, i) => (
                <div key={i} className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition ${
                  c.done ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-100 bg-white'
                }`}>
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    c.done ? 'bg-emerald-500 text-white' : 'border-2 border-slate-300'
                  }`}>
                    {c.done && '✓'}
                  </span>
                  <span className={`text-sm ${c.done ? 'text-slate-500 line-through' : 'text-slate-800 font-medium'}`}>{c.text}</span>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'splits' && (
          <div className="space-y-5 animate-page-enter">
            {!settlements ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600" />
              </div>
            ) : (
              <>
                {/* Person Summary */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {(settlements.personSummary || []).map((p) => (
                    <div key={p.name}
                      className={`rounded-2xl border p-4 ${
                        p.balance > 0 ? 'border-emerald-200 bg-emerald-50/80'
                          : p.balance < 0 ? 'border-rose-200 bg-rose-50/80'
                          : 'border-slate-200 bg-white'
                      }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${
                          p.balance > 0 ? 'bg-emerald-500' : p.balance < 0 ? 'bg-rose-500' : 'bg-slate-400'
                        }`}>
                          {p.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="text-sm font-bold text-slate-800">{p.name}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div><p className="text-slate-400">Paid</p><p className="font-bold">{formatCurrency(p.paid, currency)}</p></div>
                        <div><p className="text-slate-400">Share</p><p className="font-bold">{formatCurrency(p.owes, currency)}</p></div>
                        <div><p className="text-slate-400">Net</p><p className={`font-bold ${p.balance > 0 ? 'text-emerald-600' : p.balance < 0 ? 'text-rose-600' : ''}`}>{p.balance >= 0 ? '+' : ''}{formatCurrency(p.balance, currency)}</p></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Settlements */}
                {(settlements.settlements || []).length > 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white shadow-card overflow-hidden">
                    <div className="border-b border-slate-100 bg-amber-50 px-5 py-3">
                      <h4 className="text-sm font-bold text-slate-700">💸 Settlement Plan</h4>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {settlements.settlements.map((s, i) => (
                        <div key={i} className="flex items-center gap-4 px-5 py-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-700">{s.from.charAt(0)}</span>
                          <span className="text-sm font-semibold text-slate-800">{s.from}</span>
                          <span className="text-slate-300">→</span>
                          <span className="text-sm font-semibold text-slate-800">{s.to}</span>
                          <span className="ml-auto text-base font-bold text-amber-600">{formatCurrency(s.amount, currency)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                    <span className="text-2xl">✅</span>
                    <p className="text-sm font-bold text-emerald-700 mt-1">All settled!</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
