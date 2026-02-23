import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import PackageCard from '../components/PackageCard';
import Loading from '../components/Loading';

export default function Wishlist() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadWishlist();
  }, []);

  async function loadWishlist() {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/wishlist/my');
      setPackages(data.wishlist || []);
    } catch (err) {
      setError(err.message || 'Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 animate-fade-in">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-500 via-rose-500 to-red-600 p-8 text-white shadow-xl animate-slide-down">
        <div className="absolute -right-12 -top-12 h-64 w-64 animate-float rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <h1 className="font-display text-4xl font-bold sm:text-5xl">My Wishlist</h1>
          <p className="mt-3 text-base text-pink-50 sm:text-lg">Save your favorite packages for later</p>
        </div>
      </section>

      {loading ? (
        <Loading />
      ) : error ? (
        <div className="rounded-xl bg-red-50 border border-red-200 p-6">
          <p className="font-medium text-red-700">{error}</p>
        </div>
      ) : packages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <svg className="mx-auto h-16 w-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <p className="mt-4 text-lg font-semibold text-slate-900">Your wishlist is empty</p>
          <p className="mt-2 text-sm text-slate-600">Start exploring packages and add them to your wishlist!</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-600">
              <span className="font-bold text-slate-900">{packages.length}</span> saved packages
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {packages.map((pkg, index) => (
              <div key={pkg._id} className="animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <PackageCard pkg={pkg} showAgency={true} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
