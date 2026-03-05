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
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-5 py-8 text-center sm:p-12">
          <span className="text-2xl sm:text-4xl">👥</span>
          <h3 className="mt-2 text-sm font-semibold text-slate-700 sm:mt-3 sm:text-lg">Add at least 2 travelers</h3>
          <p className="mt-1 text-[11px] text-slate-400 sm:text-sm">
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
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-5 py-8 text-center sm:p-12">
          <span className="text-2xl sm:text-4xl">💳</span>
          <h3 className="mt-2 text-sm font-semibold text-slate-700 sm:mt-3 sm:text-lg">No expenses to split</h3>
          <p className="mt-1 text-[11px] text-slate-400 sm:text-sm">
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
    <div className="space-y-4 animate-page-enter sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display text-base font-bold text-slate-900 sm:text-lg">Split Bills</h3>
          <p className="text-xs text-slate-500 sm:text-sm">
            {names.length} travelers · {(trip.dailyExpenses || []).length} expenses · {formatCurrency(totalExpenses, currency)} total
          </p>
        </div>
        <button onClick={copySummary}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-card transition hover:shadow-md active:scale-95 sm:px-4 sm:text-sm">
          {copied ? '✓ Copied' : '📋 Copy Summary'}
        </button>
      </div>

      {/* Person Summary Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {personSummary.map((p) => (
          <div key={p.name}
            className={`rounded-2xl border p-3.5 shadow-card transition sm:p-5 ${
              p.balance > 0 ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white'
                : p.balance < 0 ? 'border-rose-200 bg-gradient-to-br from-rose-50/80 to-white'
                : 'border-slate-200 bg-white'
            }`}>
            <div className="flex items-center justify-between mb-2.5 sm:mb-3">
              <div className="flex items-center gap-2">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-md sm:h-10 sm:w-10 sm:text-sm ${
                  p.balance > 0 ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                    : p.balance < 0 ? 'bg-gradient-to-br from-rose-500 to-rose-600'
                    : 'bg-gradient-to-br from-slate-400 to-slate-500'
                }`}>
                  {p.name.charAt(0).toUpperCase()}
                </span>
                <span className="text-xs font-bold text-slate-800 sm:text-sm">{p.name}</span>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold sm:px-3 sm:py-1 sm:text-xs ${
                p.balance > 0 ? 'bg-emerald-100 text-emerald-700'
                  : p.balance < 0 ? 'bg-rose-100 text-rose-700'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {p.balance > 0 ? 'Gets back' : p.balance < 0 ? 'Owes' : 'Settled'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-center sm:gap-2">
              <div className="rounded-lg bg-white/80 p-1.5 sm:p-2">
                <p className="text-[9px] font-semibold uppercase text-slate-400 sm:text-[10px]">Paid</p>
                <p className="text-xs font-bold text-slate-900 sm:text-sm">{formatCurrency(p.paid, currency)}</p>
              </div>
              <div className="rounded-lg bg-white/80 p-1.5 sm:p-2">
                <p className="text-[9px] font-semibold uppercase text-slate-400 sm:text-[10px]">Share</p>
                <p className="text-xs font-bold text-slate-900 sm:text-sm">{formatCurrency(p.owes, currency)}</p>
              </div>
              <div className="rounded-lg bg-white/80 p-1.5 sm:p-2">
                <p className="text-[9px] font-semibold uppercase text-slate-400 sm:text-[10px]">Net</p>
                <p className={`text-xs font-bold sm:text-sm ${
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
          <div className="border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 sm:px-6 sm:py-4">
            <h3 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2 sm:text-base">
              💸 Settlement Plan
              <span className="text-[10px] font-normal text-slate-500 sm:text-xs">
                ({settlements.length} transaction{settlements.length !== 1 ? 's' : ''})
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5 sm:text-xs">Minimal transfers to settle all debts</p>
          </div>
          <div className="divide-y divide-slate-50">
            {settlements.map((s, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3.5 py-3 transition hover:bg-slate-50/40 sm:gap-4 sm:px-6 sm:py-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[10px] font-bold text-rose-700 sm:h-8 sm:w-8 sm:text-xs">
                  {s.from.charAt(0).toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-xs font-bold text-slate-800 truncate sm:text-sm">{s.from}</span>
                    <svg className="h-3.5 w-3.5 shrink-0 text-slate-300 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    <span className="text-xs font-bold text-slate-800 truncate sm:text-sm">{s.to}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 sm:text-xs">pays</p>
                </div>
                <span className="shrink-0 text-sm font-bold text-amber-600 sm:text-lg">{formatCurrency(s.amount, currency)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center sm:p-6">
          <span className="text-2xl sm:text-3xl">✅</span>
          <h3 className="mt-1.5 text-sm font-bold text-emerald-700 sm:mt-2 sm:text-base">All settled!</h3>
          <p className="text-xs text-emerald-600 sm:text-sm">Everyone has paid their fair share.</p>
        </div>
      )}

      {/* Unassigned expenses warning */}
      {(() => {
        const unassigned = (trip.dailyExpenses || []).filter((e) => !e.paidBy || !names.includes(e.paidBy));
        if (unassigned.length === 0) return null;
        const total = unassigned.reduce((s, e) => s + e.amount, 0);
        return (
          <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3 sm:items-center sm:gap-3 sm:p-4">
            <span className="text-base sm:text-xl">⚠️</span>
            <div>
              <p className="text-xs font-semibold text-amber-800 sm:text-sm">
                {unassigned.length} expense{unassigned.length !== 1 ? 's' : ''} ({formatCurrency(total, currency)}) not assigned to any traveler
              </p>
              <p className="text-[10px] text-amber-600 mt-0.5 sm:text-xs">
                Go to the Expenses tab and set "Who paid?" for accurate split calculations.
              </p>
            </div>
          </div>
        );
      })()}

      {/* How it works */}
      <div className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-card sm:p-5">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 sm:text-xs sm:mb-3">How Split Bills Works</h4>
        <div className="grid gap-2 sm:grid-cols-3 sm:gap-3 text-center">
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
