import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiFetch, mediaUrl } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import SimilarPackages from '../components/SimilarPackages';

export default function PackageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useContext(AuthContext);
  const { addToCart, isInCart } = useCart();
  const { showToast } = useToast();
  const [packageData, setPackageData] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [userHasReviewed, setUserHasReviewed] = useState(false);

  useEffect(() => {
    loadPackage();
    loadReviews();
    if (isAuthenticated) {
      checkWishlist();
      checkConfirmedBooking();
    }
  }, [id, isAuthenticated]);

  async function loadPackage() {
    try {
      const data = await apiFetch(`/api/packages/${id}`);
      setPackageData(data.package);
      if (data.pricing) {
        setPricing(data.pricing);
      }
    } catch (err) {
      setError(err.message || 'Failed to load package');
    } finally {
      setLoading(false);
    }
  }

  async function loadReviews() {
    try {
      const data = await apiFetch(`/api/reviews/package/${id}`);
      setReviews(data.reviews || []);
      
      // Check if user has already reviewed this package
      if (user?.id) {
        const userReview = data.reviews?.find(r => r.userId?._id === user.id);
        setUserHasReviewed(!!userReview);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    }
  }

  async function checkWishlist() {
    try {
      const data = await apiFetch(`/api/wishlist/check?packageIds=${id}`);
      setIsWishlisted(data.wishlist?.includes(id) || false);
    } catch (err) {
      console.error('Failed to check wishlist:', err);
    }
  }

  async function checkConfirmedBooking() {
    try {
      const data = await apiFetch(`/api/bookings/my`);
      const bookings = data.bookings || [];
      const confirmedBookings = bookings.filter(
        (b) => b.packageId._id === id && (b.status === 'CONFIRMED' || b.status === 'COMPLETED')
      );
      if (confirmedBookings.length > 0) {
        setConfirmedBooking(confirmedBookings[0]);
      }
    } catch (err) {
      console.error('Failed to check booking:', err);
    }
  }

  async function toggleWishlist() {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      if (isWishlisted) {
        await apiFetch(`/api/wishlist/${id}`, { method: 'DELETE' });
        setIsWishlisted(false);
      } else {
        await apiFetch('/api/wishlist', {
          method: 'POST',
          body: JSON.stringify({ packageId: id })
        });
        setIsWishlisted(true);
      }
    } catch (err) {
      console.error('Failed to update wishlist:', err);
    }
  }

  async function submitReview() {
    try {
      await apiFetch('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          packageId: id,
          bookingId: confirmedBooking?._id,
          rating: reviewRating,
          comment: reviewComment
        })
      });
      setShowReviewModal(false);
      setReviewComment('');
      setReviewRating(5);
      setUserHasReviewed(true);
      await loadReviews();
      await loadPackage();
      showToast('Review submitted successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to submit review', 'error');
    }
  }

  if (loading) return <Loading fullPage />;
  if (error) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 animate-page-enter">
        <div className="mx-auto max-w-md rounded-2xl border border-red-200/80 bg-red-50 p-8 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100">
            <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
          </div>
          <p className="font-semibold text-red-700">{error}</p>
          <Link to="/app/packages" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
            Back to Packages
          </Link>
        </div>
      </div>
    );
  }

  if (!packageData) return null;

  const CATEGORY_CONFIG = {
    adventure: { icon: '🏔️', color: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    relaxation: { icon: '🏖️', color: 'bg-sky-50 text-sky-700 ring-sky-200' },
    cultural: { icon: '🏛️', color: 'bg-violet-50 text-violet-700 ring-violet-200' },
    romantic: { icon: '💕', color: 'bg-pink-50 text-pink-700 ring-pink-200' },
    budget: { icon: '💰', color: 'bg-amber-50 text-amber-700 ring-amber-200' },
  };
  const catConf = CATEGORY_CONFIG[packageData.category] || { icon: '📦', color: 'bg-slate-50 text-slate-700 ring-slate-200' };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 animate-page-enter">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/app/packages" className="hover:text-cyan-600 transition-colors">Packages</Link>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
        <span className="truncate font-medium text-slate-700">{packageData.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero Image */}
          <div className="group relative h-72 sm:h-96 overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 shadow-card">
            {packageData.imageUrl ? (
              <img src={mediaUrl(packageData.imageUrl)} alt={packageData.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-white/80">
                <span className="text-6xl">{catConf.icon}</span>
                <span className="text-sm font-medium">No image available</span>
              </div>
            )}
            {/* Overlay badges */}
            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 backdrop-blur-sm bg-white/90 ${catConf.color}`}>
                {catConf.icon} {packageData.category}
              </span>
              {pricing && pricing.discountAmount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/90 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
                  🏷️ {Math.round((pricing.discountAmount / packageData.price) * 100)}% OFF
                </span>
              )}
            </div>
            {/* Wishlist button */}
            <button
              onClick={toggleWishlist}
              className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm transition-all duration-200 ${
                isWishlisted
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                  : 'bg-white/80 text-slate-600 hover:bg-white hover:text-red-500'
              }`}
            >
              <svg className="h-5 w-5" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>

          {/* Main Info Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-card">
            {/* Title & Meta */}
            <div className="mb-6">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">{packageData.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                <div className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                  <span>{packageData.destination}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                  <span>{packageData.duration} days</span>
                </div>
                {packageData.agencyId?.businessName && (
                  <div className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008V7.5Z" />
                    </svg>
                    <span>{packageData.agencyId.businessName}</span>
                    {packageData.agencyId.isVerified && (
                      <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Rating */}
            {packageData.rating > 0 && (
              <div className="mb-6 inline-flex items-center gap-2.5 rounded-xl bg-amber-50 px-4 py-2.5 ring-1 ring-amber-200/60">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`h-4.5 w-4.5 ${i < Math.floor(packageData.rating) ? 'text-amber-400' : 'text-amber-200'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm font-bold text-amber-700">{packageData.rating.toFixed(1)}</span>
                <span className="text-xs text-amber-600/80">({packageData.reviewCount || 0} reviews)</span>
              </div>
            )}

            {/* Description */}
            <div className="mb-8">
              <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-slate-900">
                <svg className="h-5 w-5 text-cyan-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                About this package
              </h2>
              <p className="leading-relaxed text-slate-600">{packageData.description || 'No description available.'}</p>
            </div>

            {/* Itinerary - Timeline */}
            {packageData.itinerary && packageData.itinerary.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-slate-900">
                  <svg className="h-5 w-5 text-cyan-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m0 0-3-3m3 3 3-3m-3 3V6.75M3.375 20.1a11.95 11.95 0 0 0 8.625 3.9c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12c0 2.033.507 3.95 1.4 5.625" /></svg>
                  Day-by-day Itinerary
                </h2>
                <div className="relative space-y-0">
                  {/* Timeline line */}
                  <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full" />
                  {packageData.itinerary.map((item, idx) => (
                    <div key={idx} className="relative flex gap-4 pb-6 last:pb-0">
                      <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 text-xs font-bold text-white shadow-md shadow-cyan-500/20">
                        {item.day}
                      </div>
                      <div className="flex-1 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 transition-colors hover:bg-slate-50">
                        <h3 className="font-semibold text-slate-900">{item.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cancellation Policy */}
            {packageData.cancellationPolicy && packageData.cancellationPolicy.length > 0 && (
              <div>
                <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-slate-900">
                  <svg className="h-5 w-5 text-cyan-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>
                  Cancellation Policy
                </h2>
                <div className="overflow-hidden rounded-xl border border-slate-200/80">
                  {packageData.cancellationPolicy.map((slab, idx) => (
                    <div key={idx} className={`flex items-center justify-between px-4 py-3 text-sm ${idx % 2 === 0 ? 'bg-slate-50/80' : 'bg-white'}`}>
                      <span className="text-slate-600">{slab.daysBefore}+ days before departure</span>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200/60">{slab.refundPercent}% refund</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Reviews Section */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-card">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-slate-900">
                <svg className="h-5 w-5 text-cyan-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>
                Reviews
                {reviews.length > 0 && <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{reviews.length}</span>}
              </h2>
              {isAuthenticated && (
                <>
                  {confirmedBooking && !userHasReviewed ? (
                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-cyan-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/30"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                      Write Review
                    </button>
                  ) : !confirmedBooking ? (
                    <span className="text-xs text-slate-400 italic">Book to review</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                      Reviewed
                    </span>
                  )}
                </>
              )}
            </div>
            {reviews.length === 0 ? (
              <div className="py-8 text-center">
                <span className="text-4xl">💬</span>
                <p className="mt-3 text-sm text-slate-500">No reviews yet. Be the first to share your experience!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review._id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50">
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 text-sm font-bold text-white">
                          {(review.userId?.name || 'A')[0].toUpperCase()}
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-slate-900">{review.userId?.name || 'Anonymous'}</span>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <svg key={i} className={`h-3.5 w-3.5 ${i < review.rating ? 'text-amber-400' : 'text-slate-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    {review.comment && <p className="ml-12 text-sm leading-relaxed text-slate-600">{review.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <div className="sticky top-24 space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
            {/* Price */}
            <div className="pb-4 border-b border-slate-100">
              {pricing && pricing.discountAmount > 0 ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-3xl font-bold text-slate-900">₹{pricing.finalPrice?.toLocaleString()}</span>
                    <span className="text-sm text-slate-400 line-through">₹{packageData.price?.toLocaleString()}</span>
                  </div>
                  <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200/60">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" /></svg>
                    Save ₹{pricing.discountAmount?.toLocaleString()}
                  </div>
                </>
              ) : (
                <span className="font-display text-3xl font-bold text-slate-900">₹{packageData.price?.toLocaleString()}</span>
              )}
              <p className="mt-1 text-xs text-slate-500">per person • inclusive of taxes</p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link
                to={`/app/booking?packageId=${id}`}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-200 hover:from-cyan-600 hover:to-blue-600 hover:shadow-xl hover:shadow-cyan-500/30"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
                Book Now
              </Link>

              <button
                onClick={async () => {
                  if (isInCart(id)) {
                    showToast('Already in cart', 'info');
                    return;
                  }
                  const result = await addToCart(id);
                  if (result.success) {
                    showToast('Added to cart!', 'success');
                  } else {
                    showToast(result.message, 'error');
                  }
                }}
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200 ${
                  isInCart(id)
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isInCart(id) ? (
                  <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg> In Cart</>
                ) : (
                  <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg> Add to Cart</>
                )}
              </button>
            </div>

            {/* Quick Details */}
            <div className="space-y-3 pt-4 border-t border-slate-100 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Category</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${catConf.color}`}>
                  {catConf.icon} {packageData.category}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Duration</span>
                <span className="font-semibold text-slate-900">{packageData.duration} days</span>
              </div>
              {packageData.agencyId?.businessName && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Agency</span>
                  <span className="font-semibold text-slate-900">{packageData.agencyId.businessName}</span>
                </div>
              )}
            </div>

            {/* Chat with Agency */}
            {isAuthenticated && packageData.agencyId && (
              <div className="pt-4 border-t border-slate-100">
                <Link
                  to={`/app/chat?agencyId=${packageData.agencyId._id || packageData.agencyId}&packageId=${id}&message=${encodeURIComponent(`Hi, I'm interested in "${packageData.title}". Can you tell me more?`)}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-6 py-3 text-sm font-semibold text-cyan-700 transition-all duration-200 hover:bg-cyan-100 hover:border-cyan-300"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                  </svg>
                  Chat with Agency
                </Link>
              </div>
            )}
          </div>

          {/* Similar Packages & Also Booked */}
          <SimilarPackages packageId={id} />
        </div>
      </div>

      {/* Review Modal */}
      <Modal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)} title="Write a Review">
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Rating</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setReviewRating(rating)}
                  className={`rounded-xl p-2 transition-all duration-150 ${
                    rating <= reviewRating ? 'bg-amber-100 text-amber-500 scale-110' : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Comment</label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={4}
              className="focus-ring w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400"
              placeholder="Share your experience with this trip…"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={submitReview}
              className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-200 hover:from-cyan-600 hover:to-blue-600 hover:shadow-xl"
            >
              Submit Review
            </button>
            <button
              onClick={() => setShowReviewModal(false)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
