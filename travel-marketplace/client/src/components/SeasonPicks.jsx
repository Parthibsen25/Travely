import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, mediaUrl } from '../utils/api';

const SEASONS = [
  { label: 'Jan-Feb-Mar', value: 'jan-feb-mar' },
  { label: 'Apr-May-Jun', value: 'apr-may-jun' },
  { label: 'Jul-Aug-Sep', value: 'jul-aug-sep' },
  { label: 'Oct-Nov-Dec', value: 'oct-nov-dec' },
];

function getCurrentSeason() {
  const month = new Date().getMonth(); // 0-11
  if (month <= 2) return 'jan-feb-mar';
  if (month <= 5) return 'apr-may-jun';
  if (month <= 8) return 'jul-aug-sep';
  return 'oct-nov-dec';
}

export default function SeasonPicks() {
  const [selectedSeason, setSelectedSeason] = useState(getCurrentSeason());
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchPackages();
  }, [selectedSeason]);

  async function fetchPackages() {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/packages/by-season?season=${selectedSeason}&limit=10`);
      setPackages(data.packages || []);
    } catch (err) {
      console.error('Failed to fetch season picks:', err);
    } finally {
      setLoading(false);
    }
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
    <section className="bg-gradient-to-br from-slate-50 to-cyan-50/30 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">
            Staff picks for each <span className="text-cyan-600">SEASON</span>
          </h2>
          <span className="mt-1 h-3 w-3 rounded-full bg-amber-400" />
        </div>

        {/* Season Selector */}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-slate-600">Select your month of Travel</span>
          <div className="flex flex-wrap gap-3">
            {SEASONS.map((season) => (
              <label
                key={season.value}
                className="flex cursor-pointer items-center gap-2 transition-all duration-200"
              >
                <input
                  type="radio"
                  name="season"
                  value={season.value}
                  checked={selectedSeason === season.value}
                  onChange={() => setSelectedSeason(season.value)}
                  className="h-4 w-4 border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span
                  className={`text-sm font-medium transition-colors duration-200 ${
                    selectedSeason === season.value ? 'text-cyan-700' : 'text-slate-600'
                  }`}
                >
                  {season.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Packages Carousel */}
        <div className="relative mt-8">
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
                    <div className="h-48 rounded-t-xl bg-slate-200" />
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
                    <div className="relative h-48 overflow-hidden bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600">
                      {pkg.imageUrl && (
                        <img
                          src={mediaUrl(pkg.imageUrl)}
                          alt={pkg.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                      {/* Expert's Pick Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white shadow-md">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Expert's Pick
                        </span>
                      </div>

                      {/* Destination + Duration */}
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
                      {pkg.rating > 0 && (
                        <div className="mt-1 flex items-center gap-1">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`h-3.5 w-3.5 ${i < Math.floor(pkg.rating) ? 'text-amber-400' : 'text-slate-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-xs text-slate-500">({pkg.reviewCount || 0})</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
            {!loading && packages.length === 0 && (
              <div className="flex w-full items-center justify-center py-12 text-slate-500">
                No expert picks found for this season. Check back soon!
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
