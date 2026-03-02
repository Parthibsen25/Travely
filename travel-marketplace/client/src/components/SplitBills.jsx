import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';

const CATEGORY_ICONS = {
  Transport: '🚆', Accommodation: '🏨', Food: '🍽️', Activities: '🎯',
  Shopping: '🛍️', Insurance: '🛡️', Visa: '📋', Other: '📦'
};

function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency, maximumFractionDigits: 0
  }).format(Number(amount || 0));
}

export default function SplitBills({ trip, onUpdate }) {
  const [settlements, setSettlements] = useState([]);
  const [personSummary, setPersonSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const names = trip?.travelerNames || [];
  const hasExpenses = (trip?.dailyExpenses || []).length > 0;
  const currency = trip?.currency || 'INR';

  useEffect(() => {
    if (trip?._id && names.length >= 2 && hasExpenses) {
      loadSettlements();
    } else {
      setLoading(false);
    }
  }, [trip?._id, trip?.dailyExpenses?.length]);

  async function loadSettlements() {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/custom-trips/${trip._id}/settlements`);
      setSettlements(data.settlements || []);
      setPersonSummary(data.personSummary || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function copySummary() {
    let text = `💰 Split Bills — ${trip.title}\n\n`;
    text += `👥 ${names.length} travelers\n\n`;

    if (personSummary.length) {
      text += `📊 Summary:\n`;
      personSummary.forEach((p) => {
        text += `  • ${p.name}: Paid ${formatCurrency(p.paid, currency)} | Owes ${formatCurrency(p.owes, currency)} | Balance: ${p.balance >= 0 ? '+' : ''}${formatCurrency(p.balance, currency)}\n`;
      });
    }

    if (settlements.length) {
      text += `\n💸 Settlements:\n`;
      settlements.forEach((s) => {
        text += `  • ${s.from} → ${s.to}: ${formatCurrency(s.amount, currency)}\n`;
      });
    }

    text += `\n— via Travely`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Not enough travelers
  if (names.length < 2) {
    return (
      <div className="space-y-5 animate-page-enter">
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
          <span className="text-4xl">👥</span>
          <h3 className="mt-3 text-lg font-semibold text-slate-700">Add at least 2 travelers</h3>
          <p className="mt-1 text-sm text-slate-400">
            Edit your trip and add traveler names to enable the split bills feature.
          </p>
        </div>
      </div>
    );
  }

  // No expenses yet
  if (!hasExpenses) {
    return (
      <div className="space-y-5 animate-page-enter">
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
          <span className="text-4xl">💳</span>
          <h3 className="mt-3 text-lg font-semibold text-slate-700">No expenses to split</h3>
          <p className="mt-1 text-sm text-slate-400">
            Log expenses in the Expenses tab first, then come back to see who owes whom.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600" />
      </div>
    );
  }

  const totalExpenses = (trip.dailyExpenses || []).reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-5 animate-page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-bold text-slate-900">Split Bills</h3>
          <p className="text-sm text-slate-500">
            {names.length} travelers · {(trip.dailyExpenses || []).length} expenses · {formatCurrency(totalExpenses, currency)} total
          </p>
        </div>
        <button onClick={copySummary}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-card transition hover:shadow-md">
          {copied ? '✓ Copied' : '📋 Copy Summary'}
        </button>
      </div>

      {/* Person Summary Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {personSummary.map((p) => (
          <div key={p.name}
            className={`rounded-2xl border p-5 shadow-card transition ${
              p.balance > 0 ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white'
                : p.balance < 0 ? 'border-rose-200 bg-gradient-to-br from-rose-50/80 to-white'
                : 'border-slate-200 bg-white'
            }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shadow-md ${
                  p.balance > 0 ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                    : p.balance < 0 ? 'bg-gradient-to-br from-rose-500 to-rose-600'
                    : 'bg-gradient-to-br from-slate-400 to-slate-500'
                }`}>
                  {p.name.charAt(0).toUpperCase()}
                </span>
                <span className="text-sm font-bold text-slate-800">{p.name}</span>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                p.balance > 0 ? 'bg-emerald-100 text-emerald-700'
                  : p.balance < 0 ? 'bg-rose-100 text-rose-700'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {p.balance > 0 ? 'Gets back' : p.balance < 0 ? 'Owes' : 'Settled'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-white/80 p-2">
                <p className="text-[10px] font-semibold uppercase text-slate-400">Paid</p>
                <p className="text-sm font-bold text-slate-900">{formatCurrency(p.paid, currency)}</p>
              </div>
              <div className="rounded-lg bg-white/80 p-2">
                <p className="text-[10px] font-semibold uppercase text-slate-400">Share</p>
                <p className="text-sm font-bold text-slate-900">{formatCurrency(p.owes, currency)}</p>
              </div>
              <div className="rounded-lg bg-white/80 p-2">
                <p className="text-[10px] font-semibold uppercase text-slate-400">Net</p>
                <p className={`text-sm font-bold ${
                  p.balance > 0 ? 'text-emerald-600' : p.balance < 0 ? 'text-rose-600' : 'text-slate-600'
                }`}>
                  {p.balance >= 0 ? '+' : ''}{formatCurrency(p.balance, currency)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Settlement Transactions */}
      {settlements.length > 0 ? (
        <div className="rounded-2xl border border-slate-200/60 bg-white shadow-card overflow-hidden">
          <div className="border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4">
            <h3 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
              💸 Settlement Plan
              <span className="text-xs font-normal text-slate-500">
                ({settlements.length} transaction{settlements.length !== 1 ? 's' : ''})
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Minimal transfers to settle all debts</p>
          </div>
          <div className="divide-y divide-slate-50">
            {settlements.map((s, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 transition hover:bg-slate-50/40">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-700">
                  {s.from.charAt(0).toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">{s.from}</span>
                    <svg className="h-4 w-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    <span className="text-sm font-bold text-slate-800">{s.to}</span>
                  </div>
                  <p className="text-xs text-slate-400">pays</p>
                </div>
                <span className="text-lg font-bold text-amber-600">{formatCurrency(s.amount, currency)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <span className="text-3xl">✅</span>
          <h3 className="mt-2 text-base font-bold text-emerald-700">All settled!</h3>
          <p className="text-sm text-emerald-600">Everyone has paid their fair share.</p>
        </div>
      )}

      {/* Unassigned expenses warning */}
      {(() => {
        const unassigned = (trip.dailyExpenses || []).filter((e) => !e.paidBy || !names.includes(e.paidBy));
        if (unassigned.length === 0) return null;
        const total = unassigned.reduce((s, e) => s + e.amount, 0);
        return (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {unassigned.length} expense{unassigned.length !== 1 ? 's' : ''} ({formatCurrency(total, currency)}) not assigned to any traveler
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                Go to the Expenses tab and set "Who paid?" for accurate split calculations.
              </p>
            </div>
          </div>
        );
      })()}

      {/* How it works */}
      <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-card">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">How Split Bills Works</h4>
        <div className="grid gap-3 sm:grid-cols-3 text-center">
          {[
            { icon: '💳', title: 'Track who paid', desc: 'Set "Paid by" on each expense' },
            { icon: '➗', title: 'Equal splits', desc: 'Each expense splits equally among travelers' },
            { icon: '💸', title: 'Smart settlements', desc: 'Minimum transfers to settle all debts' },
          ].map((item) => (
            <div key={item.title} className="rounded-xl bg-slate-50 p-3">
              <span className="text-xl">{item.icon}</span>
              <h5 className="mt-1 text-xs font-bold text-slate-700">{item.title}</h5>
              <p className="text-[11px] text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
