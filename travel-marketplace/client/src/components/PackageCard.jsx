import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { apiFetch, mediaUrl } from '../utils/api';

export default function PackageCard({ pkg, showAgency = true }) {
  const { isAuthenticated } = useContext(AuthContext);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    if (isAuthenticated && pkg._id) {
      checkWishlist();
    }
  }, [isAuthenticated, pkg._id]);

  async function checkWishlist() {
    try {
      const data = await apiFetch(`/api/wishlist/check?packageIds=${pkg._id}`);
      setIsWishlisted(data.wishlist?.includes(pkg._id) || false);
    } catch (err) {
      // Silently fail
    }
  }

  async function toggleWishlist(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;

    try {
      if (isWishlisted) {
        await apiFetch(`/api/wishlist/${pkg._id}`, { method: 'DELETE' });
        setIsWishlisted(false);
      } else {
        await apiFetch('/api/wishlist', {
          method: 'POST',
          body: JSON.stringify({ packageId: pkg._id })
        });
        setIsWishlisted(true);
      }
    } catch (err) {
      console.error('Failed to update wishlist:', err);
    }
  }
  const categoryColors = {
    adventure: 'bg-orange-100 text-orange-700',
    relaxation: 'bg-blue-100 text-blue-700',
    cultural: 'bg-purple-100 text-purple-700',
    romantic: 'bg-pink-100 text-pink-700',
    budget: 'bg-green-100 text-green-700'
  };

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl animate-scale-in">
      {/* Image placeholder with gradient */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600">
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-all duration-300" />
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={toggleWishlist}
            className={`rounded-full p-2 backdrop-blur-sm transition-all duration-300 ${
              isWishlisted
                ? 'bg-red-500/90 text-white scale-110'
                : 'bg-white/90 text-slate-600 hover:bg-white hover:scale-110'
            }`}
            title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <svg className="h-4 w-4" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur-sm ${categoryColors[pkg.category] || 'bg-slate-100 text-slate-700'}`}>
            {pkg.category}
          </span>
        </div>
        {pkg.imageUrl && (
          <img src={mediaUrl(pkg.imageUrl)} alt={pkg.title} className="h-full w-full object-cover" />
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <h3 className="font-display text-lg font-bold text-white line-clamp-1">{pkg.title}</h3>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-3 flex items-center gap-2 text-sm text-slate-600">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="line-clamp-1">{pkg.destination}</span>
        </div>

        {pkg.rating && (
          <div className="mb-3 flex items-center gap-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`h-4 w-4 ${i < Math.floor(pkg.rating) ? 'text-amber-400' : 'text-slate-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm font-medium text-slate-600">{pkg.rating.toFixed(1)}</span>
            {pkg.reviewCount && <span className="text-sm text-slate-500">({pkg.reviewCount})</span>}
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-slate-900">₹{pkg.price?.toLocaleString()}</p>
            <p className="text-sm text-slate-500">{pkg.duration} days</p>
          </div>
        </div>

        {showAgency && pkg.agencyId?.businessName && (
          <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>{pkg.agencyId.businessName}</span>
            {pkg.agencyId.verificationStatus === 'VERIFIED' && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">Verified</span>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Link
            to={`/app/packages/${pkg._id}`}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-50 hover:scale-105"
          >
            View Details
          </Link>
          <Link
            to={`/app/booking?packageId=${pkg._id}`}
            className="flex-1 rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-2.5 text-center text-sm font-semibold text-white transition-all duration-300 hover:from-slate-800 hover:to-slate-600 hover:scale-105 hover:shadow-lg"
          >
            Book Now
          </Link>
        </div>
      </div>
    </article>
  );
}
