import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, mediaUrl } from '../utils/api';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amount || 0));
}

function getDiscountPrice(pkg) {
  const offer = (pkg?.offers || []).reduce((best, current) => {
    const bestPct = Number(best?.discountPercent || 0);
    const currentPct = Number(current?.discountPercent || 0);
    return currentPct > bestPct ? current : best;
  }, null);
  if (!offer || Number(offer.discountPercent || 0) <= 0) return null;
  return Math.round(Number(pkg.price || 0) * (1 - Number(offer.discountPercent) / 100));
}

function PackageCard({ pkg }) {
  const discounted = getDiscountPrice(pkg);
  const offerPct = (pkg?.offers || []).reduce((max, o) => Math.max(max, Number(o?.discountPercent || 0)), 0);

  return (
    <Link
      to={`/app/packages/${pkg._id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:shadow-card hover:-translate-y-0.5"
    >
      <div className="relative h-40 overflow-hidden bg-slate-100">
        {pkg.imageUrl ? (
          <img src={mediaUrl(pkg.imageUrl)} alt={pkg.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-cyan-100 to-blue-200" />
        )}
        {offerPct > 0 && (
          <span className="absolute right-2 top-2 rounded-lg bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
            {offerPct}% OFF
          </span>
        )}
        {pkg.rating > 0 && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-0.5 rounded-lg bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-800 backdrop-blur-sm">
            <svg className="h-3 w-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            {Number(pkg.rating).toFixed(1)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{pkg.destination}</p>
        <h3 className="mt-1 text-sm font-bold text-slate-900 line-clamp-2">{pkg.title}</h3>
        <div className="mt-auto flex items-center justify-between pt-3">
          <div>
            {discounted ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs text-slate-400 line-through">{formatCurrency(pkg.price)}</span>
                <span className="text-sm font-bold text-slate-900">{formatCurrency(discounted)}</span>
              </div>
            ) : (
              <span className="text-sm font-bold text-slate-900">{formatCurrency(pkg.price)}</span>
            )}
          </div>
          {pkg.duration && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
              {pkg.duration}D
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function RecommendedForYou() {
  const [packages, setPackages] = useState([]);
  const [strategy, setStrategy] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch('/api/recommendations/for-you?limit=8');
        setPackages(data.recommendations || []);
        setStrategy(data.strategy || 'popular');
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return null;
  if (packages.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md">
            {strategy === 'personalized' ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25 9.456 8.637 2.25 9.32l5.39 4.67L6.176 21.75 12 17.77l5.824 3.98-1.464-7.76 5.39-4.67-7.206-.683Z" />
              </svg>
            ) : (
              <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
              </svg>
            )}
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              {strategy === 'personalized' ? 'Recommended for You' : 'Popular Packages'}
            </h2>
            <p className="text-xs text-slate-500">
              {strategy === 'personalized' ? 'Based on your interests and travel history' : 'Trending packages loved by travelers'}
            </p>
          </div>
        </div>
        <Link
          to="/app/packages"
          className="inline-flex items-center gap-1 text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors"
        >
          View All
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {packages.map((pkg) => (
          <PackageCard key={pkg._id} pkg={pkg} />
        ))}
      </div>
    </section>
  );
}
