import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { useToast } from '../context/ToastContext';

export default function Booking() {
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [error, setError] = useState('');

  const [packageId, setPackageId] = useState(searchParams.get('packageId') || '');
  const [travelDate, setTravelDate] = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState(null); // { valid, code, discountAmount, ... }
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [couponsOpen, setCouponsOpen] = useState(false);
  const [couponsLoading, setCouponsLoading] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadPackages() {
      try {
        const data = await apiFetch('/api/packages');
        if (!ignore) {
          setPackages(data.packages || []);

          if (!packageId && data.packages && data.packages[0]) {
            setPackageId(data.packages[0]._id);
          }
        }
      } catch (err) {
        if (!ignore) setError(err.message || 'Failed to load packages');
      } finally {
        if (!ignore) setLoadingPackages(false);
      }
    }

    loadPackages();
    return () => {
      ignore = true;
    };
  }, []);

  const selectedPackage = useMemo(() => packages.find((item) => item._id === packageId), [packages, packageId]);
  const [pricingPreview, setPricingPreview] = useState(null);
  const peopleCount = Number.isFinite(Number(numberOfPeople)) && Number(numberOfPeople) > 0 ? Number(numberOfPeople) : 1;

  useEffect(() => {
    let ignore = false;

    async function loadPricingPreview() {
      if (!packageId) {
        if (!ignore) setPricingPreview(null);
        return;
      }

      setPricingLoading(true);
      try {
        const query = travelDate ? `?travelDate=${encodeURIComponent(travelDate)}` : '';
        const data = await apiFetch(`/api/packages/${packageId}${query}`);
        if (!ignore) setPricingPreview(data.pricing || null);
      } catch (err) {
        if (!ignore) setPricingPreview(null);
      } finally {
        if (!ignore) setPricingLoading(false);
      }
    }

    loadPricingPreview();
    return () => {
      ignore = true;
    };
  }, [packageId, travelDate]);

  const basePerPerson = Number(selectedPackage?.price || 0);
  const discountPerPerson = Number(pricingPreview?.discountAmount || 0);
  const finalPerPerson = Number(pricingPreview?.finalPrice ?? basePerPerson);
  const totalBase = Number((basePerPerson * peopleCount).toFixed(2));
  const totalDiscount = Number((discountPerPerson * peopleCount).toFixed(2));
  const couponDiscountTotal = couponResult ? Number((couponResult.discountAmount * peopleCount).toFixed(2)) : 0;
  const estimatedTotal = Number((finalPerPerson * peopleCount - couponDiscountTotal).toFixed(2));

  // Reset coupon when package changes
  useEffect(() => {
    setCouponResult(null);
    setCouponError('');
    setCouponCode('');
    setAvailableCoupons([]);
    setCouponsOpen(false);
  }, [packageId]);

  async function fetchAvailableCoupons() {
    if (!packageId) return;
    setCouponsLoading(true);
    try {
      const data = await apiFetch(`/api/coupons/available?packageId=${packageId}`);
      setAvailableCoupons(data.coupons || []);
      setCouponsOpen(true);
    } catch {
      setAvailableCoupons([]);
      setCouponsOpen(true);
    } finally {
      setCouponsLoading(false);
    }
  }

  function selectCoupon(code) {
    setCouponCode(code);
    setCouponsOpen(false);
    // Auto-apply
    setCouponLoading(true);
    setCouponError('');
    setCouponResult(null);
    apiFetch('/api/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, packageId }),
    })
      .then((data) => setCouponResult(data))
      .catch((err) => setCouponError(err.message || 'Invalid coupon'))
      .finally(() => setCouponLoading(false));
  }

  async function handleApplyCoupon() {
    if (!couponCode.trim() || !packageId) return;
    setCouponLoading(true);
    setCouponError('');
    setCouponResult(null);
    try {
      const data = await apiFetch('/api/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code: couponCode.trim(), packageId }),
      });
      setCouponResult(data);
    } catch (err) {
      setCouponError(err.message || 'Invalid coupon');
    } finally {
      setCouponLoading(false);
    }
  }

  function removeCoupon() {
    setCouponResult(null);
    setCouponError('');
    setCouponCode('');
  }

  async function handleCreate(event) {
    event.preventDefault();
    setFormLoading(true);
    setError('');

    try {
      const body = { packageId, travelDate, numberOfPeople: Number(numberOfPeople) };
      if (couponResult?.code) body.couponCode = couponResult.code;
      const data = await apiFetch('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(body)
      });

      showToast(data.message || 'Booking created.', 'success');
      navigate(`/app/booking/result/${data.bookingId}`);
    } catch (err) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setFormLoading(false);
    }
  }

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-[60vh] px-4 py-8 sm:px-6 animate-fade-in">
      <div className="mx-auto w-full max-w-7xl grid grid-cols-1 gap-8 lg:grid-cols-[1fr_420px]">

      {/* ── Left: Booking Form ── */}
      <section className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">Book Your Trip</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Choose your package, pick a date, and you're all set.
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {/* Package Selection */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="packageId">
              Package
            </label>
            <div className="relative">
              <select
                id="packageId"
                value={packageId}
                onChange={(e) => setPackageId(e.target.value)}
                disabled={loadingPackages}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-10 text-sm font-medium outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">Choose a package...</option>
                {packages.map((pkg) => (
                  <option key={pkg._id} value={pkg._id}>
                    {pkg.title} — {pkg.destination} (₹{pkg.price?.toLocaleString()}/person)
                  </option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          {/* Date & People */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="travelDate">
                Travel Date
              </label>
              <div className="relative">
                <input
                  id="travelDate"
                  type="date"
                  required
                  min={minDate}
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="numberOfPeople">
                Travelers
              </label>
              <div className="relative">
                <input
                  id="numberOfPeople"
                  type="number"
                  min={1}
                  max={20}
                  required
                  value={numberOfPeople}
                  onChange={(e) => setNumberOfPeople(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
                <svg className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
            </div>
          </div>

          {/* Coupon Code */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Coupon Code</label>
            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="ENTER COUPON CODE"
                disabled={!!couponResult}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-mono font-semibold tracking-wider uppercase outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50 disabled:text-slate-400 placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:normal-case"
              />
              {couponResult ? (
                <button type="button" onClick={removeCoupon}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100">
                  Remove
                </button>
              ) : (
                <button type="button" onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim() || !packageId}
                  className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40">
                  {couponLoading ? 'Checking...' : 'Apply'}
                </button>
              )}
            </div>
            {couponError && <p className="mt-1.5 text-xs font-medium text-red-600">{couponError}</p>}
            {couponResult && (
              <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
                <svg className="h-4 w-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span className="text-sm font-semibold text-emerald-700">
                  {couponResult.code} applied — ₹{couponResult.discountAmount} off per person
                </span>
              </div>
            )}

            {/* View Available Coupons */}
            {!couponResult && packageId && (
              <button
                type="button"
                onClick={fetchAvailableCoupons}
                disabled={couponsLoading}
                className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 transition hover:text-emerald-700 disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {couponsLoading ? 'Loading coupons...' : couponsOpen ? 'Hide coupons' : 'View available coupons'}
              </button>
            )}

            {couponsOpen && !couponResult && (
              <div className="mt-3 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-cyan-50 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800">
                      Available Coupons
                      <span className="ml-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                        {availableCoupons.length}
                      </span>
                    </h3>
                    <button type="button" onClick={() => setCouponsOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>

                {availableCoupons.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <svg className="mx-auto h-10 w-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <p className="mt-2 text-sm text-slate-400">No coupons available for this package.</p>
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                    {availableCoupons.map((c) => (
                      <div key={c.code} className="group flex items-center justify-between px-4 py-3.5 transition hover:bg-emerald-50/40">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center rounded-lg border border-dashed border-emerald-300 bg-emerald-50 px-2.5 py-1 font-mono text-sm font-bold tracking-wider text-emerald-700">
                              {c.code}
                            </span>
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                            </span>
                          </div>
                          {c.description && (
                            <p className="mt-1 text-xs text-slate-500 line-clamp-1">{c.description}</p>
                          )}
                          <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-slate-400">
                            {c.minOrderAmount > 0 && <span>Min: ₹{c.minOrderAmount.toLocaleString()}</span>}
                            {c.maxDiscount > 0 && c.discountType === 'PERCENTAGE' && <span>Max: ₹{c.maxDiscount.toLocaleString()}</span>}
                            {c.expiresAt && <span>Expires: {new Date(c.expiresAt).toLocaleDateString()}</span>}
                          </div>
                        </div>
                        <div className="ml-3 flex flex-col items-end gap-1.5">
                          <span className="text-xs font-bold text-emerald-600">Save ₹{c.estimatedDiscount.toLocaleString()}</span>
                          <button
                            type="button"
                            onClick={() => selectCoupon(c.code)}
                            className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 active:scale-95"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <svg className="h-5 w-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={formLoading || !packageId || !travelDate || loadingPackages}
            className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 px-6 py-4 text-white shadow-lg transition-all duration-300 hover:from-slate-800 hover:to-slate-600 hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            {formLoading ? (
              <span className="relative flex items-center justify-center gap-2">
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating booking...
              </span>
            ) : (
              <span className="relative flex items-center justify-center gap-2 text-sm font-bold">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                Create Booking
              </span>
            )}
          </button>
        </form>
      </section>

      {/* ── Right: Booking Summary Sidebar ── */}
      <aside className="lg:sticky lg:top-8 h-fit space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Summary Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-700 px-6 py-5 text-white">
            <h2 className="font-display text-lg font-bold">Booking Summary</h2>
            <p className="text-xs text-white/60 mt-0.5">Review your selection</p>
          </div>

          {selectedPackage ? (
            <div className="p-6 space-y-5">
              {/* Selected Package */}
              <div className="flex items-start gap-3">
                {selectedPackage.imageUrl ? (
                  <img src={selectedPackage.imageUrl} alt={selectedPackage.title} className="h-16 w-16 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 shrink-0">
                    <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 line-clamp-2">{selectedPackage.title}</h3>
                  <p className="text-sm text-slate-500">{selectedPackage.destination}</p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Duration</p>
                  <p className="mt-0.5 text-sm font-bold text-slate-900">{selectedPackage.duration} days</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Travelers</p>
                  <p className="mt-0.5 text-sm font-bold text-slate-900">{peopleCount} {peopleCount === 1 ? 'person' : 'people'}</p>
                </div>
                {selectedPackage.category && (
                  <div className="col-span-2 rounded-xl bg-slate-50 p-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Category</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-900 capitalize">{selectedPackage.category}</p>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Price × {peopleCount}</span>
                  <span className="font-semibold text-slate-900">₹{totalBase.toLocaleString()}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Offer Discount</span>
                    <span className="font-semibold text-emerald-600">−₹{totalDiscount.toLocaleString()}</span>
                  </div>
                )}
                {couponDiscountTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Coupon ({couponResult?.code})</span>
                    <span className="font-semibold text-emerald-600">−₹{couponDiscountTotal.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-dashed border-slate-200 pt-3">
                  <span className="font-bold text-slate-700">Total</span>
                  <span className="text-2xl font-bold text-slate-900">₹{Math.max(0, estimatedTotal).toLocaleString()}</span>
                </div>
              </div>

              {pricingLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Checking discounts...
                </div>
              )}

              {pricingPreview?.appliedOfferDetails?.title && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500">🏷️</span>
                    <div>
                      <p className="text-xs font-semibold text-emerald-800">{pricingPreview.appliedOfferDetails.title}</p>
                      <p className="text-[10px] text-emerald-600">Auto-applied offer</p>
                    </div>
                  </div>
                </div>
              )}

              {travelDate && (
                <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <p className="text-sm font-semibold text-blue-800">
                      {new Date(travelDate).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                <svg className="h-8 w-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="mt-3 text-sm font-medium text-slate-500">Select a package to see the summary</p>
            </div>
          )}
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="flex flex-col items-center rounded-xl border border-slate-100 bg-white p-3 text-center">
            <svg className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            <p className="mt-1 text-[10px] font-semibold text-slate-500">Secure</p>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-slate-100 bg-white p-3 text-center">
            <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
            <p className="mt-1 text-[10px] font-semibold text-slate-500">Free Cancel</p>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-slate-100 bg-white p-3 text-center">
            <svg className="h-5 w-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="mt-1 text-[10px] font-semibold text-slate-500">24/7 Support</p>
          </div>
        </div>
      </aside>
      </div>
    </div>
  );
}
