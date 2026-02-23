import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { apiFetch, mediaUrl } from '../utils/api';
import Loading from '../components/Loading';
import DurationFilter from '../components/DurationFilter';
import SeasonPicks from '../components/SeasonPicks';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amount || 0));
}

function getDiscountPrice(pkg) {
  const offer = (pkg?.offers || []).reduce((best, current) => {
    const bestPct = Number(best?.discountPercent || 0);
    const currentPct = Number(current?.discountPercent || 0);
    return currentPct > bestPct ? current : best;
  }, null);
  if (!offer || Number(offer.discountPercent || 0) <= 0) return null;
  return Math.round(Number(pkg.price || 0) * (1 - Number(offer.discountPercent) / 100));
}

/* ─── Auto-sliding Carousel ─────────────────────────────────────────── */
function PackageCarousel({ packages }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);
  const total = packages.length;

  const goTo = useCallback((idx) => setCurrent((idx + total) % total), [total]);

  // Auto-slide every 4s
  useEffect(() => {
    if (total <= 1) return;
    timerRef.current = setInterval(() => setCurrent((prev) => (prev + 1) % total), 4000);
    return () => clearInterval(timerRef.current);
  }, [total]);

  // Pause on hover
  const pause = () => clearInterval(timerRef.current);
  const resume = () => {
    if (total <= 1) return;
    timerRef.current = setInterval(() => setCurrent((prev) => (prev + 1) % total), 4000);
  };

  if (!total) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
        <p className="text-sm text-slate-500">No packages available yet.</p>
      </div>
    );
  }

  const pkg = packages[current];
  const discounted = getDiscountPrice(pkg);
  const offerPct = Number(pkg.offerPercent || 0);

  return (
    <div className="relative" onMouseEnter={pause} onMouseLeave={resume}>
      {/* Main slide */}
      <Link to={`/app/packages/${pkg._id}`} className="group relative block overflow-hidden rounded-2xl">
        <div className="relative h-72 overflow-hidden bg-slate-100 sm:h-80">
          {pkg.imageUrl ? (
            <img
              key={pkg._id}
              src={mediaUrl(pkg.imageUrl)}
              alt={pkg.title}
              className="h-full w-full object-cover transition-all duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-cyan-100 to-blue-200" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

          {/* Badges */}
          {offerPct > 0 && (
            <span className="absolute right-4 top-4 rounded-lg bg-rose-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
              {offerPct}% OFF
            </span>
          )}
          {pkg.rating > 0 && (
            <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-lg bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur-sm">
              <svg className="h-3.5 w-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              {Number(pkg.rating).toFixed(1)}
            </span>
          )}

          {/* Info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-white/70">{pkg.destination}</p>
            <h3 className="mt-1 font-display text-xl font-bold text-white sm:text-2xl">{pkg.title}</h3>
            <div className="mt-2 flex items-center gap-3">
              {discounted ? (
                <>
                  <span className="text-sm text-white/60 line-through">{formatCurrency(pkg.price)}</span>
                  <span className="text-xl font-bold text-white">{formatCurrency(discounted)}</span>
                </>
              ) : (
                <span className="text-xl font-bold text-white">{formatCurrency(pkg.price)}</span>
              )}
              {pkg.duration && (
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                  {pkg.duration}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Navigation arrows */}
      {total > 1 && (
        <>
          <button
            onClick={() => goTo(current - 1)}
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/30 bg-white/20 p-2 text-white backdrop-blur-sm transition hover:bg-white/40"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button
            onClick={() => goTo(current + 1)}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/30 bg-white/20 p-2 text-white backdrop-blur-sm transition hover:bg-white/40"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </>
      )}

      {/* Dot indicators */}
      {total > 1 && (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {packages.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/70'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Budget My Plan Panel ───────────────────────────────────────────── */
function BudgetMyPlan({ latestTrip }) {
  const navigate = useNavigate();

  // Show latest trip summary if exists
  const hasTrip = !!latestTrip;
  const totalBudget = latestTrip?.totalBudget || 0;
  const spent = (latestTrip?.budgetItems || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const remaining = totalBudget - spent;
  const spentPercent = totalBudget > 0 ? Math.min(Math.round((spent / totalBudget) * 100), 100) : 0;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-slate-100 p-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-md">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">Budget My Plan</h2>
            <p className="text-xs text-slate-500">Track & manage your travel budget</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        {hasTrip ? (
          <>
            {/* Active trip overview */}
            <div className="rounded-xl bg-gradient-to-r from-slate-50 to-cyan-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">{latestTrip.title}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  latestTrip.status === 'PLANNING' ? 'bg-blue-100 text-blue-700' :
                  latestTrip.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {latestTrip.status}
                </span>
              </div>

              {totalBudget > 0 && (
                <div className="mt-3">
                  <div className="flex items-end justify-between text-xs text-slate-500">
                    <span>Spent {formatCurrency(spent)}</span>
                    <span>{formatCurrency(totalBudget)}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        spentPercent > 80 ? 'bg-rose-500' : spentPercent > 50 ? 'bg-amber-500' : 'bg-teal-500'
                      }`}
                      style={{ width: `${spentPercent}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    {remaining >= 0 ? `${formatCurrency(remaining)} remaining` : `${formatCurrency(Math.abs(remaining))} over budget`}
                  </p>
                </div>
              )}

              {/* Budget breakdown mini */}
              {(latestTrip.budgetItems || []).length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {(latestTrip.budgetItems || []).slice(0, 4).map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                        {item.category}
                      </span>
                      <span className="font-medium text-slate-700">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  {(latestTrip.budgetItems || []).length > 4 && (
                    <p className="text-[11px] text-slate-400">+{latestTrip.budgetItems.length - 4} more items</p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <Link
                to="/app/plan-trip"
                className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                View Plan
              </Link>
              <Link
                to="/app/plan-trip"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                + New
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* Empty state with features */}
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50">
                <svg className="h-7 w-7 text-teal-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-800">Plan Your Dream Trip</h3>
              <p className="mt-1 text-xs text-slate-500">Create a trip and track your budget</p>
            </div>

            <div className="mt-auto space-y-2 rounded-xl bg-slate-50 p-3">
              {[
                { icon: '₹', color: 'bg-emerald-100 text-emerald-700', label: 'Track expenses by category' },
                { icon: '📊', color: 'bg-blue-100 text-blue-700', label: 'Visual budget breakdown' },
                { icon: '🎯', color: 'bg-amber-100 text-amber-700', label: 'Set budget limits & alerts' },
              ].map((feat) => (
                <div key={feat.label} className="flex items-center gap-2.5 text-xs">
                  <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-xs ${feat.color}`}>{feat.icon}</span>
                  <span className="text-slate-600">{feat.label}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/app/plan-trip')}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-teal-200 transition hover:shadow-lg hover:shadow-teal-300"
            >
              + Create Your First Plan
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Main Dashboard ─────────────────────────────────────────────────── */
export default function UserDashboard() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [trendingDeals, setTrendingDeals] = useState([]);
  const [latestTrip, setLatestTrip] = useState(null);
  const [popularDestinations, setPopularDestinations] = useState([]);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const data = await apiFetch('/api/home/summary');
        if (!ignore) {
          setTrendingDeals(data.trendingDeals || []);
          setLatestTrip(data.latestTrip || null);
          setPopularDestinations(data.popularDestinations || []);
        }
      } catch {
        // fallback — show empty states
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => { ignore = true; };
  }, []);

  if (loading) return <Loading />;

  const firstName = user?.name?.split(' ')[0] || 'Traveler';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Greeting */}
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Welcome back, {firstName}
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">Discover your next adventure or manage your travel budget</p>
      </div>

      {/* ── Hero: Explore Packages (left) | Budget My Plan (right) ── */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left – Explore Packages */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-slate-900">Explore Packages</h2>
            <Link to="/app/packages" className="inline-flex items-center gap-1 text-sm font-semibold text-teal-600 hover:text-teal-700">
              View All
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
          <PackageCarousel packages={trendingDeals} />
        </div>

        {/* Right – Budget My Plan */}
        <div>
          <BudgetMyPlan latestTrip={latestTrip} />
        </div>
      </section>

      {/* ── Popular Destinations ── */}
      {popularDestinations.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-slate-900">Popular Destinations</h2>
            <Link to="/app/packages" className="text-sm font-semibold text-teal-600 hover:text-teal-700">View All</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
            {popularDestinations.map((dest) => (
              <Link key={dest.name} to={`/app/packages?q=${encodeURIComponent(dest.name)}`} className="group text-center">
                <div className="mx-auto h-20 w-20 overflow-hidden rounded-xl bg-slate-100 ring-2 ring-transparent transition group-hover:ring-teal-300">
                  {dest.imageUrl ? (
                    <img src={mediaUrl(dest.imageUrl)} alt={dest.name} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-cyan-50 text-sm font-semibold text-slate-500">{dest.name.slice(0, 2).toUpperCase()}</div>
                  )}
                </div>
                <p className="mt-1.5 text-xs font-semibold text-slate-700">{dest.name}</p>
                <p className="text-[10px] text-slate-400">{dest.count} {dest.count === 1 ? 'package' : 'packages'}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Best priced packages by Duration ── */}
      <DurationFilter />

      {/* ── Season Picks ── */}
      <SeasonPicks />
    </div>
  );
}
