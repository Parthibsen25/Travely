import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 animate-page-enter">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 p-8 text-white shadow-card">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold sm:text-3xl">My Wishlist</h1>
              <p className="mt-0.5 text-sm text-pink-100">Your saved dream destinations</p>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <Loading fullPage />
      ) : error ? (
        <div className="rounded-2xl bg-red-50 border border-red-200/80 p-6 shadow-card">
          <p className="font-medium text-red-700">{error}</p>
        </div>
      ) : packages.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center shadow-card">
          <span className="text-5xl">💕</span>
          <p className="mt-4 font-display text-lg font-bold text-slate-900">Your wishlist is empty</p>
          <p className="mt-1.5 text-sm text-slate-500">Explore packages and tap the heart to save them here!</p>
          <Link to="/app/packages" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-200 hover:from-cyan-600 hover:to-blue-600 hover:shadow-xl">
            Browse Packages
          </Link>
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
