import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiFetch, mediaUrl } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import Loading from '../components/Loading';
import Modal from '../components/Modal';

export default function PackageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);
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

  useEffect(() => {
    loadPackage();
    loadReviews();
    if (isAuthenticated) {
      checkWishlist();
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
          rating: reviewRating,
          comment: reviewComment
        })
      });
      setShowReviewModal(false);
      setReviewComment('');
      setReviewRating(5);
      await loadReviews();
      await loadPackage();
    } catch (err) {
      showToast(err.message || 'Failed to submit review', 'error');
    }
  }

  if (loading) return <Loading />;
  if (error) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <div className="rounded-xl bg-red-50 border border-red-200 p-6">
          <p className="font-medium text-red-700">{error}</p>
          <Link to="/app/packages" className="mt-4 inline-block text-sm text-red-600 underline">
            Back to Packages
          </Link>
        </div>
      </div>
    );
  }

  if (!packageData) return null;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 animate-fade-in">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative h-64 overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 animate-scale-in">
            {packageData.imageUrl ? (
              <img src={mediaUrl(packageData.imageUrl)} alt={packageData.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-white">
                <svg className="h-24 w-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h1 className="font-display text-3xl font-bold text-slate-900">{packageData.title}</h1>
                <div className="mt-2 flex items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {packageData.destination}
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {packageData.duration} days
                  </div>
                </div>
              </div>
              <button
                onClick={toggleWishlist}
                className={`rounded-xl p-2 transition ${
                  isWishlisted
                    ? 'bg-red-50 text-red-600'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <svg className="h-6 w-6" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>

            {packageData.rating > 0 && (
              <div className="mb-4 flex items-center gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`h-5 w-5 ${i < Math.floor(packageData.rating) ? 'text-amber-400' : 'text-slate-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="font-semibold text-slate-900">{packageData.rating.toFixed(1)}</span>
                <span className="text-sm text-slate-500">({packageData.reviewCount || 0} reviews)</span>
              </div>
            )}

            <div className="mb-6">
              <h2 className="font-display text-xl font-bold text-slate-900 mb-3">About this package</h2>
              <p className="text-slate-600">{packageData.description || 'No description available.'}</p>
            </div>

            {packageData.itinerary && packageData.itinerary.length > 0 && (
              <div className="mb-6">
                <h2 className="font-display text-xl font-bold text-slate-900 mb-3">Itinerary</h2>
                <div className="space-y-3">
                  {packageData.itinerary.map((item, idx) => (
                    <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-sm font-bold text-white">
                          {item.day}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{item.title}</h3>
                          <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {packageData.cancellationPolicy && packageData.cancellationPolicy.length > 0 && (
              <div className="mb-6">
                <h2 className="font-display text-xl font-bold text-slate-900 mb-3">Cancellation Policy</h2>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="space-y-2">
                    {packageData.cancellationPolicy.map((slab, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{slab.daysBefore}+ days before travel</span>
                        <span className="font-semibold text-slate-900">{slab.refundPercent}% refund</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-slate-900">Reviews</h2>
              {isAuthenticated && (
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Write Review
                </button>
              )}
            </div>
            {reviews.length === 0 ? (
              <p className="text-sm text-slate-500">No reviews yet. Be the first to review!</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review._id} className="rounded-lg border border-slate-200 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`h-4 w-4 ${i < review.rating ? 'text-amber-400' : 'text-slate-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="font-semibold text-slate-900">{review.userId?.name || 'Anonymous'}</span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comment && <p className="text-sm text-slate-600">{review.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="sticky top-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm animate-slide-in-right">
            <div className="mb-4">
              {pricing && pricing.discountAmount > 0 ? (
                <>
                  <p className="text-sm text-slate-500 line-through">₹{packageData.price?.toLocaleString()}</p>
                  <p className="text-3xl font-bold text-slate-900">₹{pricing.finalPrice?.toLocaleString()}</p>
                  <p className="text-sm font-semibold text-emerald-600">
                    Save ₹{pricing.discountAmount?.toLocaleString()} ({pricing.discountLabel || 'offer applied'})
                  </p>
                </>
              ) : (
                <p className="text-3xl font-bold text-slate-900">₹{packageData.price?.toLocaleString()}</p>
              )}
              <p className="text-sm text-slate-500">per person</p>
            </div>

            <Link
              to={`/app/booking?packageId=${id}`}
              className="block w-full rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 px-6 py-3.5 text-center text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:from-slate-800 hover:to-slate-600 hover:scale-105 hover:shadow-xl"
            >
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
              className={`block w-full rounded-xl px-6 py-3.5 text-center text-sm font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                isInCart(id)
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
              }`}
            >
              {isInCart(id) ? '✓ In Cart' : 'Add to Cart'}
            </button>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Category:</span>
                <span className="font-semibold capitalize text-slate-900">{packageData.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Duration:</span>
                <span className="font-semibold text-slate-900">{packageData.duration} days</span>
              </div>
              {packageData.agencyId?.businessName && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Agency:</span>
                  <span className="font-semibold text-slate-900">{packageData.agencyId.businessName}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)} title="Write a Review">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setReviewRating(rating)}
                  className={`rounded-lg p-2 ${
                    rating <= reviewRating ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Comment</label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-cyan-300 focus:ring-2"
              placeholder="Share your experience..."
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={submitReview}
              className="flex-1 rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:from-slate-800 hover:to-slate-600 hover:scale-105"
            >
              Submit Review
            </button>
            <button
              onClick={() => setShowReviewModal(false)}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
