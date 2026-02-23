import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { apiFetch, mediaUrl } from '../utils/api';
import Loading from '../components/Loading';

/* ─── Constants ──────────────────────────────────────────────────────── */
const CATEGORIES = [
  { value: 'romantic', label: 'Honeymoon', icon: '💑' },
  { value: 'relaxation', label: 'Family', icon: '👨‍👩‍👧‍👦' },
  { value: 'adventure', label: 'Adventure', icon: '🏔️' },
  { value: 'cultural', label: 'Cultural', icon: '🏛️' },
  { value: 'budget', label: 'Budget', icon: '💰' },
];

const DURATION_RANGES = [
  { label: '1 to 3 Days', min: 1, max: 3 },
  { label: '4 to 6 Days', min: 4, max: 6 },
  { label: '7 to 9 Days', min: 7, max: 9 },
  { label: '10 to 12 Days', min: 10, max: 12 },
  { label: '13 or more', min: 13, max: null },
];

const BUDGET_RANGES = [
  { label: 'Less Than ₹10,000', min: 0, max: 10000 },
  { label: '₹10,000 – ₹20,000', min: 10000, max: 20000 },
  { label: '₹20,000 – ₹40,000', min: 20000, max: 40000 },
  { label: '₹40,000 – ₹60,000', min: 40000, max: 60000 },
  { label: '₹60,000 – ₹80,000', min: 60000, max: 80000 },
  { label: 'Above ₹80,000', min: 80000, max: null },
];

const HOTEL_STARS = [5, 4, 3, 2];

const INCLUSIONS = [
  { value: 'meals', label: 'Meals', icon: '🍽️' },
  { value: 'cab', label: 'Cab', icon: '🚕' },
  { value: 'shared-coach', label: 'Shared Coach', icon: '🚌' },
  { value: 'flights', label: 'Flights', icon: '✈️' },
  { value: 'hotel', label: 'Hotel', icon: '🏨' },
  { value: 'sightseeing', label: 'Sightseeing', icon: '📸' },
  { value: 'transfers', label: 'Transfers', icon: '🔄' },
  { value: 'insurance', label: 'Insurance', icon: '🛡️' },
];

const ACTIVITIES = [
  { value: 'adventure', label: 'Adventure', icon: '🧗' },
  { value: 'beach', label: 'Beach', icon: '🏖️' },
  { value: 'hill-station', label: 'Hill Station', icon: '⛰️' },
  { value: 'pilgrimage', label: 'Religious', icon: '🛕' },
  { value: 'wildlife', label: 'Wildlife', icon: '🦁' },
  { value: 'heritage', label: 'Heritage', icon: '🏰' },
  { value: 'honeymoon', label: 'Honeymoon', icon: '💍' },
  { value: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
  { value: 'luxury', label: 'Luxury', icon: '✨' },
  { value: 'backpacking', label: 'Backpacking', icon: '🎒' },
];

const SORT_OPTIONS = [
  { value: 'popularity', label: 'Popularity' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Rating' },
  { value: 'duration_asc', label: 'Duration: Short to Long' },
  { value: 'duration_desc', label: 'Duration: Long to Short' },
  { value: 'newest', label: 'Newest First' },
];

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amount || 0));
}

/* ─── Sidebar Filter Section ────────────────────────────────────────── */
function FilterSection({ title, children, onClear, collapsed, onToggle }) {
  return (
    <div className="border-b border-slate-100 py-4">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between text-sm font-semibold text-slate-800"
      >
        {title}
        <svg className={`h-4 w-4 text-slate-400 transition-transform ${collapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {!collapsed && (
        <div className="mt-3 space-y-2 animate-fade-in">
          {children}
          {onClear && (
            <button type="button" onClick={onClear} className="text-xs font-medium text-orange-500 hover:text-orange-600 uppercase tracking-wide">
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CheckboxOption({ checked, onChange, label, icon, count }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 hover:text-slate-900 group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400 cursor-pointer"
      />
      {icon && <span className="text-sm">{icon}</span>}
      <span className="flex-1 group-hover:text-slate-900">{typeof label === 'string' ? label : label}</span>
      {count !== undefined && <span className="text-xs text-slate-400">({count})</span>}
    </label>
  );
}

/* ─── Package Card (TravelTriangle style — vertical grid card) ────────── */
function PackageGridCard({ pkg }) {
  const { isAuthenticated } = useContext(AuthContext);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    if (isAuthenticated && pkg._id) {
      apiFetch(`/api/wishlist/check?packageIds=${pkg._id}`)
        .then(d => setIsWishlisted(d.wishlist?.includes(pkg._id) || false))
        .catch(() => {});
    }
  }, [isAuthenticated, pkg._id]);

  async function toggleWishlist(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;
    try {
      if (isWishlisted) {
        await apiFetch(`/api/wishlist/${pkg._id}`, { method: 'DELETE' });
        setIsWishlisted(false);
      } else {
        await apiFetch('/api/wishlist', { method: 'POST', body: JSON.stringify({ packageId: pkg._id }) });
        setIsWishlisted(true);
      }
    } catch {}
  }

  // Calculate discount from offers
  const bestOffer = (pkg.offers || []).reduce((best, cur) => {
    return (Number(cur.discountPercent || 0) > Number(best?.discountPercent || 0)) ? cur : best;
  }, null);
  const discountPct = Number(bestOffer?.discountPercent || 0);
  const originalPrice = pkg.price;
  const discountedPrice = discountPct > 0 ? Math.round(originalPrice * (1 - discountPct / 100)) : null;

  const nights = pkg.nightCount || (pkg.duration > 1 ? pkg.duration - 1 : 0);

  const themeLabels = {
    'beach': 'Beach', 'hill-station': 'Hill Station', 'wildlife': 'Wildlife',
    'heritage': 'Heritage', 'pilgrimage': 'Religious', 'honeymoon': 'Honeymoon',
    'family': 'Family', 'adventure': 'Adventure', 'luxury': 'Luxury', 'backpacking': 'Backpacking',
    'nature': 'Nature'
  };

  const inclusionLabels = {
    'meals': 'Meals', 'cab': 'Cab', 'shared-coach': 'Coach', 'flights': 'Flights',
    'hotel': 'Hotel', 'sightseeing': 'Sightseeing', 'transfers': 'Transfers', 'insurance': 'Insurance'
  };

  const inclusionIcons = {
    'meals': '🍽️', 'cab': '🚕', 'shared-coach': '🚌', 'flights': '✈️',
    'hotel': '🏨', 'sightseeing': '📸', 'transfers': '🔄', 'insurance': '🛡️'
  };

  const visibleInclusions = (pkg.inclusions || []).slice(0, 3);
  const extraInclusionCount = (pkg.inclusions || []).length - 3;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg">
      {/* ── Image ───────────────────────────────────────────── */}
      <div className="relative h-48 w-full flex-shrink-0 overflow-hidden">
        <Link to={`/app/packages/${pkg._id}`} className="block h-full">
          {pkg.imageUrl ? (
            <img src={mediaUrl(pkg.imageUrl)} alt={pkg.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600">
              <svg className="h-12 w-12 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
          )}
        </Link>

        {/* Wishlist */}
        <button onClick={toggleWishlist} className={`absolute top-2 right-2 rounded-full p-1.5 backdrop-blur-sm transition ${isWishlisted ? 'bg-red-500 text-white' : 'bg-white/80 text-slate-500 hover:bg-white hover:text-red-500'}`}>
          <svg className="h-4 w-4" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Inclusions icons bar at bottom of image */}
        {visibleInclusions.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 bg-white/95 backdrop-blur-sm px-3 py-1.5">
            {visibleInclusions.map(inc => (
              <span key={inc} className="flex flex-col items-center gap-0.5" title={inclusionLabels[inc]}>
                <span className="text-base">{inclusionIcons[inc]}</span>
                <span className="text-[9px] font-medium text-slate-600 leading-none">{inclusionLabels[inc]}</span>
              </span>
            ))}
            {extraInclusionCount > 0 && (
              <span className="ml-auto text-xs font-semibold text-orange-500">+{extraInclusionCount} more</span>
            )}
          </div>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col p-4">
        {/* Title */}
        <Link to={`/app/packages/${pkg._id}`} className="font-display text-sm font-bold text-slate-900 leading-snug hover:text-orange-600 transition-colors line-clamp-2 sm:text-base">
          {pkg.title}
        </Link>

        {/* Duration */}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-semibold text-orange-600">{pkg.duration} Days & {nights} {nights === 1 ? 'Night' : 'Nights'}</span>
        </div>

        {/* Price row + Themes */}
        <div className="mt-3 flex items-start justify-between gap-2">
          {/* Left: price */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Starting from:</span>
              {discountPct > 0 && (
                <span className="rounded bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{discountPct}% Off</span>
              )}
            </div>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold text-slate-900">{formatCurrency(discountedPrice || originalPrice)}/-</span>
              {discountedPrice && (
                <span className="text-xs text-slate-400 line-through">{formatCurrency(originalPrice)}/-</span>
              )}
            </div>
            <p className="text-[10px] text-slate-400">Per Person on twin sharing</p>
          </div>

          {/* Right: theme tags */}
          {(pkg.themes || []).length > 0 && (
            <div className="flex flex-col gap-1 items-end flex-shrink-0">
              {pkg.themes.slice(0, 2).map(t => (
                <span key={t} className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[10px] font-medium text-slate-600 whitespace-nowrap">
                  {themeLabels[t] || t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Hotel + Description side-by-side */}
        <div className="mt-3 flex gap-3">
          {/* Left: hotel + cities */}
          <div className="min-w-0 flex-1 space-y-2">
            {/* Hotel included in package */}
            {pkg.hotelStarRating && (
              <div>
                <p className="text-[10px] font-medium text-slate-500 mb-0.5">Hotel included in package:</p>
                <div className="flex items-center gap-1">
                  <span className="inline-flex items-center gap-0.5 rounded-full border border-green-300 bg-green-50 px-2 py-0.5">
                    <svg className="h-2.5 w-2.5 text-green-600" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="6" /></svg>
                    <span className="text-[10px] font-semibold text-green-700">{pkg.hotelStarRating} Star</span>
                  </span>
                </div>
              </div>
            )}

            {/* Cities */}
            {(pkg.cities || []).length > 0 && (
              <p className="text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">Cities:</span>{' '}
                {pkg.cities.map((city, i) => (
                  <span key={i}>
                    {i > 0 && <span className="mx-1 text-slate-300">→</span>}
                    {city}
                  </span>
                ))}
              </p>
            )}
          </div>

          {/* Right: description */}
          <div className="flex-1 min-w-0 hidden sm:block">
            <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-4">{pkg.description}</p>
          </div>
        </div>

        {/* Rating + Agency */}
        {(pkg.rating > 0 || pkg.agencyId?.businessName) && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            {pkg.rating > 0 && (
              <span className="inline-flex items-center gap-1 rounded bg-green-50 px-1.5 py-0.5 text-green-700 font-semibold">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                {pkg.rating.toFixed(1)} {pkg.reviewCount > 0 && `(${pkg.reviewCount})`}
              </span>
            )}
            {pkg.agencyId?.businessName && (
              <span className="flex items-center gap-1 text-slate-500">
                {pkg.agencyId.businessName}
                {pkg.agencyId.verificationStatus === 'VERIFIED' && (
                  <svg className="h-3 w-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                )}
              </span>
            )}
          </div>
        )}

        {/* ── Actions ─────────────────────────────────────────── */}
        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 mt-3">
          <Link
            to={`/app/packages/${pkg._id}`}
            className="text-sm font-semibold text-green-600 transition hover:text-green-700"
          >
            View Details
          </Link>
          <Link
            to={`/app/booking?packageId=${pkg._id}`}
            className="rounded-lg bg-red-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-600 hover:shadow-md"
          >
            Book Now
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ─── Main Packages Page ─────────────────────────────────────────────── */
export default function Packages() {
  const [searchParams] = useSearchParams();
  const [packages, setPackages] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileFilters, setMobileFilters] = useState(false);

  // Filter state
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const [sort, setSort] = useState('popularity');
  const [page, setPage] = useState(1);

  // Checkbox filters
  const [destTypes, setDestTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [durationIdx, setDurationIdx] = useState([]);
  const [budgetIdx, setBudgetIdx] = useState([]);
  const [hotelStars, setHotelStars] = useState([]);
  const [inclusions, setInclusions] = useState([]);
  const [activities, setActivities] = useState([]);

  // Collapsed state
  const [collapsed, setCollapsed] = useState({});
  const toggleCollapse = (key) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  // Toggle checkbox helper
  function toggleArr(setter, val) {
    setter(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  }

  // Build query and fetch
  const fetchPackages = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (sort) params.set('sort', sort);
      params.set('page', String(page));
      params.set('limit', '20');

      if (destTypes.length) params.set('destinationType', destTypes.join(','));
      if (categories.length) params.set('category', categories.join(','));
      if (inclusions.length) params.set('inclusions', inclusions.join(','));
      if (activities.length) params.set('themes', activities.join(','));
      if (hotelStars.length) params.set('hotelStarRating', hotelStars.join(','));

      // Duration: send individual ranges for proper $or handling
      if (durationIdx.length) {
        const ranges = durationIdx.map(i => {
          const r = DURATION_RANGES[i];
          return r.max ? `${r.min}-${r.max}` : `${r.min}-`;
        });
        params.set('durationRanges', ranges.join(','));
      }

      // Budget: send individual ranges for proper $or handling
      if (budgetIdx.length) {
        const ranges = budgetIdx.map(i => {
          const r = BUDGET_RANGES[i];
          return r.max ? `${r.min}-${r.max}` : `${r.min}-`;
        });
        params.set('budgetRanges', ranges.join(','));
      }

      const data = await apiFetch(`/api/packages?${params.toString()}`);
      setPackages(data.packages || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err.message || 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  }, [search, sort, page, destTypes, categories, durationIdx, budgetIdx, hotelStars, inclusions, activities]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, sort, destTypes, categories, durationIdx, budgetIdx, hotelStars, inclusions, activities]);

  function handleSearch(e) {
    e.preventDefault();
    setSearch(searchInput);
  }

  const activeFilterCount = destTypes.length + categories.length + durationIdx.length + budgetIdx.length + hotelStars.length + inclusions.length + activities.length;

  function clearAll() {
    setDestTypes([]);
    setCategories([]);
    setDurationIdx([]);
    setBudgetIdx([]);
    setHotelStars([]);
    setInclusions([]);
    setActivities([]);
    setSearch('');
    setSearchInput('');
  }

  /* ─── Sidebar Content ─────────────────────────────────────────────── */
  const sidebarContent = (
    <div className="space-y-0">
      {/* Destination Type */}
      <FilterSection title="Type Of Destination" collapsed={collapsed.dest} onToggle={() => toggleCollapse('dest')} onClear={destTypes.length ? () => setDestTypes([]) : null}>
        <div className="flex gap-4">
          {['domestic', 'international'].map(t => (
            <CheckboxOption key={t} checked={destTypes.includes(t)} onChange={() => toggleArr(setDestTypes, t)} label={t === 'domestic' ? 'India' : 'International'} />
          ))}
        </div>
      </FilterSection>

      {/* Categories */}
      <FilterSection title="Categories" collapsed={collapsed.cat} onToggle={() => toggleCollapse('cat')} onClear={categories.length ? () => setCategories([]) : null}>
        {CATEGORIES.map(c => (
          <CheckboxOption key={c.value} checked={categories.includes(c.value)} onChange={() => toggleArr(setCategories, c.value)} label={c.label} icon={c.icon} />
        ))}
      </FilterSection>

      {/* Duration */}
      <FilterSection title="Duration (in Days)" collapsed={collapsed.dur} onToggle={() => toggleCollapse('dur')} onClear={durationIdx.length ? () => setDurationIdx([]) : null}>
        <div className="grid grid-cols-2 gap-y-2 gap-x-4">
          {DURATION_RANGES.map((r, i) => (
            <CheckboxOption key={i} checked={durationIdx.includes(i)} onChange={() => toggleArr(setDurationIdx, i)} label={r.label} />
          ))}
        </div>
      </FilterSection>

      {/* Budget */}
      <FilterSection title="Budget Per Person (in ₹)" collapsed={collapsed.budget} onToggle={() => toggleCollapse('budget')} onClear={budgetIdx.length ? () => setBudgetIdx([]) : null}>
        {BUDGET_RANGES.map((r, i) => (
          <CheckboxOption key={i} checked={budgetIdx.includes(i)} onChange={() => toggleArr(setBudgetIdx, i)} label={r.label} />
        ))}
      </FilterSection>

      {/* Hotel Star Rating */}
      <FilterSection title="Hotel Star Rating" collapsed={collapsed.hotel} onToggle={() => toggleCollapse('hotel')} onClear={hotelStars.length ? () => setHotelStars([]) : null}>
        {HOTEL_STARS.map(s => (
          <CheckboxOption
            key={s}
            checked={hotelStars.includes(s)}
            onChange={() => toggleArr(setHotelStars, s)}
            label={
              <span className="flex items-center gap-1">
                {[...Array(s)].map((_, i) => (
                  <svg key={i} className="h-3.5 w-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                ))}
                <span className="ml-1 text-slate-600">{s} Star</span>
              </span>
            }
          />
        ))}
      </FilterSection>

      {/* Inclusions */}
      <FilterSection title="Inclusions" collapsed={collapsed.inc} onToggle={() => toggleCollapse('inc')} onClear={inclusions.length ? () => setInclusions([]) : null}>
        {INCLUSIONS.map(inc => (
          <CheckboxOption key={inc.value} checked={inclusions.includes(inc.value)} onChange={() => toggleArr(setInclusions, inc.value)} label={inc.label} icon={inc.icon} />
        ))}
      </FilterSection>

      {/* Activities / Themes */}
      <FilterSection title="Activities" collapsed={collapsed.act} onToggle={() => toggleCollapse('act')} onClear={activities.length ? () => setActivities([]) : null}>
        {ACTIVITIES.map(a => (
          <CheckboxOption key={a.value} checked={activities.includes(a.value)} onChange={() => toggleArr(setActivities, a.value)} label={a.label} icon={a.icon} />
        ))}
      </FilterSection>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 animate-fade-in">
      {/* Top search bar */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search destination, package, or keyword..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 shadow-sm transition focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
          </div>
          <button type="submit" className="rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-orange-600 hover:to-red-600">
            Search
          </button>
        </form>
      </div>

      <div className="flex gap-6">
        {/* ─── Desktop Sidebar ─────────────────────────────────────────── */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Filters</h2>
              {activeFilterCount > 0 && (
                <button onClick={clearAll} className="text-xs font-medium text-orange-500 hover:text-orange-600 uppercase">Reset</button>
              )}
            </div>
            {sidebarContent}
          </div>
        </aside>

        {/* ─── Main Content ────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Top bar: count + sort + mobile filter */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <p className="text-sm text-slate-600">
                Showing <span className="font-bold text-slate-900">{total}</span> Tour Packages
              </p>

              {/* Mobile filter button */}
              <button
                onClick={() => setMobileFilters(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 lg:hidden"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                Filters
                {activeFilterCount > 0 && <span className="rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{activeFilterCount}</span>}
              </button>
            </div>

            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Active filter pills */}
          {activeFilterCount > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {destTypes.map(t => (
                <span key={t} className="inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-2.5 py-1 text-xs font-medium text-orange-700">
                  {t === 'domestic' ? 'India' : 'International'}
                  <button onClick={() => toggleArr(setDestTypes, t)} className="hover:text-orange-900">×</button>
                </span>
              ))}
              {categories.map(c => (
                <span key={c} className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-medium text-blue-700">
                  {CATEGORIES.find(x => x.value === c)?.label || c}
                  <button onClick={() => toggleArr(setCategories, c)} className="hover:text-blue-900">×</button>
                </span>
              ))}
              {durationIdx.map(i => (
                <span key={`d${i}`} className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 px-2.5 py-1 text-xs font-medium text-purple-700">
                  {DURATION_RANGES[i].label}
                  <button onClick={() => toggleArr(setDurationIdx, i)} className="hover:text-purple-900">×</button>
                </span>
              ))}
              {budgetIdx.map(i => (
                <span key={`b${i}`} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  {BUDGET_RANGES[i].label}
                  <button onClick={() => toggleArr(setBudgetIdx, i)} className="hover:text-emerald-900">×</button>
                </span>
              ))}
              {hotelStars.map(s => (
                <span key={`h${s}`} className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-medium text-amber-700">
                  {s} Star
                  <button onClick={() => toggleArr(setHotelStars, s)} className="hover:text-amber-900">×</button>
                </span>
              ))}
              {inclusions.map(inc => (
                <span key={inc} className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 px-2.5 py-1 text-xs font-medium text-teal-700">
                  {INCLUSIONS.find(x => x.value === inc)?.label || inc}
                  <button onClick={() => toggleArr(setInclusions, inc)} className="hover:text-teal-900">×</button>
                </span>
              ))}
              {activities.map(a => (
                <span key={a} className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-700">
                  {ACTIVITIES.find(x => x.value === a)?.label || a}
                  <button onClick={() => toggleArr(setActivities, a)} className="hover:text-rose-900">×</button>
                </span>
              ))}
              <button onClick={clearAll} className="text-xs font-medium text-orange-500 hover:text-orange-600">Clear All</button>
            </div>
          )}

          {/* Package list */}
          {loading ? (
            <Loading />
          ) : error ? (
            <div className="rounded-xl bg-red-50 border border-red-200 p-6">
              <div className="flex items-center gap-3">
                <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium text-red-700">{error}</p>
              </div>
            </div>
          ) : packages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <svg className="mx-auto h-16 w-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-4 text-lg font-semibold text-slate-900">No packages found</p>
              <p className="mt-2 text-sm text-slate-600">Try adjusting your filters or search terms</p>
              {activeFilterCount > 0 && (
                <button onClick={clearAll} className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {packages.map((pkg, i) => (
                <div key={pkg._id} className="animate-scale-in" style={{ animationDelay: `${Math.min(i, 5) * 0.06}s` }}>
                  <PackageGridCard pkg={pkg} />
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let num = i + 1;
                if (totalPages > 7) {
                  if (page <= 4) num = i + 1;
                  else if (page >= totalPages - 3) num = totalPages - 6 + i;
                  else num = page - 3 + i;
                }
                return (
                  <button
                    key={num}
                    onClick={() => setPage(num)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${num === page ? 'bg-orange-500 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                  >
                    {num}
                  </button>
                );
              })}
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Mobile Filter Drawer ──────────────────────────────────────── */}
      {mobileFilters && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFilters(false)} />
          <div className="relative ml-auto w-80 max-w-full bg-white shadow-xl overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Filters</h2>
              <div className="flex items-center gap-3">
                {activeFilterCount > 0 && (
                  <button onClick={clearAll} className="text-xs font-medium text-orange-500 uppercase">Reset</button>
                )}
                <button onClick={() => setMobileFilters(false)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <div className="px-4 pb-20">
              {sidebarContent}
            </div>
            <div className="sticky bottom-0 border-t border-slate-100 bg-white p-4">
              <button onClick={() => setMobileFilters(false)} className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 py-3 text-sm font-semibold text-white">
                Show {total} Packages
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
