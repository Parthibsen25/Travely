import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, mediaUrl } from '../utils/api';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amount || 0));
}

export default function SimilarPackages({ packageId }) {
  const [packages, setPackages] = useState([]);
  const [alsoBooked, setAlsoBooked] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!packageId) return;

    async function load() {
      try {
        const [similarData, alsoData] = await Promise.all([
          apiFetch(`/api/recommendations/similar/${packageId}?limit=4`),
          apiFetch(`/api/recommendations/also-booked/${packageId}?limit=4`)
        ]);
        setPackages(similarData.similar || []);
        setAlsoBooked(alsoData.alsoBooked || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [packageId]);

  if (loading || (packages.length === 0 && alsoBooked.length === 0)) return null;

  const SmallCard = ({ pkg }) => (
    <Link
      to={`/app/packages/${pkg._id}`}
      className="group flex gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition-all hover:bg-white hover:shadow-sm hover:border-slate-200"
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-200">
        {pkg.imageUrl ? (
          <img src={mediaUrl(pkg.imageUrl)} alt={pkg.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-cyan-100 to-blue-200" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-xs font-semibold text-slate-800 group-hover:text-cyan-700">{pkg.title}</h4>
        <p className="text-[10px] text-slate-500">{pkg.destination} · {pkg.duration}D</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900">{formatCurrency(pkg.price)}</span>
          {pkg.rating > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600">
              <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              {Number(pkg.rating).toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );

  return (
    <div className="space-y-6">
      {packages.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 font-display text-base font-bold text-slate-900">
            <svg className="h-4 w-4 text-purple-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            </svg>
            Similar Packages
          </h3>
          <div className="space-y-2">
            {packages.map((pkg) => <SmallCard key={pkg._id} pkg={pkg} />)}
          </div>
        </div>
      )}

      {alsoBooked.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 font-display text-base font-bold text-slate-900">
            <svg className="h-4 w-4 text-teal-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
            Others Also Booked
          </h3>
          <div className="space-y-2">
            {alsoBooked.map((pkg) => <SmallCard key={pkg._id} pkg={pkg} />)}
          </div>
        </div>
      )}
    </div>
  );
}
