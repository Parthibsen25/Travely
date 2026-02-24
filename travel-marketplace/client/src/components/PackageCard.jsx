import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { apiFetch, mediaUrl } from '../utils/api';

export default function PackageCard({ pkg, showAgency = true }) {
  const { isAuthenticated } = useContext(AuthContext);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imgError, setImgError] = useState(false);

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

  const categoryConfig = {
    adventure: { bg: 'bg-orange-50 text-orange-700 ring-orange-200', icon: '🏔️' },
    relaxation: { bg: 'bg-blue-50 text-blue-700 ring-blue-200', icon: '🏖️' },
    cultural: { bg: 'bg-purple-50 text-purple-700 ring-purple-200', icon: '🏛️' },
    romantic: { bg: 'bg-pink-50 text-pink-700 ring-pink-200', icon: '💕' },
    budget: { bg: 'bg-green-50 text-green-700 ring-green-200', icon: '💰' },
  };
  const cat = categoryConfig[pkg.category] || { bg: 'bg-slate-50 text-slate-700 ring-slate-200', icon: '✈️' };

  // Check for active offers
  const bestOffer = (pkg.offers || []).reduce((best, current) => {
    const bestPct = Number(best?.discountPercent || 0);
    const currentPct = Number(current?.discountPercent || 0);
    return currentPct > bestPct ? current : best;
  }, null);
  const discountPct = Number(bestOffer?.discountPercent || 0);
  const hasDiscount = discountPct > 0;
  const discountPrice = hasDiscount ? Math.round(Number(pkg.price || 0) * (1 - discountPct / 100)) : null;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover">
      {/* Image section */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600">
        {pkg.imageUrl && !imgError ? (
          <img
            src={mediaUrl(pkg.imageUrl)}
            alt={pkg.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl opacity-50">
            {cat.icon}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <div className="flex flex-col gap-1.5">
            {hasDiscount && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-2 py-1 text-[11px] font-bold text-white shadow-lg">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H10a3 3 0 013 3v1a1 1 0 102 0v-1a5 5 0 00-5-5H8.414l1.293-1.293z" clipRule="evenodd" /></svg>
                {discountPct}% OFF
              </span>
            )}
          </div>
          <button
            onClick={toggleWishlist}
            className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all duration-200 ${
              isWishlisted
                ? 'bg-red-500 text-white shadow-lg'
                : 'bg-white/80 text-slate-600 hover:bg-white hover:text-red-500'
            }`}
            title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <svg className="h-4 w-4" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        {/* Bottom overlay info */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-display text-lg font-bold text-white line-clamp-1 drop-shadow-md">{pkg.title}</h3>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-white/90">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="line-clamp-1 text-xs">{pkg.destination}</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Category & Duration row */}
        <div className="mb-3 flex items-center justify-between">
          <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ${cat.bg}`}>
            {cat.icon} {pkg.category}
          </span>
          <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {pkg.duration} {pkg.duration === 1 ? 'day' : 'days'}
          </span>
        </div>

        {/* Rating */}
        {pkg.rating > 0 && (
          <div className="mb-3 flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`h-3.5 w-3.5 ${i < Math.floor(pkg.rating) ? 'text-amber-400' : 'text-slate-200'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-xs font-semibold text-slate-700">{pkg.rating.toFixed(1)}</span>
            {pkg.reviewCount > 0 && <span className="text-xs text-slate-400">({pkg.reviewCount})</span>}
          </div>
        )}

        {/* Price */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-900">
              ₹{(hasDiscount ? discountPrice : pkg.price)?.toLocaleString()}
            </p>
            {hasDiscount && (
              <p className="text-sm font-medium text-slate-400 line-through">₹{pkg.price?.toLocaleString()}</p>
            )}
          </div>
          <p className="text-xs text-slate-500">per person</p>
        </div>

        {/* Agency */}
        {showAgency && pkg.agencyId?.businessName && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-amber-400 to-orange-500 text-[9px] font-bold text-white">
              {pkg.agencyId.businessName.charAt(0)}
            </div>
            <span className="text-xs font-medium text-slate-600 truncate">{pkg.agencyId.businessName}</span>
            {pkg.agencyId.verificationStatus === 'VERIFIED' && (
              <svg className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <Link
            to={`/app/packages/${pkg._id}`}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:border-slate-300"
          >
            Details
          </Link>
          <Link
            to={`/app/booking?packageId=${pkg._id}`}
            className="flex-1 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:from-cyan-700 hover:to-blue-700 hover:shadow-md"
          >
            Book Now
          </Link>
        </div>
      </div>
    </article>
  );
}
