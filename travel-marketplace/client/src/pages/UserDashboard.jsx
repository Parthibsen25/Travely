import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import PackageCard from '../components/PackageCard';
import Loading from '../components/Loading';
import DurationFilter from '../components/DurationFilter';
import ThemeBrowser from '../components/ThemeBrowser';

export default function UserDashboard() {
  const [packages, setPackages] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const [pkgData, bookingData] = await Promise.all([
          apiFetch('/api/packages').catch(() => ({ packages: [] })),
          apiFetch('/api/bookings/my').catch(() => ({ bookings: [] }))
        ]);
        if (!ignore) {
          setPackages(pkgData.packages || []);
          setBookings(bookingData.bookings || []);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, []);

  const stats = useMemo(() => {
    const total = bookings.length;
    const confirmed = bookings.filter((b) => b.status === 'CONFIRMED').length;
    const pending = bookings.filter((b) => b.status === 'PENDING_PAYMENT').length;
    const cancelled = bookings.filter((b) => b.status === 'CANCELLED').length;
    return { total, confirmed, pending, cancelled };
  }, [bookings]);

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-cyan-900 to-teal-700 p-8 text-white shadow-xl animate-slide-down">
        <div className="absolute -right-12 -top-12 h-64 w-64 animate-float rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 h-64 w-64 animate-float rounded-full bg-blue-300/20 blur-3xl" style={{ animationDelay: '1s' }} />
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">Welcome Back</p>
          <h1 className="font-display mt-3 text-4xl font-bold sm:text-5xl">Your Travel Dashboard</h1>
          <p className="mt-4 max-w-2xl text-base text-cyan-50 sm:text-lg">
            Discover curated packages from verified agencies and monitor your booking status live.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/app/packages"
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg transition-all duration-300 hover:bg-cyan-50 hover:scale-105 hover:shadow-xl"
            >
              Explore Packages
            </Link>
            <Link
              to="/app/my-trips"
              className="rounded-xl border-2 border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10 hover:scale-105"
            >
              My Trips
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-scale-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Trips</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{loading ? '...' : stats.total}</p>
            </div>
            <div className="rounded-full bg-slate-100 p-3">
              <svg className="h-6 w-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="group relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-scale-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">Confirmed</p>
              <p className="mt-2 text-3xl font-bold text-emerald-700">{loading ? '...' : stats.confirmed}</p>
            </div>
            <div className="rounded-full bg-emerald-100 p-3">
              <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="group relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-scale-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600">Awaiting Payment</p>
              <p className="mt-2 text-3xl font-bold text-amber-700">{loading ? '...' : stats.pending}</p>
            </div>
            <div className="rounded-full bg-amber-100 p-3">
              <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-scale-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Cancelled</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{loading ? '...' : stats.cancelled}</p>
            </div>
            <div className="rounded-full bg-slate-100 p-3">
              <svg className="h-6 w-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900">Featured Packages</h2>
            <p className="mt-1 text-sm text-slate-600">Handpicked travel experiences just for you</p>
          </div>
          <Link
            to="/app/packages"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            View all →
          </Link>
        </div>

        {loading ? (
          <Loading />
        ) : packages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="mt-4 text-sm font-medium text-slate-600">No packages available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {packages.slice(0, 6).map((pkg) => (
              <PackageCard key={pkg._id} pkg={pkg} showAgency={true} />
            ))}
          </div>
        )}
      </section>

      {/* Browse by Duration */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl font-bold text-slate-900 mb-1">Browse by Duration</h2>
        <p className="text-sm text-slate-600 mb-4">Find the perfect trip length for your schedule</p>
        <DurationFilter />
      </section>

      {/* Browse by Theme */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl font-bold text-slate-900 mb-1">Holiday Themes</h2>
        <p className="text-sm text-slate-600 mb-4">Explore packages by your preferred travel style</p>
        <ThemeBrowser />
      </section>
    </div>
  );
}
