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
    <div className="mx-auto w-full max-w-7xl grid grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_400px] animate-fade-in">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 animate-slide-in-left">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-slate-900">Create a Booking</h1>
          <p className="mt-2 text-sm text-slate-600">
            Fill in the details below to book your travel package. Payments are currently disabled in this environment.
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="packageId">
              Select Package
            </label>
            <select
              id="packageId"
              value={packageId}
              onChange={(e) => setPackageId(e.target.value)}
              disabled={loadingPackages}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none ring-cyan-300 transition-all duration-300 focus:border-cyan-500 focus:ring-2 focus:scale-[1.02] disabled:bg-slate-50"
            >
              <option value="">Choose a package...</option>
              {packages.map((pkg) => (
                <option key={pkg._id} value={pkg._id}>
                  {pkg.title} - {pkg.destination} (₹{pkg.price?.toLocaleString()} / person)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="travelDate">
                Travel Date
              </label>
              <input
                id="travelDate"
                type="date"
                required
                min={minDate}
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none ring-cyan-300 transition focus:border-cyan-500 focus:ring-2"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="numberOfPeople">
                Number of People
              </label>
              <input
                id="numberOfPeople"
                type="number"
                min={1}
                max={20}
                required
                value={numberOfPeople}
                onChange={(e) => setNumberOfPeople(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none ring-cyan-300 transition focus:border-cyan-500 focus:ring-2"
              />
            </div>
          </div>

          {/* Coupon Code */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Coupon Code</label>
            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                disabled={!!couponResult}
                className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm uppercase outline-none ring-cyan-300 transition focus:border-cyan-500 focus:ring-2 disabled:bg-slate-50"
              />
              {couponResult ? (
                <button type="button" onClick={removeCoupon}
                  className="rounded-xl border border-red-300 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                  Remove
                </button>
              ) : (
                <button type="button" onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim() || !packageId}
                  className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-50">
                  {couponLoading ? 'Checking...' : 'Apply'}
                </button>
              )}
            </div>
            {couponError && <p className="mt-1.5 text-xs font-medium text-red-600">{couponError}</p>}
            {couponResult && (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                <svg className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span className="text-sm font-medium text-emerald-700">
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
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-600 transition hover:text-cyan-700 disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {couponsLoading ? 'Loading coupons...' : couponsOpen ? 'Hide available coupons' : 'View available coupons'}
              </button>
            )}

            {couponsOpen && !couponResult && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                <div className="border-b border-slate-200 bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800">
                      Available Coupons
                      <span className="ml-1.5 rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-semibold text-cyan-700">
                        {availableCoupons.length}
                      </span>
                    </h3>
                    <button type="button" onClick={() => setCouponsOpen(false)} className="text-slate-400 hover:text-slate-600">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>

                {availableCoupons.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <svg className="mx-auto h-8 w-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <p className="mt-2 text-sm text-slate-500">No coupons available for this package right now.</p>
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-200">
                    {availableCoupons.map((c) => (
                      <div key={c.code} className="group flex items-center justify-between px-4 py-3 transition hover:bg-white">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-md border border-dashed border-cyan-400 bg-cyan-50 px-2.5 py-1 font-mono text-sm font-bold tracking-wider text-cyan-700">
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
                            {c.minOrderAmount > 0 && (
                              <span>Min order: ₹{c.minOrderAmount.toLocaleString()}</span>
                            )}
                            {c.maxDiscount > 0 && c.discountType === 'PERCENTAGE' && (
                              <span>Max discount: ₹{c.maxDiscount.toLocaleString()}</span>
                            )}
                            {c.expiresAt && (
                              <span>Expires: {new Date(c.expiresAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="ml-3 flex flex-col items-end gap-1">
                          <span className="text-xs font-semibold text-emerald-600">
                            Save ₹{c.estimatedDiscount.toLocaleString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => selectCoupon(c.code)}
                            className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-cyan-700 active:scale-95"
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
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={formLoading || !packageId || loadingPackages}
            className="w-full rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:from-slate-800 hover:to-slate-600 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {formLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating booking...
              </span>
            ) : (
              'Create Booking'
            )}
          </button>
        </form>
      </section>

      <aside className="sticky top-4 h-fit rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm animate-slide-in-right">
        <h2 className="font-display text-xl font-bold text-slate-900">Booking Summary</h2>
        {selectedPackage ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="font-semibold text-slate-900">{selectedPackage.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{selectedPackage.destination}</p>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Duration:</span>
                <span className="font-semibold text-slate-900">{selectedPackage.duration} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Price / person:</span>
                <span className="font-semibold text-slate-900">₹{selectedPackage.price?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">People:</span>
                <span className="font-semibold text-slate-900">{peopleCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Base total:</span>
                <span className="font-semibold text-slate-900">₹{totalBase.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Discount:</span>
                <span className="font-semibold text-emerald-600">₹{totalDiscount.toLocaleString()}</span>
              </div>
              {couponDiscountTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Coupon ({couponResult?.code}):</span>
                  <span className="font-semibold text-emerald-600">-₹{couponDiscountTotal.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-100 pt-2">
                <span className="text-slate-600 font-semibold">Final total:</span>
                <span className="font-bold text-lg text-slate-900">₹{Math.max(0, estimatedTotal).toLocaleString()}</span>
              </div>
              {selectedPackage.category && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Category:</span>
                  <span className="font-semibold capitalize text-slate-900">{selectedPackage.category}</span>
                </div>
              )}
            </div>

            {pricingLoading && (
              <p className="text-xs font-medium text-slate-500">Checking available discounts...</p>
            )}
            {pricingPreview?.appliedOfferDetails?.title && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs font-medium text-emerald-700">Applied Offer</p>
                <p className="mt-1 text-sm font-semibold text-emerald-900">{pricingPreview.appliedOfferDetails.title}</p>
              </div>
            )}

            {travelDate && (
              <div className="rounded-lg bg-cyan-50 p-3">
                <p className="text-xs font-medium text-cyan-700">Travel Date</p>
                <p className="mt-1 text-sm font-semibold text-cyan-900">
                  {new Date(travelDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-3 text-sm font-medium text-slate-600">Select a package to see details</p>
          </div>
        )}
      </aside>
    </div>
  );
}
