import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  const features = [
    {
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      title: 'Discover Amazing Packages',
      description: 'Browse through hundreds of curated travel packages from verified agencies. Find your perfect destination with advanced search and filters.'
    },
    {
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: 'Secure Booking',
      description: 'Book with confidence. All transactions are secure, and you can track your booking status in real-time. Cancel anytime with our flexible policies.'
    },
    {
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      title: 'Verified Agencies',
      description: 'All travel agencies are verified and reviewed. Read authentic reviews from fellow travelers before making your booking decision.'
    },
    {
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      title: 'Save Favorites',
      description: 'Create your wishlist of dream destinations. Save packages you love and book them when you\'re ready to travel.'
    },
    {
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Track Your Trips',
      description: 'Monitor all your bookings in one place. Get real-time updates on booking status, payment confirmations, and travel reminders.'
    },
    {
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      title: 'Rate & Review',
      description: 'Share your travel experiences. Rate packages and write reviews to help other travelers make informed decisions.'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Sign Up',
      description: 'Create your free account in seconds. No credit card required.'
    },
    {
      number: '02',
      title: 'Explore Packages',
      description: 'Browse through amazing travel packages. Filter by destination, price, and category.'
    },
    {
      number: '03',
      title: 'Book Your Trip',
      description: 'Select your travel dates and number of travelers. Complete booking in minutes.'
    },
    {
      number: '04',
      title: 'Travel & Enjoy',
      description: 'Get booking confirmations and travel details. Enjoy your amazing journey!'
    }
  ];

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-800 animate-fade-in">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] [background-size:20px_20px]" />
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
        
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-32">
          <div className="text-center animate-slide-down">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Welcome to Travely</p>
            <h1 className="font-display mt-6 text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl">
              Your Journey Starts
              <span className="block bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"> Here</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-cyan-50 sm:text-xl">
              Discover, book, and manage your travel adventures all in one place. Connect with verified travel agencies and explore the world with confidence.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/register"
                className="rounded-xl bg-white px-8 py-4 text-base font-semibold text-slate-900 shadow-xl transition-all duration-300 hover:bg-cyan-50 hover:shadow-2xl hover:scale-105"
              >
                Get Started Free
              </Link>
              <Link
                to="/login"
                className="rounded-xl border-2 border-white/40 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:scale-105"
              >
                User Sign In
              </Link>
              <Link
                to="/agency/login"
                className="rounded-xl border-2 border-amber-400/40 bg-amber-500/20 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-amber-500/30 hover:scale-105"
              >
                Agency Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl">Why Choose Travely?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              Everything you need to plan and book your perfect trip, all in one platform.
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 p-3 text-white">
                  {feature.icon}
                </div>
                <h3 className="font-display text-xl font-bold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gradient-to-br from-slate-50 to-cyan-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl">How It Works</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              Booking your dream trip is simple and straightforward.
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={index} className="relative animate-scale-in" style={{ animationDelay: `${index * 0.15}s` }}>
                <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 text-2xl font-bold text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl">
                  {step.number}
                </div>
                  <h3 className="font-display mt-6 text-xl font-bold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-slate-600">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="absolute top-8 left-full hidden h-0.5 w-full bg-gradient-to-r from-cyan-400 to-blue-400 lg:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center animate-scale-in" style={{ animationDelay: '0.1s' }}>
              <div className="text-4xl font-bold text-slate-900 transition-all duration-300 hover:scale-110">500+</div>
              <div className="mt-2 text-sm font-medium text-slate-600">Travel Packages</div>
            </div>
            <div className="text-center animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <div className="text-4xl font-bold text-slate-900 transition-all duration-300 hover:scale-110">50+</div>
              <div className="mt-2 text-sm font-medium text-slate-600">Verified Agencies</div>
            </div>
            <div className="text-center animate-scale-in" style={{ animationDelay: '0.3s' }}>
              <div className="text-4xl font-bold text-slate-900 transition-all duration-300 hover:scale-110">10K+</div>
              <div className="mt-2 text-sm font-medium text-slate-600">Happy Travelers</div>
            </div>
            <div className="text-center animate-scale-in" style={{ animationDelay: '0.4s' }}>
              <div className="text-4xl font-bold text-slate-900 transition-all duration-300 hover:scale-110">4.8★</div>
              <div className="mt-2 text-sm font-medium text-slate-600">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-800 py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] [background-size:20px_20px]" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 animate-fade-in">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">Ready to Start Your Adventure?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-cyan-50">
            Join thousands of travelers who trust Travely for their booking needs. Start exploring amazing destinations today.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="rounded-xl bg-white px-8 py-4 text-base font-semibold text-slate-900 shadow-xl transition-all duration-300 hover:bg-cyan-50 hover:shadow-2xl hover:scale-105"
            >
              Create Free Account
            </Link>
            <Link
              to="/login"
              className="rounded-xl border-2 border-white/40 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:scale-105"
            >
              User Sign In
            </Link>
            <Link
              to="/agency/login"
              className="rounded-xl border-2 border-amber-400/40 bg-amber-500/20 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-amber-500/30 hover:scale-105"
            >
              Agency Login
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
