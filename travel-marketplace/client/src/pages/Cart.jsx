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

  if (loading) return <Loading />;

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Cart</h1>
          <p className="mt-1 text-sm text-slate-500">
            {items.length === 0
              ? 'Your cart is empty'
              : `${items.length} package${items.length > 1 ? 's' : ''} in cart`}
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={handleClearCart}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            Clear Cart
          </button>
        )}
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-20 text-center">
          <svg className="mb-4 h-16 w-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
          <p className="text-lg font-semibold text-slate-600">No packages in your cart</p>
          <p className="mt-1 text-sm text-slate-400">Browse packages and add them to your cart to book.</p>
          <Link
            to="/app/packages"
            className="mt-6 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:shadow-lg hover:scale-105"
          >
            Browse Packages
          </Link>
        </div>
      )}

      {/* Cart Items */}
      <div className="space-y-4">
        {items.map((pkg) => (
          <div key={pkg._id} className="flex flex-col sm:flex-row gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
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
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-red-300 hover:text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                  <Link
                    to={`/app/booking?packageId=${pkg._id}`}
                    className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2 text-sm font-bold text-white shadow-md transition hover:shadow-lg hover:scale-105"
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
