import React, { useEffect, useState } from 'react';
import { apiFetch, apiUrl, mediaUrl } from '../utils/api';
import { useToast } from '../context/ToastContext';

export default function AgencyDashboard() {
  const { showToast } = useToast();
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [error, setError] = useState('');

  async function fetchPackages() {
    try {
      const data = await apiFetch('/api/packages/my');
      setPackages(data.packages || []);
    } catch (err) {
      setError(err.message || 'Failed to load packages');
    }
  }

  useEffect(() => {
    fetchPackages();
  }, []);

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
    setTitle('');
    setDescription('');
    setImageUrl('');
    setImagePreviewError(false);
    setDestination('');
    setCategory('adventure');
    setPrice('');
    setDuration('');
    setItinerary([{ day: 1, title: '', description: '' }]);
    setCancellationPolicy([{ daysBefore: 7, refundPercent: 50 }]);
    setOffers([{ title: '', discountPercent: 0 }]);
    setBestSeasons([]);
    setThemes([]);
    setDestinationType('domestic');
    setPackageInclusions([]);
    setHotelStarRating('');
    setCities('');
    setNightCount('');
    setEditingPackageId('');
    setUploadError('');
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
        ? pkg.itinerary.map((item, index) => ({
            day: Number(item.day) || index + 1,
            title: item.title || '',
            description: item.description || ''
          }))
        : [{ day: 1, title: '', description: '' }]
    );
    setCancellationPolicy(
      pkg.cancellationPolicy?.length
        ? pkg.cancellationPolicy.map((slab) => ({
            daysBefore: Number(slab.daysBefore) || 0,
            refundPercent: Number(slab.refundPercent) || 0
          }))
        : [{ daysBefore: 7, refundPercent: 50 }]
    );
    setOffers(
      pkg.offers?.length
        ? pkg.offers.map((offer) => ({
            title: offer.title || '',
            discountPercent: Number(offer.discountPercent) || 0
          }))
        : [{ title: '', discountPercent: 0 }]
    );
    setBestSeasons(pkg.bestSeasons || []);
    setThemes(pkg.themes || []);
    setDestinationType(pkg.destinationType || 'domestic');
    setPackageInclusions(pkg.inclusions || []);
    setHotelStarRating(pkg.hotelStarRating != null ? String(pkg.hotelStarRating) : '');
    setCities((pkg.cities || []).join(', '));
    setNightCount(pkg.nightCount != null ? String(pkg.nightCount) : '');
    setUploadError('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  async function handleImageFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setUploadError('');
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(apiUrl('/api/packages/upload-image'), {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const contentType = response.headers.get('content-type') || '';
      const payload = contentType.includes('application/json') ? await response.json() : null;

      if (!response.ok) {
        throw new Error((payload && payload.message) || 'Failed to upload image');
      }

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
    setLoading(true);
    setError('');

    try {
      const payload = {
        title,
        description,
        imageUrl,
        destination,
        category,
        price: Number(price),
        duration: Number(duration),
        itinerary,
        cancellationPolicy,
        offers,
        bestSeasons,
        themes,
        destinationType,
        inclusions: packageInclusions,
        hotelStarRating: hotelStarRating ? Number(hotelStarRating) : undefined,
        cities: cities.split(',').map(c => c.trim()).filter(Boolean),
        nightCount: nightCount ? Number(nightCount) : undefined
      };

      if (editingPackageId) {
        await apiFetch(`/api/packages/${editingPackageId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch('/api/packages', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      await fetchPackages();
      const successMessage = editingPackageId ? 'Package updated' : 'Package created';
      resetForm();
      showToast(successMessage, 'success');
    } catch (err) {
      setError(err.message || (editingPackageId ? 'Failed to update package' : 'Failed to create package'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="animate-slide-down">
        <h1 className="font-display text-3xl font-bold text-slate-900">Agency Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">Create packages and monitor your inventory.</p>
      </header>

      {error && <p className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p>}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_1fr]">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-slide-in-left">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-slate-900">{editingPackageId ? 'Edit Package' : 'Create Package'}</h2>
            {editingPackageId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-all duration-300 focus:border-cyan-500 focus:ring-2 focus:scale-[1.02]" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Destination</label>
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-all duration-300 focus:border-cyan-500 focus:ring-2 focus:scale-[1.02]"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Package Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-all duration-300 focus:border-cyan-500 focus:ring-2 focus:scale-[1.02]"
                rows={4}
                placeholder="Write a clear overview of what travelers can expect from this package."
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Image URL (optional)</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setImagePreviewError(false);
                  setUploadError('');
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-all duration-300 focus:border-cyan-500 focus:ring-2 focus:scale-[1.02]"
                placeholder="https://example.com/package-image.jpg"
              />
              <div className="mt-2">
                <label className="mb-1 block text-xs font-semibold text-slate-600">Or choose from device</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  disabled={uploadingImage || loading}
                  className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                />
                {uploadingImage && <p className="mt-1 text-xs text-slate-500">Uploading image...</p>}
                {uploadError && <p className="mt-1 text-xs text-rose-600">{uploadError}</p>}
              </div>
              {imageUrl && !imagePreviewError && (
                <img
                  src={mediaUrl(imageUrl)}
                  alt="Package preview"
                  className="mt-2 h-28 w-full rounded-lg border border-slate-200 object-cover sm:w-56"
                  onError={() => setImagePreviewError(true)}
                />
              )}
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="adventure">Adventure</option>
                <option value="relaxation">Relaxation</option>
                <option value="cultural">Cultural</option>
                <option value="romantic">Romantic</option>
                <option value="budget">Budget</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Price</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Duration (days)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-all duration-300 focus:border-cyan-500 focus:ring-2 focus:scale-[1.02]"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Nights</label>
              <input
                type="number"
                value={nightCount}
                onChange={(e) => setNightCount(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-all duration-300 focus:border-cyan-500 focus:ring-2 focus:scale-[1.02]"
                placeholder="e.g. 4"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Destination Type</label>
              <select value={destinationType} onChange={(e) => setDestinationType(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="domestic">Domestic (India)</option>
                <option value="international">International</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Hotel Star Rating</label>
              <select value={hotelStarRating} onChange={(e) => setHotelStarRating(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">Not specified</option>
                <option value="1">1 Star</option>
                <option value="2">2 Star</option>
                <option value="3">3 Star</option>
                <option value="4">4 Star</option>
                <option value="5">5 Star</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Cities (comma-separated)</label>
              <input
                type="text"
                value={cities}
                onChange={(e) => setCities(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-all duration-300 focus:border-cyan-500 focus:ring-2 focus:scale-[1.02]"
                placeholder="e.g. Goa, Mumbai, Delhi"
              />
            </div>
          </div>

          {/* Inclusions */}
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Inclusions</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'meals', label: 'Meals', icon: '🍽️' },
                { value: 'cab', label: 'Cab', icon: '🚕' },
                { value: 'shared-coach', label: 'Shared Coach', icon: '🚌' },
                { value: 'flights', label: 'Flights', icon: '✈️' },
                { value: 'hotel', label: 'Hotel', icon: '🏨' },
                { value: 'sightseeing', label: 'Sightseeing', icon: '📸' },
                { value: 'transfers', label: 'Transfers', icon: '🔄' },
                { value: 'insurance', label: 'Insurance', icon: '🛡️' },
              ].map((inc) => (
                <button
                  key={inc.value}
                  type="button"
                  onClick={() => {
                    if (packageInclusions.includes(inc.value)) setPackageInclusions(packageInclusions.filter((v) => v !== inc.value));
                    else setPackageInclusions([...packageInclusions, inc.value]);
                  }}
                  className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 ${
                    packageInclusions.includes(inc.value)
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{inc.icon}</span> {inc.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Itinerary</h3>
              <button type="button" onClick={addItinerary} className="text-xs font-semibold text-cyan-700">
                + Add Day
              </button>
            </div>
            <div className="space-y-2">
              {itinerary.map((it, i) => (
                <div key={i} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={it.day}
                      onChange={(e) => updateItinerary(i, 'day', Number(e.target.value))}
                      className="w-16 rounded border border-slate-300 px-2 py-1 text-sm"
                    />
                    <input
                      placeholder="Title"
                      value={it.title}
                      onChange={(e) => updateItinerary(i, 'title', e.target.value)}
                      className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
                    />
                  </div>
                  <textarea
                    placeholder="Description"
                    value={it.description}
                    onChange={(e) => updateItinerary(i, 'description', e.target.value)}
                    className="mt-2 w-full rounded border border-slate-300 px-2 py-1 text-sm"
                  />
                  <div className="mt-1 text-right">
                    <button type="button" onClick={() => removeItinerary(i)} className="text-xs font-semibold text-rose-600">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Cancellation Policy</h3>
              <button type="button" onClick={addSlab} className="text-xs font-semibold text-cyan-700">
                + Add Slab
              </button>
            </div>
            <div className="space-y-2">
              {cancellationPolicy.map((s, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    value={s.daysBefore}
                    onChange={(e) => updateSlab(i, 'daysBefore', Number(e.target.value))}
                    className="w-24 rounded border border-slate-300 px-2 py-1 text-sm"
                  />
                  <span className="text-sm text-slate-600">days before</span>
                  <input
                    type="number"
                    value={s.refundPercent}
                    onChange={(e) => updateSlab(i, 'refundPercent', Number(e.target.value))}
                    className="w-24 rounded border border-slate-300 px-2 py-1 text-sm"
                  />
                  <span className="text-sm text-slate-600">% refund</span>
                  <button type="button" onClick={() => removeSlab(i)} className="text-xs font-semibold text-rose-600">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Offers</h3>
              <button type="button" onClick={addOffer} className="text-xs font-semibold text-cyan-700">
                + Add Offer
              </button>
            </div>
            <div className="space-y-2">
              {offers.map((offer, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <input
                    placeholder="Offer title"
                    value={offer.title}
                    onChange={(e) => updateOffer(i, 'title', e.target.value)}
                    className="min-w-[160px] flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
                  />
                  <input
                    type="number"
                    value={offer.discountPercent}
                    onChange={(e) => updateOffer(i, 'discountPercent', Number(e.target.value))}
                    className="w-24 rounded border border-slate-300 px-2 py-1 text-sm"
                  />
                  <span className="text-sm text-slate-600">%</span>
                  <button type="button" onClick={() => removeOffer(i)} className="text-xs font-semibold text-rose-600">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Best Seasons</h3>
            <div className="flex flex-wrap gap-3">
              {['jan-feb-mar', 'apr-may-jun', 'jul-aug-sep', 'oct-nov-dec'].map((season) => (
                <label key={season} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bestSeasons.includes(season)}
                    onChange={(e) => {
                      if (e.target.checked) setBestSeasons([...bestSeasons, season]);
                      else setBestSeasons(bestSeasons.filter((s) => s !== season));
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span className="text-xs font-medium text-slate-600 capitalize">{season.replace(/-/g, ' / ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Holiday Themes</h3>
            <div className="flex flex-wrap gap-2">
              {['beach', 'hill-station', 'wildlife', 'heritage', 'pilgrimage', 'honeymoon', 'family', 'adventure', 'luxury', 'backpacking'].map((theme) => (
                <button
                  key={theme}
                  type="button"
                  onClick={() => {
                    if (themes.includes(theme)) setThemes(themes.filter((t) => t !== theme));
                    else setThemes([...themes, theme]);
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 ${
                    themes.includes(theme)
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {theme.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || uploadingImage}
            className="mt-6 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading || uploadingImage ? 'Saving...' : editingPackageId ? 'Update Package' : 'Create Package'}
          </button>
        </form>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-slide-in-right">
          <h2 className="font-display text-xl font-bold text-slate-900">My Packages</h2>

          {packages.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No packages yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {packages.map((pkg) => (
                <article key={pkg._id} className="rounded-xl border border-slate-200 p-3">
                  <h3 className="font-semibold text-slate-900">{pkg.title}</h3>
                  {pkg.description && <p className="mt-1 text-sm text-slate-600">{pkg.description}</p>}
                  <p className="text-sm text-slate-600">
                    {pkg.destination} | {pkg.category}
                  </p>
                  <p className="text-sm text-slate-500">
                    ₹{pkg.price} | {pkg.duration} days
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(pkg)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm('Delete this package?')) return;
                        try {
                          await apiFetch(`/api/packages/${pkg._id}`, { method: 'DELETE' });
                          await fetchPackages();
                        } catch (err) {
                          setError(err.message || 'Failed to delete package');
                        }
                      }}
                      className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
