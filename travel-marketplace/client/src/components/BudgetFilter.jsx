import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, mediaUrl } from '../utils/api';

const BUDGET_RANGES = [
  { label: 'Less than ₹10,000', min: 0, max: 10000, icon: '💰' },
  { label: '₹10,000 – ₹20,000', min: 10000, max: 20000, icon: '💰' },
  { label: '₹20,000 – ₹40,000', min: 20000, max: 40000, icon: '💎' },
  { label: '₹40,000 – ₹60,000', min: 40000, max: 60000, icon: '💎' },
  { label: '₹60,000 – ₹80,000', min: 60000, max: 80000, icon: '✨' },
  { label: 'Above ₹80,000', min: 80000, max: null, icon: '✨' },
];

export default function BudgetFilter() {
  const [selectedIndex, setSelectedIndex] = useState(1); // default ₹10k–₹20k
  const [packages, setPackages] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchPackages();
  }, [selectedIndex]);

  async function fetchPackages() {
    setLoading(true);
    try {
      const range = BUDGET_RANGES[selectedIndex];
      let url = `/api/packages/by-budget?min=${range.min}&limit=10`;
      if (range.max) url += `&max=${range.max}`;
      const data = await apiFetch(url);
      setPackages(data.packages || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch packages by budget:', err);
    } finally {
      setLoading(false);
    }
  }

  function scroll(direction) {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -320 : 320,
        behavior: 'smooth',
      });
    }
  }

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">
          Best priced packages within your <span className="text-emerald-600">BUDGET</span>
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Select a budget range to discover the best travel packages for you
        </p>

        {/* Budget Chips */}
        <div className="mt-8 flex flex-wrap gap-3">
          {BUDGET_RANGES.map((range, index) => (
            <button
              key={range.label}
              onClick={() => setSelectedIndex(index)}
              className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
                index === selectedIndex
                  ? 'border-emerald-500 bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-105'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:scale-102'
              }`}
            >
              <span className="text-base">{range.icon}</span>
              {range.label}
            </button>
          ))}
        </div>

        {/* Result Count + View All */}
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-700">{total}</span> packages found
          </p>
          <Link
            to="/app/packages"
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            View All →
          </Link>
        </div>

        {/* Packages Carousel */}
        <div className="relative mt-6">
          {packages.length > 3 && (
            <>
              <button
                onClick={() => scroll('left')}
                className="absolute -left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg border border-slate-200 text-slate-600 transition-all hover:bg-slate-50 hover:shadow-xl"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => scroll('right')}
                className="absolute -right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg border border-slate-200 text-slate-600 transition-all hover:bg-slate-50 hover:shadow-xl"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto scroll-smooth pb-4 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="min-w-[290px] max-w-[290px] animate-pulse rounded-xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="h-44 rounded-t-xl bg-slate-200" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-slate-200" />
                      <div className="h-3 w-1/2 rounded bg-slate-200" />
                    </div>
                  </div>
                ))
              : packages.map((pkg) => {
                  const bestOffer = (pkg.offers || []).reduce((best, cur) => {
                    return Number(cur?.discountPercent || 0) > Number(best?.discountPercent || 0) ? cur : best;
                  }, null);
                  const discountPct = Number(bestOffer?.discountPercent || 0);
                  const discountedPrice = discountPct > 0 ? Math.round(pkg.price * (1 - discountPct / 100)) : null;

                  return (
                    <Link
                      key={pkg._id}
                      to={`/app/packages/${pkg._id}`}
                      className="group min-w-[290px] max-w-[290px] flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                    >
                      {/* Image */}
                      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600">
                        {pkg.imageUrl && (
                          <img
                            src={mediaUrl(pkg.imageUrl)}
                            alt={pkg.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        {/* Destination badge */}
                        <div className="absolute bottom-3 left-3">
                          <span className="inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                            📍 {pkg.destination}
                            {pkg.duration && ` · ${pkg.duration}D/${Math.max(pkg.duration - 1, 1)}N`}
                          </span>
                        </div>
                        {/* Rating badge */}
                        {pkg.rating > 0 && (
                          <div className="absolute top-3 left-3">
                            <span className="inline-flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-slate-800 backdrop-blur-sm shadow-sm">
                              <svg className="h-3 w-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                              {Number(pkg.rating).toFixed(1)}
                            </span>
                          </div>
                        )}
                        {/* Discount badge */}
                        {discountPct > 0 && (
                          <div className="absolute top-3 right-3">
                            <span className="rounded-lg bg-rose-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
                              {discountPct}% OFF
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="text-sm font-bold text-slate-800 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                          {pkg.title}
                        </h3>
                        <div className="mt-2 flex items-baseline gap-2">
                          {discountedPrice ? (
                            <>
                              <span className="text-xs text-slate-400 line-through">₹{pkg.price?.toLocaleString('en-IN')}</span>
                              <span className="text-lg font-bold text-emerald-700">₹{discountedPrice?.toLocaleString('en-IN')}/-</span>
                            </>
                          ) : (
                            <span className="text-lg font-bold text-emerald-700">₹{pkg.price?.toLocaleString('en-IN')}/-</span>
                          )}
                          <span className="text-xs text-slate-500">per person</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
            {!loading && packages.length === 0 && (
              <div className="flex w-full items-center justify-center py-12 text-slate-500">
                No packages found in this budget range.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
