import React, { useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch, apiUrl, mediaUrl } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import Modal from '../components/Modal';
import Loading from '../components/Loading';

const CATEGORY_ICONS = {
  adventure: '🏔️', relaxation: '🏖️', cultural: '🏛️', romantic: '💕', budget: '💰',
};

const STATUS_BADGE = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  INACTIVE: 'bg-slate-100 text-slate-600 border-slate-200',
};

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100';
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500';

export default function AgencyPackages() {
  const { showToast } = useToast();
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('packages');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const [destination, setDestination] = useState('');
  const [category, setCategory] = useState('adventure');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [itinerary, setItinerary] = useState([{ day: 1, title: '', description: '' }]);
  const [cancellationPolicy, setCancellationPolicy] = useState([{ daysBefore: 7, refundPercent: 50 }]);
  const [offers, setOffers] = useState([{ title: '', discountPercent: 0 }]);
  const [bestSeasons, setBestSeasons] = useState([]);
  const [themes, setThemes] = useState([]);
  const [destinationType, setDestinationType] = useState('domestic');
  const [packageInclusions, setPackageInclusions] = useState([]);
  const [hotelStarRating, setHotelStarRating] = useState('');
  const [cities, setCities] = useState('');
  const [nightCount, setNightCount] = useState('');
  const [editingPackageId, setEditingPackageId] = useState('');
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  async function fetchPackages() {
    try {
      const data = await apiFetch('/api/packages/my');
      setPackages(data.packages || []);
    } catch (err) {
      setError(err.message || 'Failed to load packages');
    } finally {
      setInitialLoading(false);
    }
  }

  useEffect(() => { fetchPackages(); }, []);

  const stats = useMemo(() => {
    const total = packages.length;
    const active = packages.filter((p) => p.status === 'ACTIVE').length;
    const inactive = total - active;
    const avgPrice = total > 0 ? Math.round(packages.reduce((s, p) => s + (p.price || 0), 0) / total) : 0;
    const totalReviews = packages.reduce((s, p) => s + (p.reviewCount || 0), 0);
    return { total, active, inactive, avgPrice, totalReviews };
  }, [packages]);

  const filteredPackages = useMemo(() => {
    let list = packages;
    if (categoryFilter !== 'ALL') list = list.filter((p) => p.category === categoryFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.destination || '').toLowerCase().includes(q) ||
        (p.cities || []).some((c) => c.toLowerCase().includes(q))
      );
    }
    return list;
  }, [packages, categoryFilter, searchQuery]);

  const addItinerary = () => setItinerary([...itinerary, { day: itinerary.length + 1, title: '', description: '' }]);
  const removeItinerary = (i) => setItinerary(itinerary.filter((_, idx) => idx !== i));
  const updateItinerary = (i, key, val) => setItinerary(itinerary.map((it, idx) => (idx === i ? { ...it, [key]: val } : it)));

  const addSlab = () => setCancellationPolicy([...cancellationPolicy, { daysBefore: 0, refundPercent: 0 }]);
  const removeSlab = (i) => setCancellationPolicy(cancellationPolicy.filter((_, idx) => idx !== i));
  const updateSlab = (i, key, val) =>
    setCancellationPolicy(cancellationPolicy.map((s, idx) => (idx === i ? { ...s, [key]: val } : s)));

  const addOffer = () => setOffers([...offers, { title: '', discountPercent: 0 }]);
  const removeOffer = (i) => setOffers(offers.filter((_, idx) => idx !== i));
  const updateOffer = (i, key, val) => setOffers(offers.map((o, idx) => (idx === i ? { ...o, [key]: val } : o)));

  const resetForm = () => {
    setTitle(''); setDescription(''); setImageUrl(''); setImagePreviewError(false);
    setDestination(''); setCategory('adventure'); setPrice(''); setDuration('');
    setItinerary([{ day: 1, title: '', description: '' }]);
    setCancellationPolicy([{ daysBefore: 7, refundPercent: 50 }]);
    setOffers([{ title: '', discountPercent: 0 }]);
    setBestSeasons([]); setThemes([]); setDestinationType('domestic');
    setPackageInclusions([]); setHotelStarRating(''); setCities('');
    setNightCount(''); setEditingPackageId(''); setUploadError('');
  };

  const startEdit = (pkg) => {
    setEditingPackageId(pkg._id);
    setTitle(pkg.title || '');
    setDescription(pkg.description || '');
    setImageUrl(pkg.imageUrl || '');
    setImagePreviewError(false);
    setDestination(pkg.destination || '');
    setCategory(pkg.category || 'adventure');
    setPrice(pkg.price != null ? String(pkg.price) : '');
    setDuration(pkg.duration != null ? String(pkg.duration) : '');
    setItinerary(
      pkg.itinerary?.length
        ? pkg.itinerary.map((item, index) => ({ day: Number(item.day) || index + 1, title: item.title || '', description: item.description || '' }))
        : [{ day: 1, title: '', description: '' }]
    );
    setCancellationPolicy(
      pkg.cancellationPolicy?.length
        ? pkg.cancellationPolicy.map((slab) => ({ daysBefore: Number(slab.daysBefore) || 0, refundPercent: Number(slab.refundPercent) || 0 }))
        : [{ daysBefore: 7, refundPercent: 50 }]
    );
    setOffers(
      pkg.offers?.length
        ? pkg.offers.map((offer) => ({ title: offer.title || '', discountPercent: Number(offer.discountPercent) || 0 }))
        : [{ title: '', discountPercent: 0 }]
    );
    setBestSeasons(pkg.bestSeasons || []);
    setThemes(pkg.themes || []);
    setDestinationType(pkg.destinationType || 'domestic');
    setPackageInclusions(pkg.inclusions || []);
    setHotelStarRating(pkg.hotelStarRating != null ? String(pkg.hotelStarRating) : '');
    setCities((pkg.cities || []).join(', '));
    setNightCount(pkg.nightCount != null ? String(pkg.nightCount) : '');
    setUploadError(''); setError('');
    setActiveTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  async function handleImageFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingImage(true); setUploadError(''); setError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch(apiUrl('/api/packages/upload-image'), { method: 'POST', credentials: 'include', body: formData });
      const contentType = response.headers.get('content-type') || '';
      const payload = contentType.includes('application/json') ? await response.json() : null;
      if (!response.ok) throw new Error((payload && payload.message) || 'Failed to upload image');
      setImageUrl(payload.imagePath || payload.imageUrl || '');
      setImagePreviewError(false);
    } catch (err) {
      setUploadError(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true); setError('');
    try {
      const payload = {
        title, description, imageUrl, destination, category,
        price: Number(price), duration: Number(duration),
        itinerary, cancellationPolicy, offers, bestSeasons, themes, destinationType,
        inclusions: packageInclusions,
        hotelStarRating: hotelStarRating ? Number(hotelStarRating) : undefined,
        cities: cities.split(',').map(c => c.trim()).filter(Boolean),
        nightCount: nightCount ? Number(nightCount) : undefined,
      };
      if (editingPackageId) {
        await apiFetch(`/api/packages/${editingPackageId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiFetch('/api/packages', { method: 'POST', body: JSON.stringify(payload) });
      }
      await fetchPackages();
      showToast(editingPackageId ? 'Package updated' : 'Package created', 'success');
      resetForm();
      setActiveTab('packages');
    } catch (err) {
      setError(err.message || (editingPackageId ? 'Failed to update package' : 'Failed to create package'));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(pkgId) {
    try {
      await apiFetch(`/api/packages/${pkgId}`, { method: 'DELETE' });
      await fetchPackages();
      showToast('Package deleted', 'success');
    } catch (err) {
      setError(err.message || 'Failed to delete package');
    } finally {
      setDeleteConfirm(null);
    }
  }

  if (initialLoading) return <Loading />;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 animate-fade-in">
      {/* ─── Welcome Header ─── */}
      <header className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-6 shadow-lg sm:p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzMuMzE0IDAgNiAyLjY4NiA2IDZzLTIuNjg2IDYtNiA2LTYtMi42ODYtNi02IDIuNjg2LTYgNi02eiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative">
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
            Welcome back{user?.businessName ? `, ${user.businessName}` : ''}! 👋
          </h1>
          <p className="mt-1 text-sm text-white/80">Manage your travel packages and grow your business.</p>
        </div>
      </header>

      {/* ─── Stats Cards ─── */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: 'Total Packages', value: stats.total, icon: '📦', border: 'border-slate-200', bg: 'from-white to-slate-50' },
          { label: 'Active', value: stats.active, icon: '✅', border: 'border-emerald-200', bg: 'from-emerald-50 to-white' },
          { label: 'Inactive', value: stats.inactive, icon: '⏸️', border: 'border-amber-200', bg: 'from-amber-50 to-white' },
          { label: 'Avg. Price', value: `₹${stats.avgPrice.toLocaleString('en-IN')}`, icon: '💰', border: 'border-blue-200', bg: 'from-blue-50 to-white' },
          { label: 'Reviews', value: stats.totalReviews, icon: '⭐', border: 'border-purple-200', bg: 'from-purple-50 to-white' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border ${s.border} bg-gradient-to-br ${s.bg} p-4 shadow-sm text-center transition hover:shadow-md`}>
            <span className="text-xl">{s.icon}</span>
            <p className="mt-1 text-xs font-medium text-slate-500">{s.label}</p>
            <p className="mt-0.5 text-xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </section>

      {/* ─── Tabs ─── */}
      <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('packages')}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
            activeTab === 'packages'
              ? 'bg-amber-500 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span className="mr-1.5">📋</span> My Packages ({packages.length})
        </button>
        <button
          type="button"
          onClick={() => { resetForm(); setActiveTab('create'); }}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
            activeTab === 'create'
              ? 'bg-amber-500 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span className="mr-1.5">{editingPackageId ? '✏️' : '➕'}</span>
          {editingPackageId ? 'Edit Package' : 'Create Package'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <svg className="h-5 w-5 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          <p className="text-sm font-medium text-red-700">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* ═══════════════════ PACKAGES TAB ═══════════════════ */}
      {activeTab === 'packages' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                placeholder="Search packages…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            >
              <option value="ALL">All Categories</option>
              <option value="adventure">🏔️ Adventure</option>
              <option value="relaxation">🏖️ Relaxation</option>
              <option value="cultural">🏛️ Cultural</option>
              <option value="romantic">💕 Romantic</option>
              <option value="budget">💰 Budget</option>
            </select>
            <button
              type="button"
              onClick={() => { resetForm(); setActiveTab('create'); }}
              className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 hover:shadow-md"
            >
              + New Package
            </button>
          </div>

          {/* Package Cards Grid */}
          {filteredPackages.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
              <span className="text-4xl">📦</span>
              <h3 className="mt-3 text-lg font-bold text-slate-700">
                {packages.length === 0 ? 'No packages yet' : 'No matching packages'}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {packages.length === 0
                  ? 'Create your first travel package to get started.'
                  : 'Try adjusting your search or filter.'}
              </p>
              {packages.length === 0 && (
                <button onClick={() => setActiveTab('create')} className="mt-4 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600">
                  Create Package
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPackages.map((pkg, idx) => (
                <article
                  key={pkg._id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-scale-in"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  {/* Image */}
                  <div className="relative h-40 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                    {pkg.imageUrl ? (
                      <img
                        src={mediaUrl(pkg.imageUrl)}
                        alt={pkg.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-5xl opacity-30">{CATEGORY_ICONS[pkg.category] || '🌍'}</span>
                      </div>
                    )}
                    {/* Status Badge */}
                    <div className="absolute left-3 top-3">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${STATUS_BADGE[pkg.status] || STATUS_BADGE.ACTIVE}`}>
                        {pkg.status || 'Active'}
                      </span>
                    </div>
                    {/* Category */}
                    <div className="absolute right-3 top-3">
                      <span className="rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-bold capitalize tracking-wider text-slate-700">
                        {pkg.category}
                      </span>
                    </div>
                    {/* Price Badge */}
                    <div className="absolute bottom-3 right-3">
                      <span className="rounded-xl bg-slate-900/80 backdrop-blur-sm px-3 py-1 text-sm font-bold text-white">
                        ₹{(pkg.price || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="font-display text-base font-bold text-slate-900 line-clamp-1">{pkg.title}</h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {pkg.destination}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {pkg.duration}D{pkg.nightCount ? `/${pkg.nightCount}N` : ''}
                      </span>
                      {pkg.rating > 0 && (
                        <span className="flex items-center gap-0.5">
                          <svg className="h-3.5 w-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                          {pkg.rating.toFixed(1)} ({pkg.reviewCount})
                        </span>
                      )}
                    </div>
                    {pkg.description && (
                      <p className="mt-2 text-xs text-slate-500 line-clamp-2">{pkg.description}</p>
                    )}

                    {/* Inclusions */}
                    {pkg.inclusions?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {pkg.inclusions.slice(0, 4).map((inc) => (
                          <span key={inc} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 capitalize">
                            {inc.replace(/-/g, ' ')}
                          </span>
                        ))}
                        {pkg.inclusions.length > 4 && (
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                            +{pkg.inclusions.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-auto flex gap-2 pt-3">
                      <button
                        type="button"
                        onClick={() => startEdit(pkg)}
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-300"
                      >
                        <svg className="mr-1 inline h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(pkg._id)}
                        className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 hover:border-red-300"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════ CREATE/EDIT TAB ═══════════════════ */}
      {activeTab === 'create' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Basic Info */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-lg">📝</div>
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-900">{editingPackageId ? 'Edit Package' : 'New Package'}</h2>
                  <p className="text-xs text-slate-500">Basic information about your travel package</p>
                </div>
              </div>
              {editingPackageId && (
                <button type="button" onClick={() => { resetForm(); setActiveTab('packages'); }} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
                  Cancel
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="e.g. Golden Triangle Tour" required />
              </div>
              <div>
                <label className={labelClass}>Destination</label>
                <input value={destination} onChange={(e) => setDestination(e.target.value)} className={inputClass} placeholder="e.g. Rajasthan" required />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputClass} resize-none`} rows={3} placeholder="What makes this package special?" required />
              </div>
            </div>
          </div>

          {/* Section: Image */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-lg">🖼️</div>
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">Cover Image</h3>
                <p className="text-xs text-slate-500">Upload or link a cover photo</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="flex-1 space-y-3">
                <input type="url" value={imageUrl} onChange={(e) => { setImageUrl(e.target.value); setImagePreviewError(false); setUploadError(''); }} className={inputClass} placeholder="https://example.com/image.jpg" />
                <div className="relative">
                  <input type="file" accept="image/*" onChange={handleImageFileChange} disabled={uploadingImage || loading} className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-amber-50 file:px-4 file:py-2.5 file:font-semibold file:text-amber-700 hover:file:bg-amber-100 file:cursor-pointer file:transition" />
                  {uploadingImage && <p className="mt-1 text-xs text-amber-600 animate-pulse">Uploading...</p>}
                  {uploadError && <p className="mt-1 text-xs text-red-600">{uploadError}</p>}
                </div>
              </div>
              {imageUrl && !imagePreviewError && (
                <div className="relative h-28 w-40 shrink-0 overflow-hidden rounded-xl border border-slate-200">
                  <img src={mediaUrl(imageUrl)} alt="Preview" className="h-full w-full object-cover" onError={() => setImagePreviewError(true)} />
                  <button type="button" onClick={() => { setImageUrl(''); setImagePreviewError(false); }} className="absolute right-1 top-1 rounded-full bg-white/90 p-1 shadow-sm transition hover:bg-red-50">
                    <svg className="h-3.5 w-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Section: Pricing & Details */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-lg">💰</div>
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">Pricing & Details</h3>
                <p className="text-xs text-slate-500">Set pricing, duration, and accommodation</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              <div>
                <label className={labelClass}>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                  <option value="adventure">Adventure</option>
                  <option value="relaxation">Relaxation</option>
                  <option value="cultural">Cultural</option>
                  <option value="romantic">Romantic</option>
                  <option value="budget">Budget</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Price (₹)</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} placeholder="15000" required />
              </div>
              <div>
                <label className={labelClass}>Duration (Days)</label>
                <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className={inputClass} placeholder="5" required />
              </div>
              <div>
                <label className={labelClass}>Nights</label>
                <input type="number" value={nightCount} onChange={(e) => setNightCount(e.target.value)} className={inputClass} placeholder="4" />
              </div>
              <div>
                <label className={labelClass}>Type</label>
                <select value={destinationType} onChange={(e) => setDestinationType(e.target.value)} className={inputClass}>
                  <option value="domestic">Domestic</option>
                  <option value="international">International</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Hotel Stars</label>
                <select value={hotelStarRating} onChange={(e) => setHotelStarRating(e.target.value)} className={inputClass}>
                  <option value="">Not specified</option>
                  {[1,2,3,4,5].map((n) => <option key={n} value={n}>{'⭐'.repeat(n)}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Cities</label>
                <input type="text" value={cities} onChange={(e) => setCities(e.target.value)} className={inputClass} placeholder="Jaipur, Agra, Delhi" />
              </div>
            </div>
          </div>

          {/* Section: Inclusions & Themes */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-lg">🎯</div>
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">Inclusions & Themes</h3>
                <p className="text-xs text-slate-500">What's included and best-fit tags</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Inclusions</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'meals', label: 'Meals', icon: '🍽️' }, { value: 'cab', label: 'Cab', icon: '🚕' },
                    { value: 'shared-coach', label: 'Coach', icon: '🚌' }, { value: 'flights', label: 'Flights', icon: '✈️' },
                    { value: 'hotel', label: 'Hotel', icon: '🏨' }, { value: 'sightseeing', label: 'Sightseeing', icon: '📸' },
                    { value: 'transfers', label: 'Transfers', icon: '🔄' }, { value: 'insurance', label: 'Insurance', icon: '🛡️' },
                  ].map((inc) => (
                    <button key={inc.value} type="button" onClick={() => {
                      if (packageInclusions.includes(inc.value)) setPackageInclusions(packageInclusions.filter((v) => v !== inc.value));
                      else setPackageInclusions([...packageInclusions, inc.value]);
                    }} className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                      packageInclusions.includes(inc.value) ? 'bg-amber-500 text-white shadow-md scale-105' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}>
                      <span>{inc.icon}</span> {inc.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Best Seasons</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'jan-feb-mar', label: '❄️ Winter (Jan-Mar)' },
                    { value: 'apr-may-jun', label: '🌸 Spring (Apr-Jun)' },
                    { value: 'jul-aug-sep', label: '🌧️ Monsoon (Jul-Sep)' },
                    { value: 'oct-nov-dec', label: '🍂 Autumn (Oct-Dec)' },
                  ].map((s) => (
                    <button key={s.value} type="button" onClick={() => {
                      if (bestSeasons.includes(s.value)) setBestSeasons(bestSeasons.filter((v) => v !== s.value));
                      else setBestSeasons([...bestSeasons, s.value]);
                    }} className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                      bestSeasons.includes(s.value) ? 'bg-amber-500 text-white shadow-md scale-105' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Themes</p>
                <div className="flex flex-wrap gap-2">
                  {['beach', 'hill-station', 'wildlife', 'heritage', 'pilgrimage', 'honeymoon', 'family', 'adventure', 'luxury', 'backpacking'].map((theme) => (
                    <button key={theme} type="button" onClick={() => {
                      if (themes.includes(theme)) setThemes(themes.filter((t) => t !== theme));
                      else setThemes([...themes, theme]);
                    }} className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all capitalize ${
                      themes.includes(theme) ? 'bg-amber-500 text-white shadow-md scale-105' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}>
                      {theme.replace(/-/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Itinerary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-100 text-lg">🗺️</div>
                <div>
                  <h3 className="font-display text-base font-bold text-slate-900">Itinerary</h3>
                  <p className="text-xs text-slate-500">Day-by-day plan for travelers</p>
                </div>
              </div>
              <button type="button" onClick={addItinerary} className="rounded-xl bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100">
                + Add Day
              </button>
            </div>
            <div className="space-y-3">
              {itinerary.map((it, i) => (
                <div key={i} className="relative rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <div className="absolute -left-px top-4 h-8 w-1 rounded-r-full bg-amber-400" />
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-xs font-bold text-amber-700">
                      D{it.day}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input value={it.day} type="number" onChange={(e) => updateItinerary(i, 'day', Number(e.target.value))} className="hidden" />
                      <input placeholder="Day title" value={it.title} onChange={(e) => updateItinerary(i, 'title', e.target.value)} className={inputClass} />
                      <textarea placeholder="What happens on this day?" value={it.description} onChange={(e) => updateItinerary(i, 'description', e.target.value)} className={`${inputClass} resize-none`} rows={2} />
                    </div>
                    <button type="button" onClick={() => removeItinerary(i)} className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Cancellation & Offers */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Cancellation Policy */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-lg">🛡️</div>
                  <h3 className="font-display text-base font-bold text-slate-900">Cancellation</h3>
                </div>
                <button type="button" onClick={addSlab} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100">
                  + Slab
                </button>
              </div>
              <div className="space-y-3">
                {cancellationPolicy.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                    <input type="number" value={s.daysBefore} onChange={(e) => updateSlab(i, 'daysBefore', Number(e.target.value))} className="w-20 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-center outline-none focus:border-amber-400" />
                    <span className="text-xs text-slate-500">days →</span>
                    <input type="number" value={s.refundPercent} onChange={(e) => updateSlab(i, 'refundPercent', Number(e.target.value))} className="w-20 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-center outline-none focus:border-amber-400" />
                    <span className="text-xs text-slate-500">%</span>
                    <button type="button" onClick={() => removeSlab(i)} className="ml-auto rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Offers */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-lg">🏷️</div>
                  <h3 className="font-display text-base font-bold text-slate-900">Offers</h3>
                </div>
                <button type="button" onClick={addOffer} className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100">
                  + Offer
                </button>
              </div>
              <div className="space-y-3">
                {offers.map((offer, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                    <input placeholder="Offer title" value={offer.title} onChange={(e) => updateOffer(i, 'title', e.target.value)} className="flex-1 min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400" />
                    <input type="number" value={offer.discountPercent} onChange={(e) => updateOffer(i, 'discountPercent', Number(e.target.value))} className="w-20 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-center outline-none focus:border-amber-400" />
                    <span className="text-xs text-slate-500">%</span>
                    <button type="button" onClick={() => removeOffer(i)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3">
            {editingPackageId && (
              <button type="button" onClick={() => { resetForm(); setActiveTab('packages'); }} className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                Cancel
              </button>
            )}
            <button type="submit" disabled={loading || uploadingImage} className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-amber-200 transition hover:shadow-xl hover:shadow-amber-300 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading || uploadingImage ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  Saving...
                </span>
              ) : editingPackageId ? '✅ Update Package' : '🚀 Create Package'}
            </button>
          </div>
        </form>
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Package">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <svg className="h-7 w-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </div>
          <p className="text-sm text-slate-500">This action cannot be undone. All data for this package will be permanently removed.</p>
          <div className="flex justify-center gap-3 pt-2">
            <button onClick={() => setDeleteConfirm(null)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
              Cancel
            </button>
            <button onClick={() => handleDelete(deleteConfirm)} className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700">
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
