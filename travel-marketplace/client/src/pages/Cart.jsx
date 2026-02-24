import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { mediaUrl } from '../utils/api';
import Loading from '../components/Loading';

const INCLUSION_ICONS = {
  Hotels: '🏨',
  Meals: '🍽️',
  Sightseeing: '🗺️',
  Flights: '✈️',
  Visa: '📋',
  Transfers: '🚗',
  Activities: '🎯',
  Insurance: '🛡️',
};

export default function Cart() {
  const { items, loading, removeFromCart, clearCart } = useCart();
  const { showToast } = useToast();

  const handleRemove = async (pkgId, title) => {
    const result = await removeFromCart(pkgId);
    if (result.success) {
      showToast(`Removed "${title}" from cart`, 'info');
    } else {
      showToast(result.message, 'error');
    }
  };

  const handleClearCart = async () => {
    const result = await clearCart();
    if (result.success) {
      showToast('Cart cleared', 'info');
    } else {
      showToast(result.message, 'error');
    }
  };

  if (loading) return <Loading fullPage />;

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 animate-page-enter">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">My Cart</h1>
          <p className="mt-1 text-sm text-slate-500">
            {items.length === 0
              ? 'Your cart is empty'
              : `${items.length} package${items.length > 1 ? 's' : ''} in cart`}
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={handleClearCart}
            className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            Clear Cart
          </button>
        )}
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center shadow-card">
          <span className="text-5xl">🛒</span>
          <p className="mt-4 font-display text-lg font-bold text-slate-900">Your cart is empty</p>
          <p className="mt-1.5 text-sm text-slate-500">Browse packages and add them to your cart to book.</p>
          <Link
            to="/app/packages"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-200 hover:from-cyan-600 hover:to-blue-600 hover:shadow-xl"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
            Browse Packages
          </Link>
        </div>
      )}

      {/* Cart Items */}
      <div className="space-y-4">
        {items.map((pkg) => (
          <div key={pkg._id} className="flex flex-col sm:flex-row gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card transition-all duration-200 hover:shadow-card-hover">
            {/* Image */}
            <Link to={`/app/packages/${pkg._id}`} className="flex-shrink-0">
              <img
                src={mediaUrl(pkg.imageUrl)}
                alt={pkg.title}
                className="h-40 w-full sm:h-32 sm:w-48 rounded-xl object-cover"
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80'; }}
              />
            </Link>

            {/* Details */}
            <div className="flex flex-1 flex-col justify-between gap-3">
              <div>
                <Link to={`/app/packages/${pkg._id}`} className="text-lg font-bold text-slate-900 hover:text-blue-600 transition">
                  {pkg.title}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {pkg.destination}
                  </span>
                  <span className="text-slate-300">|</span>
                  <span>{pkg.duration}D{pkg.nightCount ? `/${pkg.nightCount}N` : ''}</span>
                  {pkg.category && (
                    <>
                      <span className="text-slate-300">|</span>
                      <span className="capitalize">{pkg.category}</span>
                    </>
                  )}
                </div>

                {/* Inclusions */}
                {pkg.inclusions?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {pkg.inclusions.map((inc) => (
                      <span key={inc} className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-xs text-slate-600 border border-slate-100">
                        {INCLUSION_ICONS[inc] || '✓'} {inc}
                      </span>
                    ))}
                  </div>
                )}

                {/* Cities */}
                {pkg.cities?.length > 0 && (
                  <p className="mt-1.5 text-xs text-slate-400">
                    {pkg.cities.join(' → ')}
                  </p>
                )}
              </div>

              {/* Price + Actions */}
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xl font-bold text-slate-900">₹{pkg.price?.toLocaleString()}</p>
                  <p className="text-xs text-slate-400">per person</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRemove(pkg._id, pkg.title)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-red-300 hover:text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                  <Link
                    to={`/app/booking?packageId=${pkg._id}`}
                    className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-200 hover:from-cyan-600 hover:to-blue-600 hover:shadow-xl"
                  >
                    Proceed to Book
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      {items.length > 0 && (
        <div className="mt-8 flex justify-center">
          <Link
            to="/app/packages"
            className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
          >
            ← Continue Browsing Packages
          </Link>
        </div>
      )}
    </section>
  );
}
