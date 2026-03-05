import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch } from '../utils/api';

const STYLE_OPTIONS = [
  { value: 'backpacker', label: '🎒 Backpacker', desc: 'Hostels, street food, public transport' },
  { value: 'budget', label: '💰 Budget', desc: 'Budget hotels, local food, mix of transport' },
  { value: 'comfort', label: '🛋️ Comfort', desc: 'Mid-range stays, good restaurants' },
  { value: 'premium', label: '⭐ Premium', desc: 'Premium hotels, fine dining, private transport' },
  { value: 'luxury', label: '👑 Luxury', desc: 'Luxury resorts, gourmet, chauffeur-driven' },
];

const CATEGORY_ICONS = {
  Transport: '🚆', Accommodation: '🏨', Food: '🍽️', Activities: '🎯',
  Shopping: '🛍️', Insurance: '🛡️', Visa: '📋', Other: '📦'
};

function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency, maximumFractionDigits: 0
  }).format(Number(amount || 0));
}

export default function BudgetOptimizer({ isOpen, onClose, onApplyBudget }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    destination: '',
    totalBudget: '',
    days: '',
    travelers: '1',
    travelStyle: 'budget'
  });
  const [suggestions, setSuggestions] = useState([]);
  const [allDestinations, setAllDestinations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const destRef = useRef(null);
  const [showSugg, setShowSugg] = useState(false);

  // Load destinations for autocomplete
  useEffect(() => {
    if (isOpen) {
      apiFetch('/api/custom-trips/destinations')
        .then((data) => setAllDestinations(data.destinations || []))
        .catch(() => {});
    }
  }, [isOpen]);

  // Filter suggestions
  useEffect(() => {
    if (!form.destination || form.destination.length < 2) {
      setSuggestions([]);
      return;
    }
    const q = form.destination.toLowerCase();
    const matches = allDestinations.filter(
      (d) => d.name.toLowerCase().includes(q) || d.aliases?.some((a) => a.toLowerCase().includes(q))
    ).slice(0, 8);
    setSuggestions(matches);
  }, [form.destination, allDestinations]);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  function reset() {
    setStep(1);
    setForm({ destination: '', totalBudget: '', days: '', travelers: '1', travelStyle: 'budget' });
    setResult(null);
    setError('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleOptimize() {
    setError('');
    if (!form.destination.trim()) return setError('Enter a destination');
    if (!form.totalBudget || Number(form.totalBudget) < 1000) return setError('Budget must be at least ₹1,000');
    if (!form.days || Number(form.days) < 1) return setError('Enter number of days');

    setLoading(true);
    try {
      const data = await apiFetch('/api/custom-trips/optimize-budget', {
        method: 'POST',
        body: JSON.stringify({
          destination: form.destination.trim(),
          totalBudget: Number(form.totalBudget),
          days: Number(form.days),
          travelers: Number(form.travelers) || 1,
          travelStyle: form.travelStyle
        })
      });
      setResult(data);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Optimization failed');
    } finally {
      setLoading(false);
    }
  }

  function handleApply() {
    if (result && onApplyBudget) {
      onApplyBudget({
        title: `${result.destination} Trip`,
        destination: result.destination,
        totalBudget: result.totalBudget,
        travelers: Number(form.travelers) || 1,
        days: Number(form.days),
        budgetItems: result.budgetItems,
        currency: 'INR'
      });
    }
    handleClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center animate-page-enter">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 w-full max-h-[92vh] overflow-y-auto rounded-t-3xl border border-slate-200/60 bg-white shadow-2xl sm:mx-4 sm:max-w-2xl sm:rounded-3xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-violet-50 via-purple-50 to-indigo-50 px-4 py-3 rounded-t-3xl sm:px-6 sm:py-4">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2 sm:text-xl">
              ✨ AI Budget Optimizer
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5 sm:text-xs">Get a smart budget breakdown for your destination</p>
          </div>
          <button onClick={handleClose} className="rounded-xl p-2 text-slate-400 hover:bg-white/60 hover:text-slate-600 transition">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {step === 1 && (
            <div className="space-y-4 animate-page-enter sm:space-y-5">
              {/* Destination */}
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-700 mb-1 sm:text-sm sm:mb-1.5">📍 Destination</label>
                <input
                  ref={destRef}
                  type="text"
                  value={form.destination}
                  onChange={(e) => { setForm({ ...form, destination: e.target.value }); setShowSugg(true); }}
                  onFocus={() => setShowSugg(true)}
                  onBlur={() => setTimeout(() => setShowSugg(false), 200)}
                  placeholder="e.g. Goa, Manali, Thailand, Bali..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none transition sm:px-4 sm:py-3"
                />
                {showSugg && suggestions.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                    {suggestions.map((s) => (
                      <button key={s.name}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-violet-50 transition flex items-center justify-between"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { setForm({ ...form, destination: s.name }); setShowSugg(false); }}>
                        <span className="font-medium text-slate-800">{s.name}</span>
                        <span className="text-xs text-slate-400">{s.type === 'international' ? '🌏 International' : '🇮🇳 India'}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Budget & Days */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 sm:text-sm sm:mb-1.5">💰 Total Budget (₹)</label>
                  <input
                    type="number"
                    value={form.totalBudget}
                    onChange={(e) => setForm({ ...form, totalBudget: e.target.value })}
                    placeholder="e.g. 40000"
                    min="1000"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none transition sm:px-4 sm:py-3"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 sm:text-sm sm:mb-1.5">📅 Days</label>
                  <input
                    type="number"
                    value={form.days}
                    onChange={(e) => setForm({ ...form, days: e.target.value })}
                    placeholder="e.g. 4"
                    min="1" max="30"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none transition sm:px-4 sm:py-3"
                  />
                </div>
              </div>

              {/* Travelers */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 sm:text-sm sm:mb-1.5">👥 Travelers</label>
                <input
                  type="number"
                  value={form.travelers}
                  onChange={(e) => setForm({ ...form, travelers: e.target.value })}
                  min="1" max="20"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none transition sm:px-4 sm:py-3"
                />
              </div>

              {/* Travel Style */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 sm:text-sm sm:mb-2">🎨 Travel Style</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {STYLE_OPTIONS.map((opt) => (
                    <button key={opt.value}
                      onClick={() => setForm({ ...form, travelStyle: opt.value })}
                      className={`rounded-xl border p-2.5 text-left transition active:scale-95 sm:p-3 ${
                        form.travelStyle === opt.value
                          ? 'border-violet-400 bg-violet-50 ring-2 ring-violet-100'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}>
                      <span className="text-xs font-bold sm:text-sm">{opt.label}</span>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <button onClick={handleOptimize} disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 sm:px-6 sm:py-3.5">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Optimizing...
                  </span>
                ) : '✨ Optimize My Budget'}
              </button>
            </div>
          )}

          {step === 2 && result && (
            <div className="space-y-4 animate-page-enter sm:space-y-5">
              {/* Destination & Feasibility */}
              <div className="flex items-start justify-between gap-2 sm:items-center">
                <div>
                  <h3 className="text-base font-bold text-slate-900 sm:text-lg">{result.destination}</h3>
                  <p className="text-xs text-slate-500 sm:text-sm">
                    {form.days} days · {form.travelers} traveler{Number(form.travelers) !== 1 ? 's' : ''} · {STYLE_OPTIONS.find((o) => o.value === form.travelStyle)?.label || form.travelStyle}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold sm:px-3 sm:py-1.5 sm:text-xs ${
                  result.feasibility === 'comfortable' ? 'bg-emerald-100 text-emerald-700'
                    : result.feasibility === 'moderate' ? 'bg-amber-100 text-amber-700'
                    : result.feasibility === 'tight' ? 'bg-orange-100 text-orange-700'
                    : 'bg-rose-100 text-rose-700'
                }`}>
                  {result.feasibility === 'comfortable' ? '✅ Comfortable'
                    : result.feasibility === 'moderate' ? '👍 Moderate'
                    : result.feasibility === 'tight' ? '⚡ Tight Budget'
                    : '⚠️ Very Tight'}
                </span>
              </div>

              {/* Budget Breakdown */}
              <div className="rounded-2xl border border-slate-200/60 bg-white shadow-card overflow-hidden">
                <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5 flex items-center justify-between sm:px-5 sm:py-3">
                  <h4 className="text-xs font-bold text-slate-700 sm:text-sm">Budget Breakdown</h4>
                  <span className="text-xs font-bold text-violet-600 sm:text-sm">{formatCurrency(result.totalBudget)}</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {result.budgetItems?.map((item, i) => {
                    const pct = result.totalBudget > 0 ? ((item.amount / result.totalBudget) * 100).toFixed(0) : 0;
                    return (
                      <div key={i} className="px-3.5 py-2.5 hover:bg-slate-50/50 transition sm:px-5 sm:py-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-base sm:text-lg">{CATEGORY_ICONS[item.category] || '📦'}</span>
                            <div>
                              <span className="text-xs font-semibold text-slate-800 sm:text-sm">{item.category}</span>
                              {item.description && (
                                <p className="text-[11px] text-slate-500 leading-tight">{item.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-slate-900 sm:text-sm">{formatCurrency(item.amount)}</span>
                            <p className="text-[10px] text-slate-400">{pct}%</p>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-indigo-400 transition-all"
                            style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tips */}
              {result.tips?.length > 0 && (
                <div className="rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-50 to-yellow-50 p-3.5 sm:p-5">
                  <h4 className="text-xs font-bold text-amber-800 flex items-center gap-1.5 mb-2 sm:text-sm sm:mb-3">💡 Budget Tips</h4>
                  <ul className="space-y-1.5 sm:space-y-2">
                    {result.tips.map((tip, i) => (
                      <li key={i} className="text-xs text-amber-700 flex items-start gap-2 sm:text-sm">
                        <span className="mt-0.5 text-amber-500">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Per-person cost */}
              {Number(form.travelers) > 1 && (
                <div className="rounded-2xl border border-indigo-200/60 bg-indigo-50 p-3 text-center sm:p-4">
                  <p className="text-[10px] text-indigo-500 font-semibold uppercase sm:text-xs">Cost Per Person</p>
                  <p className="text-xl font-bold text-indigo-700 mt-0.5 sm:text-2xl sm:mt-1">
                    {formatCurrency(result.totalBudget / Number(form.travelers))}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                <button onClick={() => { setStep(1); setResult(null); }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95 sm:flex-1 sm:py-3 sm:text-sm">
                  ← Adjust & Retry
                </button>
                <button onClick={handleApply}
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg transition hover:shadow-xl active:scale-95 sm:flex-1 sm:py-3 sm:text-sm">
                  🚀 Create Trip with This Budget
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
