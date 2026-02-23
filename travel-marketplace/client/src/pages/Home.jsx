import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

export default function Home() {
  const { user, isAuthenticated } = useContext(AuthContext);
  const [stats, setStats] = useState({ packages: 0, agencies: 0, bookings: 0, avgRating: 0 });

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await apiFetch('/api/packages/stats');
        setStats(data);
      } catch {
        // fallback to 0s
      }
    }
    loadStats();
  }, []);

  function getDashboardPath() {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'AGENCY') return '/agency/dashboard';
    return '/app';
  }

  const features = [
    {
      icon: (
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      title: 'Discover Packages',
      description: 'Browse curated travel packages from verified agencies with advanced search and filters.'
    },
    {
      icon: (
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: 'Secure Booking',
      description: 'Book with confidence. Track your booking status in real-time with flexible cancellation policies.'
    },
    {
      icon: (
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      title: 'Verified Agencies',
      description: 'All travel agencies are verified and reviewed by travelers before you book.'
    },
    {
      icon: (
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      title: 'Save Favorites',
      description: 'Create your wishlist of dream destinations and book them when you\'re ready.'
    },
    {
      icon: (
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Track Trips',
      description: 'Monitor all your bookings in one place with real-time updates and reminders.'
    },
    {
      icon: (
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      title: 'Rate & Review',
      description: 'Share your travel experiences and help other travelers make informed decisions.'
    }
  ];

  const steps = [
    { number: '01', title: 'Sign Up', description: 'Create your free account in seconds.' },
    { number: '02', title: 'Explore', description: 'Browse packages — filter by destination, price, and category.' },
    { number: '03', title: 'Book', description: 'Select travel dates and travelers. Complete booking in minutes.' },
    { number: '04', title: 'Travel', description: 'Get booking confirmations and enjoy your amazing journey!' }
  ];

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-800 animate-fade-in">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] [background-size:24px_24px]" />
        <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-blue-400/15 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-purple-500/10 blur-3xl" />
        
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:py-36">
          <div className="text-center animate-slide-down">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-cyan-200 backdrop-blur-sm border border-white/10">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Your trusted travel marketplace
            </div>
            <h1 className="font-display text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl">
              Your Journey Starts
              <span className="block bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent"> Here</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-cyan-50/90 sm:text-xl">
              Discover, book, and manage your travel adventures all in one place. Connect with verified travel agencies and explore the world with confidence.
            </p>

            {/* Auth-aware CTA buttons */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {isAuthenticated ? (
                <>
                  <Link
                    to={getDashboardPath()}
                    className="group rounded-2xl bg-white px-8 py-4 text-base font-semibold text-slate-900 shadow-xl transition-all duration-300 hover:bg-cyan-50 hover:shadow-2xl hover:scale-105"
                  >
                    Open {user.role === 'ADMIN' ? 'Admin Panel' : user.role === 'AGENCY' ? 'Agency Panel' : 'Dashboard'}
                    <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                  <Link
                    to="/app/packages"
                    className="rounded-2xl border-2 border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:scale-105"
                  >
                    Browse Packages
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="group rounded-2xl bg-white px-8 py-4 text-base font-semibold text-slate-900 shadow-xl transition-all duration-300 hover:bg-cyan-50 hover:shadow-2xl hover:scale-105"
                  >
                    Get Started Free
                    <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                  <Link
                    to="/login"
                    className="rounded-2xl border-2 border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:scale-105"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/agency/register"
                    className="rounded-2xl border-2 border-amber-400/40 bg-amber-500/15 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-amber-500/25 hover:scale-105"
                  >
                    Register as Agency
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full">
            <path d="M0 60L48 56C96 52 192 44 288 38C384 32 480 28 576 32C672 36 768 48 864 52C960 56 1056 52 1152 46C1248 40 1344 32 1392 28L1440 24V60H0Z" fill="#f8fafc"/>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-600">Platform Features</p>
            <h2 className="font-display mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Why Choose Travely?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
              Everything you need to plan and book your perfect trip, all in one platform.
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-cyan-100 animate-scale-in"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-3 text-white shadow-lg shadow-cyan-200/50">
                  {feature.icon}
                </div>
                <h3 className="font-display text-lg font-bold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gradient-to-br from-slate-50 to-cyan-50/50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-600">Simple Process</p>
            <h2 className="font-display mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">How It Works</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
              Booking your dream trip is simple and straightforward.
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={index} className="relative animate-scale-in" style={{ animationDelay: `${index * 0.12}s` }}>
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-2xl font-bold text-white shadow-lg shadow-cyan-200/50">
                    {step.number}
                  </div>
                  <h3 className="font-display mt-5 text-lg font-bold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="absolute top-8 left-[calc(50%+40px)] hidden h-px w-[calc(100%-80px)] bg-gradient-to-r from-cyan-300 to-blue-300 lg:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section - Real data from API */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { value: stats.packages || 0, suffix: '+', label: 'Travel Packages', color: 'text-cyan-600' },
              { value: stats.agencies || 0, suffix: '+', label: 'Verified Agencies', color: 'text-blue-600' },
              { value: stats.bookings || 0, suffix: '+', label: 'Bookings Made', color: 'text-purple-600' },
              { value: stats.avgRating ? Number(stats.avgRating).toFixed(1) : '0.0', suffix: '★', label: 'Average Rating', color: 'text-amber-500' }
            ].map((stat, i) => (
              <div key={i} className="text-center rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm animate-scale-in transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={`text-3xl font-bold sm:text-4xl ${stat.color}`}>{stat.value}{stat.suffix}</div>
                <div className="mt-2 text-sm font-medium text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-800 py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] [background-size:24px_24px]" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 animate-fade-in">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">Ready to Start Your Adventure?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-cyan-50/80">
            Join travelers who trust Travely for their booking needs. Start exploring amazing destinations today.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link
                to={getDashboardPath()}
                className="group rounded-2xl bg-white px-8 py-4 text-base font-semibold text-slate-900 shadow-xl transition-all duration-300 hover:bg-cyan-50 hover:shadow-2xl hover:scale-105"
              >
                Go to Dashboard <span className="ml-1 inline-block transition-transform group-hover:translate-x-1">→</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="group rounded-2xl bg-white px-8 py-4 text-base font-semibold text-slate-900 shadow-xl transition-all duration-300 hover:bg-cyan-50 hover:shadow-2xl hover:scale-105"
                >
                  Create Free Account <span className="ml-1 inline-block transition-transform group-hover:translate-x-1">→</span>
                </Link>
                <Link
                  to="/login"
                  className="rounded-2xl border-2 border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:scale-105"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
              </div>
              <span className="font-display text-lg font-bold text-slate-900">Travely</span>
            </div>
            <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} Travely. All rights reserved.</p>
            <div className="flex gap-4 text-sm text-slate-500">
              <span className="cursor-default hover:text-slate-700">Privacy</span>
              <span className="cursor-default hover:text-slate-700">Terms</span>
              <span className="cursor-default hover:text-slate-700">Contact</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
