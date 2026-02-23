import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, mediaUrl } from '../utils/api';

const DURATION_RANGES = [
  { label: '1 to 3 Days', min: 1, max: 3 },
  { label: '4 to 6 Days', min: 4, max: 6 },
  { label: '7 to 9 Days', min: 7, max: 9 },
  { label: '10 to 12 Days', min: 10, max: 12 },
  { label: '13 Days or More', min: 13, max: 999 },
];

export default function DurationFilter() {
  const [selectedIndex, setSelectedIndex] = useState(1); // default 4-6 days
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
      const range = DURATION_RANGES[selectedIndex];
      const data = await apiFetch(`/api/packages/by-duration?minDays=${range.min}&maxDays=${range.max}&limit=10`);
      setPackages(data.packages || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch packages by duration:', err);
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

  // Calculate dot position on the slider track
  const trackPositions = DURATION_RANGES.map((_, i) => (i / (DURATION_RANGES.length - 1)) * 100);

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">
          Best priced packages for your holiday <span className="text-cyan-600">DURATION</span>
        </h2>

        {/* Duration Slider */}
        <div className="mt-8 mb-2">
          <div className="relative mx-auto max-w-4xl px-4">
            {/* Track line */}
            <div className="absolute top-1/2 left-4 right-4 h-0.5 -translate-y-1/2 bg-slate-200" />
            {/* Active track */}
            <div
              className="absolute top-1/2 left-4 h-0.5 -translate-y-1/2 bg-cyan-500 transition-all duration-300"
              style={{ width: `${trackPositions[selectedIndex]}%` }}
            />

            <div className="relative flex items-center justify-between">
              {DURATION_RANGES.map((range, index) => (
                <button
                  key={range.label}
                  onClick={() => setSelectedIndex(index)}
                  className="group relative flex flex-col items-center"
                >
                  {/* Dot */}
                  <div
                    className={`h-4 w-4 rounded-full border-2 transition-all duration-300 ${
                      index === selectedIndex
                        ? 'scale-125 border-cyan-500 bg-cyan-500 shadow-lg shadow-cyan-200'
                        : index < selectedIndex
                        ? 'border-cyan-500 bg-cyan-500'
                        : 'border-slate-300 bg-white hover:border-cyan-400'
                    }`}
                  />
                  {/* Label */}
                  <span
                    className={`mt-3 whitespace-nowrap text-xs font-medium transition-all duration-300 sm:text-sm ${
                      index === selectedIndex
                        ? 'rounded-lg bg-cyan-600 px-3 py-1 text-white shadow-md'
                        : 'text-slate-500'
                    }`}
                  >
                    {range.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Result count + View All */}
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            You have <span className="font-semibold text-slate-700">{total}+</span> packages
          </p>
          <Link to="/app/packages" className="text-sm font-semibold text-cyan-600 hover:text-cyan-700 transition-colors">
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
                      {/* Badge: destination + duration */}
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
                        <span className="text-lg font-bold text-cyan-700">₹{pkg.price?.toLocaleString('en-IN')}/-</span>
                        <span className="text-xs text-slate-500">per person</span>
                      </div>
                    </div>
                  </Link>
                ))}
            {!loading && packages.length === 0 && (
              <div className="flex w-full items-center justify-center py-12 text-slate-500">
                No packages found for this duration range.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
