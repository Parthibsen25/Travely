import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, mediaUrl } from '../utils/api';

const THEMES = [
  {
    value: 'beach',
    label: 'Beach',
    icon: '🏖️',
    gradient: 'from-cyan-400 to-blue-500',
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
  },
  {
    value: 'hill-station',
    label: 'Hill Station',
    icon: '⛰️',
    gradient: 'from-emerald-400 to-green-600',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
  },
  {
    value: 'wildlife',
    label: 'Wildlife',
    icon: '🦁',
    gradient: 'from-amber-400 to-orange-500',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
  },
  {
    value: 'heritage',
    label: 'Heritage',
    icon: '🏛️',
    gradient: 'from-purple-400 to-indigo-500',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
  },
  {
    value: 'pilgrimage',
    label: 'Pilgrimage',
    icon: '🙏',
    gradient: 'from-orange-400 to-red-500',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
  },
  {
    value: 'honeymoon',
    label: 'Honeymoon',
    icon: '💑',
    gradient: 'from-pink-400 to-rose-500',
    bg: 'bg-pink-50',
    text: 'text-pink-700',
  },
  {
    value: 'family',
    label: 'Family',
    icon: '👨‍👩‍👧‍👦',
    gradient: 'from-blue-400 to-indigo-500',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
  },
  {
    value: 'adventure',
    label: 'Adventure',
    icon: '🧗',
    gradient: 'from-red-400 to-orange-500',
    bg: 'bg-red-50',
    text: 'text-red-700',
  },
  {
    value: 'luxury',
    label: 'Luxury',
    icon: '✨',
    gradient: 'from-yellow-400 to-amber-500',
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
  },
  {
    value: 'backpacking',
    label: 'Backpacking',
    icon: '🎒',
    gradient: 'from-teal-400 to-cyan-600',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
  },
];

export default function ThemeBrowser() {
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [packages, setPackages] = useState([]);
  const [themeCounts, setThemeCounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    // Fetch theme counts on mount
    fetchThemeCounts();
  }, []);

  useEffect(() => {
    if (selectedTheme) {
      fetchPackages();
    }
  }, [selectedTheme]);

  async function fetchThemeCounts() {
    try {
      const data = await apiFetch('/api/packages/by-theme');
      setThemeCounts(data.themes || []);
    } catch (err) {
      console.error('Failed to fetch theme counts:', err);
    }
  }

  async function fetchPackages() {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/packages/by-theme?theme=${selectedTheme}&limit=10`);
      setPackages(data.packages || []);
    } catch (err) {
      console.error('Failed to fetch packages by theme:', err);
    } finally {
      setLoading(false);
    }
  }

  function getCount(themeValue) {
    const found = themeCounts.find((t) => t._id === themeValue);
    return found ? found.count : 0;
  }

  function scroll(direction) {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  }

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-cyan-600">Still undecided?</p>
        <div className="flex items-center gap-2">
          <h2 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">
            Browse packages through holiday <span className="text-cyan-600">THEMES</span>
          </h2>
          <span className="mt-1 h-3 w-3 rounded-full bg-amber-400" />
        </div>

        {/* Theme Cards Grid */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5">
          {THEMES.map((theme) => {
            const count = getCount(theme.value);
            const isSelected = selectedTheme === theme.value;
            return (
              <button
                key={theme.value}
                onClick={() =>
                  setSelectedTheme(isSelected ? null : theme.value)
                }
                className={`group relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-50 shadow-md'
                    : 'border-slate-200 bg-white hover:border-cyan-300'
                }`}
              >
                <span className="text-3xl">{theme.icon}</span>
                <span
                  className={`text-sm font-semibold transition-colors ${
                    isSelected ? 'text-cyan-700' : 'text-slate-700'
                  }`}
                >
                  {theme.label}
                </span>
                {count > 0 && (
                  <span className="text-xs text-slate-400">{count} packages</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Theme Packages */}
        {selectedTheme && (
          <div className="relative mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">
                {THEMES.find((t) => t.value === selectedTheme)?.icon}{' '}
                {THEMES.find((t) => t.value === selectedTheme)?.label} Packages
              </h3>
              <Link
                to={`/app/packages?theme=${selectedTheme}`}
                className="text-sm font-semibold text-cyan-600 hover:text-cyan-700 transition-colors"
              >
                View All →
              </Link>
            </div>

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
                : packages.map((pkg) => (
                    <Link
                      key={pkg._id}
                      to={`/app/packages/${pkg._id}`}
                      className="group min-w-[290px] max-w-[290px] flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                    >
                      {/* Image */}
                      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600">
                        {pkg.imageUrl && (
                          <img
                            src={mediaUrl(pkg.imageUrl)}
                            alt={pkg.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        {/* Theme badge */}
                        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                          {(pkg.themes || []).slice(0, 2).map((t) => {
                            const themeObj = THEMES.find((th) => th.value === t);
                            return (
                              <span
                                key={t}
                                className="inline-flex items-center gap-1 rounded-md bg-white/90 px-2 py-0.5 text-xs font-semibold text-slate-700 backdrop-blur-sm"
                              >
                                {themeObj?.icon} {themeObj?.label || t}
                              </span>
                            );
                          })}
                        </div>
                        <div className="absolute bottom-3 left-3">
                          <span className="inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                            {pkg.destination} ({pkg.duration} Days & {pkg.duration - 1} Nights)
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="text-sm font-bold text-slate-800 line-clamp-2 group-hover:text-cyan-700 transition-colors">
                          {pkg.title}
                        </h3>
                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="text-lg font-bold text-cyan-700">
                            ₹{pkg.price?.toLocaleString('en-IN')}/-
                          </span>
                          <span className="text-xs text-slate-500">per person</span>
                        </div>
                        {pkg.rating > 0 && (
                          <div className="mt-1 flex items-center gap-1">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`h-3.5 w-3.5 ${
                                    i < Math.floor(pkg.rating)
                                      ? 'text-amber-400'
                                      : 'text-slate-300'
                                  }`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <span className="text-xs text-slate-500">
                              ({pkg.reviewCount || 0})
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
              {!loading && packages.length === 0 && (
                <div className="flex w-full items-center justify-center py-12 text-slate-500">
                  No packages found for this theme yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
