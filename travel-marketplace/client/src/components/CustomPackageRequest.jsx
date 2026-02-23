import React, { useState } from 'react';
import { apiFetch } from '../utils/api';
import { useToast } from '../context/ToastContext';

const STEPS = ['Where', 'When', 'Details', 'Done'];

const THEME_OPTIONS = [
  'beach', 'hill-station', 'wildlife', 'heritage', 'pilgrimage',
  'honeymoon', 'family', 'adventure', 'luxury', 'backpacking',
];

const CATEGORY_OPTIONS = [
  { value: 'adventure', label: 'Adventure' },
  { value: 'relaxation', label: 'Relaxation' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'romantic', label: 'Romantic' },
  { value: 'budget', label: 'Budget' },
];

export default function CustomPackageRequest() {
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    destination: '',
    exploringDestinations: false,
    departureCity: '',
    dateType: 'anytime',
    departureDate: '',
    returnDate: '',
    numberOfDays: 5,
    bookedTickets: false,
    flexibleYear: new Date().getFullYear(),
    flexibleMonth: null,
    flexibleWeek: null,
    travelers: 1,
    budgetPerPerson: '',
    category: '',
    themes: [],
    specialRequirements: '',
  });

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const WEEKS = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleTheme(theme) {
    setForm((prev) => ({
      ...prev,
      themes: prev.themes.includes(theme)
        ? prev.themes.filter((t) => t !== theme)
        : [...prev.themes, theme],
    }));
  }

  function canNext() {
    if (step === 0) {
      return form.exploringDestinations || form.destination.trim().length > 0;
    }
    return true;
  }

  function next() {
    if (step < STEPS.length - 2) setStep(step + 1);
    else handleSubmit();
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await apiFetch('/api/package-requests', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setSubmitted(true);
      showToast('Request submitted! Agencies will send you quotes.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to submit request', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setForm({
      destination: '',
      exploringDestinations: false,
      departureCity: '',
      dateType: 'anytime',
      departureDate: '',
      returnDate: '',
      numberOfDays: 5,
      bookedTickets: false,
      flexibleYear: new Date().getFullYear(),
      flexibleMonth: null,
      flexibleWeek: null,
      travelers: 1,
      budgetPerPerson: '',
      category: '',
      themes: [],
      specialRequirements: '',
    });
    setStep(0);
    setSubmitted(false);
  }

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <section className="bg-gradient-to-br from-slate-50 to-cyan-50/40 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          {/* Left — CTA illustration area */}
          <div className="text-center lg:text-left">
            {/* Illustration */}
            <div className="mx-auto mb-6 flex h-56 w-56 items-center justify-center lg:mx-0">
              <svg className="h-full w-full" viewBox="0 0 200 200" fill="none">
                {/* Desk */}
                <rect x="40" y="140" width="120" height="8" rx="4" fill="#e2e8f0" />
                {/* Person body */}
                <rect x="70" y="80" width="46" height="60" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
                {/* Tie */}
                <polygon points="93,90 97,90 97,120 95,125 93,120" fill="#0d9488" />
                <polygon points="89,86 101,86 97,90 93,90" fill="#0d9488" />
                {/* Head */}
                <circle cx="95" cy="62" r="20" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
                {/* Hair */}
                <path d="M75 55 Q80 35 95 38 Q110 35 115 55" fill="#0d9488" />
                {/* Eyes */}
                <circle cx="88" cy="63" r="2" fill="#334155" />
                <circle cx="102" cy="63" r="2" fill="#334155" />
                {/* Smile */}
                <path d="M89 72 Q95 78 101 72" stroke="#334155" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                {/* Arm pointing right */}
                <path d="M116 100 L145 95 L150 90" stroke="#cbd5e1" strokeWidth="3" fill="none" strokeLinecap="round" />
                {/* Hand */}
                <circle cx="150" cy="90" r="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
                {/* Question marks */}
                <text x="55" y="45" fontSize="18" fill="#0d9488" fontWeight="bold">?</text>
                <text x="130" y="35" fontSize="22" fill="#0d9488" fontWeight="bold">?</text>
                <text x="40" y="30" fontSize="14" fill="#94a3b8">?</text>
                {/* Floating icons */}
                <rect x="30" y="60" width="16" height="12" rx="2" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
                <rect x="145" y="55" width="16" height="12" rx="2" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
                <circle cx="38" cy="66" r="3" fill="none" stroke="#94a3b8" strokeWidth="1" />
                <rect x="155" y="70" width="14" height="10" rx="2" fill="none" stroke="#94a3b8" strokeWidth="1" />
              </svg>
            </div>

            <h2 className="font-display text-2xl font-bold text-teal-700 sm:text-3xl lg:text-4xl">
              Our experts would love to create a package just for you!
            </h2>
            <p className="mt-3 text-base font-semibold text-slate-700">
              Fill in your requirements here →
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Tell us your dream destination and budget. Multiple travel agencies will compete to create the perfect package for you.
            </p>
          </div>

          {/* Right — Multi-step form card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
            {submitted ? (
              /* ── Success state ── */
              <div className="flex flex-col items-center py-8 text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-bold text-slate-900">Request Submitted!</h3>
                <p className="mt-2 max-w-sm text-sm text-slate-500">
                  Agencies have been notified. You'll receive quotes and suggestions in your notifications. Check back soon!
                </p>
                <button
                  onClick={reset}
                  className="mt-6 rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
                >
                  Submit Another Request
                </button>
              </div>
            ) : (
              <>
                {/* Map pin icon + header */}
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-3 inline-flex h-16 w-16 items-center justify-center rounded-full bg-teal-50">
                    <svg className="h-9 w-9 text-teal-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                  </div>
                  <h3 className="font-display text-lg font-bold text-teal-700">
                    {step === 0 && 'Where do you want to go?'}
                    {step === 1 && 'When do you want to travel?'}
                    {step === 2 && 'Tell us more about your trip'}
                  </h3>
                </div>

                {/* Step indicators */}
                <div className="mb-6 flex items-center justify-center gap-2">
                  {STEPS.slice(0, -1).map((s, i) => (
                    <div key={s} className="flex items-center gap-2">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                          i <= step
                            ? 'bg-teal-600 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {i < step ? (
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          i + 1
                        )}
                      </div>
                      {i < STEPS.length - 2 && (
                        <div className={`h-0.5 w-8 rounded ${i < step ? 'bg-teal-500' : 'bg-slate-200'}`} />
                      )}
                    </div>
                  ))}
                </div>

                {/* ── Step 0: Where ── */}
                {step === 0 && (
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">To</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </span>
                        <input
                          type="text"
                          placeholder="Enter destination (e.g. Goa, Manali)"
                          value={form.destination}
                          onChange={(e) => update('destination', e.target.value)}
                          disabled={form.exploringDestinations}
                          className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200 disabled:bg-slate-50 disabled:text-slate-400"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.exploringDestinations}
                        onChange={(e) => {
                          update('exploringDestinations', e.target.checked);
                          if (e.target.checked) update('destination', '');
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-sm text-slate-600">I am exploring destinations</span>
                    </label>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">From</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </span>
                        <input
                          type="text"
                          placeholder="Departure city (e.g. Mumbai, Delhi)"
                          value={form.departureCity}
                          onChange={(e) => update('departureCity', e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Departure Date <span className="font-normal text-slate-400">(Choose Any)</span>
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {['fixed', 'flexible', 'anytime'].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => update('dateType', type)}
                            className={`rounded-xl px-4 py-2.5 text-sm font-semibold capitalize transition-all ${
                              form.dateType === type
                                ? 'bg-teal-600 text-white shadow-md'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Flexible: month + week picker */}
                    {form.dateType === 'flexible' && (
                      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                        {/* Year header */}
                        <div className="flex items-center justify-between rounded-t-xl bg-teal-600 px-4 py-2.5">
                          <button
                            type="button"
                            onClick={() => update('flexibleYear', form.flexibleYear - 1)}
                            className="text-white/80 hover:text-white transition"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                          </button>
                          <span className="text-sm font-bold text-white">{form.flexibleYear}</span>
                          <button
                            type="button"
                            onClick={() => update('flexibleYear', form.flexibleYear + 1)}
                            className="text-white/80 hover:text-white transition"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                          </button>
                        </div>

                        {/* Month grid */}
                        {form.flexibleMonth === null ? (
                          <div className="grid grid-cols-3 gap-px bg-slate-100 p-px">
                            {MONTHS.map((m, i) => {
                              const now = new Date();
                              const isPast = form.flexibleYear === now.getFullYear() && i < now.getMonth();
                              return (
                                <button
                                  key={m}
                                  type="button"
                                  disabled={isPast}
                                  onClick={() => { update('flexibleMonth', i); update('flexibleWeek', null); }}
                                  className={`py-3 text-sm font-medium transition ${
                                    isPast
                                      ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                                      : 'bg-white text-slate-700 hover:bg-teal-50 hover:text-teal-700'
                                  }`}
                                >
                                  {m}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          /* Week selector */
                          <div className="p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => { update('flexibleMonth', null); update('flexibleWeek', null); }}
                                className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 transition"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                Back to months
                              </button>
                              <span className="text-sm font-bold text-slate-700">
                                {MONTHS[form.flexibleMonth]} {form.flexibleYear}
                              </span>
                            </div>
                            <p className="mb-3 text-center text-xs text-slate-500">Which week works best?</p>
                            <div className="grid grid-cols-2 gap-2">
                              {WEEKS.map((w, i) => (
                                <button
                                  key={w}
                                  type="button"
                                  onClick={() => update('flexibleWeek', i + 1)}
                                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                                    form.flexibleWeek === i + 1
                                      ? 'bg-teal-600 text-white shadow-md'
                                      : 'bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700'
                                  }`}
                                >
                                  {w}
                                </button>
                              ))}
                            </div>
                            {form.flexibleWeek && (
                              <p className="mt-3 text-center text-xs font-medium text-teal-600">
                                ✓ {WEEKS[form.flexibleWeek - 1]} of {MONTHS[form.flexibleMonth]} {form.flexibleYear}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Fixed date: departure date + number of days + booked tickets */}
                    {form.dateType === 'fixed' && (
                      <>
                        <div className="grid grid-cols-5 gap-3">
                          <div className="col-span-3">
                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                              Departure Date <span className="font-normal text-slate-400">(Choose Any)</span>
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              </span>
                              <input
                                type="date"
                                min={minDate}
                                value={form.departureDate}
                                onChange={(e) => update('departureDate', e.target.value)}
                                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                              />
                            </div>
                          </div>
                          <div className="col-span-2">
                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Number Of Days</label>
                            <div className="flex items-center rounded-xl border border-slate-300 bg-white">
                              <button
                                type="button"
                                onClick={() => update('numberOfDays', Math.max(1, form.numberOfDays - 1))}
                                className="flex h-[46px] w-10 items-center justify-center text-teal-600 hover:bg-slate-50 rounded-l-xl transition"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" d="M5 12h14" /></svg>
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={form.numberOfDays}
                                onChange={(e) => update('numberOfDays', Math.max(1, Number(e.target.value) || 1))}
                                className="w-full border-x border-slate-300 py-3 text-center text-sm font-semibold outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => update('numberOfDays', form.numberOfDays + 1)}
                                className="flex h-[46px] w-10 items-center justify-center text-teal-600 hover:bg-slate-50 rounded-r-xl transition"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" d="M12 5v14M5 12h14" /></svg>
                              </button>
                            </div>
                          </div>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.bookedTickets}
                            onChange={(e) => update('bookedTickets', e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span className="text-sm text-slate-600">I have booked my travel tickets</span>
                        </label>
                      </>
                    )}
                  </div>
                )}

                {/* ── Step 1: When ── */}
                {step === 1 && (
                  <div className="space-y-4">
                    {form.dateType === 'anytime' && (
                      <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-center">
                        <p className="text-sm text-teal-700 font-medium">
                          You're open to travel anytime — agencies will propose available dates.
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Number of Travelers</label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={form.travelers}
                          onChange={(e) => update('travelers', Math.max(1, Number(e.target.value) || 1))}
                          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Budget per Person (₹)</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 25000"
                          value={form.budgetPerPerson}
                          onChange={(e) => update('budgetPerPerson', e.target.value)}
                          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Step 2: Details ── */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">Trip Category</label>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORY_OPTIONS.map((cat) => (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => update('category', form.category === cat.value ? '' : cat.value)}
                            className={`rounded-full border px-4 py-2 text-xs font-semibold transition-all ${
                              form.category === cat.value
                                ? 'border-teal-500 bg-teal-600 text-white'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-teal-50'
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">Themes (select any)</label>
                      <div className="flex flex-wrap gap-2">
                        {THEME_OPTIONS.map((theme) => (
                          <button
                            key={theme}
                            type="button"
                            onClick={() => toggleTheme(theme)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                              form.themes.includes(theme)
                                ? 'border-teal-500 bg-teal-600 text-white'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-teal-50'
                            }`}
                          >
                            {theme.replace('-', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">Special Requirements</label>
                      <textarea
                        rows={3}
                        placeholder="Any specific requirements? E.g., wheelchair accessibility, vegetarian meals, adventure activities..."
                        value={form.specialRequirements}
                        onChange={(e) => update('specialRequirements', e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none resize-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                      />
                    </div>
                  </div>
                )}

                {/* Navigation buttons */}
                <div className="mt-6 flex gap-3">
                  {step > 0 && (
                    <button
                      type="button"
                      onClick={back}
                      className="flex-1 rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={next}
                    disabled={!canNext() || submitting}
                    className="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-rose-600 hover:to-red-600 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Submitting...
                      </>
                    ) : step === 2 ? (
                      'Submit Request'
                    ) : (
                      <>
                        Next
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
