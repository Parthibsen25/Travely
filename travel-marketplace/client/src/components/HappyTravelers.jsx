import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, mediaUrl } from '../utils/api';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return '1 month ago';
  return `${months} months ago`;
}

function generateTags(destination, packageTitle) {
  const tags = [];
  if (destination) tags.push(`#${destination.toLowerCase().replace(/\s+/g, '')}`);
  const words = (packageTitle || '').split(/\s+/).filter((w) => w.length > 3);
  words.slice(0, 2).forEach((w) => tags.push(`#${w.toLowerCase()}`));
  if (tags.length < 3) tags.push('#travel');
  if (tags.length < 4) tags.push('#holiday');
  return tags.slice(0, 4);
}

function getInitials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'T';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const FALLBACK_STORIES = [
  {
    _id: 'demo1',
    userName: 'Ananya',
    destination: 'Manali',
    packageTitle: 'Snowy Manali Adventure',
    comment:
      'The trip was absolutely magical! From snow-capped mountains to cozy bonfires, every moment was well-planned. The hotel stay and local sightseeing were top-notch. Would definitely book again!',
    rating: 5,
    images: [],
    packageImage: null,
    packageId: null,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    _id: 'demo2',
    userName: 'Rahul',
    destination: 'Goa',
    packageTitle: 'Beach Bliss Goa',
    comment:
      'Had the best time at the beaches and the nightlife was amazing. Great value for money, the agency handled everything seamlessly. Sunsets at Palolem were unforgettable!',
    rating: 4,
    images: [],
    packageImage: null,
    packageId: null,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    _id: 'demo3',
    userName: 'Priya',
    destination: 'Kerala',
    packageTitle: 'Kerala Backwaters Escape',
    comment:
      'The houseboat experience on the backwaters was pure bliss. Loved the authentic Kerala cuisine and Ayurvedic spa. A perfect getaway from the city chaos. Highly recommend!',
    rating: 5,
    images: [],
    packageImage: null,
    packageId: null,
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    _id: 'demo4',
    userName: 'Vikram',
    destination: 'Rajasthan',
    packageTitle: 'Royal Rajasthan Tour',
    comment:
      'Exploring forts and palaces was a dream come true. The desert safari at Jaisalmer was the highlight. Amazing cultural immersion and warm hospitality everywhere we went.',
    rating: 5,
    images: [],
    packageImage: null,
    packageId: null,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

export default function HappyTravelers() {
  const [stories, setStories] = useState([]);
  const [selected, setSelected] = useState(0);
  const [imgIndex, setImgIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const imgScrollRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch('/api/reviews/featured');
        const fetched = data.stories || [];
        setStories(fetched.length > 0 ? fetched : FALLBACK_STORIES);
      } catch {
        setStories(FALLBACK_STORIES);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Reset image index when story changes
  useEffect(() => {
    setImgIndex(0);
  }, [selected]);

  if (loading) return null;

  const story = stories[selected];
  const allImages = [];
  // Use review images first, then fallback to package image
  if (story.images?.length) {
    story.images.forEach((img) => allImages.push(img));
  }
  if (story.packageImage) allImages.push(story.packageImage);
  if (allImages.length === 0) allImages.push(null); // placeholder

  const tags = generateTags(story.destination, story.packageTitle);
  const chipLabel = `${story.userName}'s ${story.destination || 'Trip'}`;

  function scrollImages(dir) {
    const next = dir === 'next'
      ? Math.min(imgIndex + 1, allImages.length - 1)
      : Math.max(imgIndex - 1, 0);
    setImgIndex(next);
  }

  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl">
            Happy Travelers
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-slate-500">
            Real travelers. Real stories. Real opinions to help you make the right choice.
          </p>
        </div>

        {/* Story Chips */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {stories.map((s, i) => {
            const label = `${s.userName}'s ${s.destination || 'Trip'}`;
            return (
              <button
                key={s._id}
                onClick={() => setSelected(i)}
                className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
                  i === selected
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-200'
                    : 'border border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="mt-10 grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_420px]">
          {/* Left — Images */}
          <div className="relative">
            <div className="relative flex gap-4 overflow-hidden rounded-2xl">
              {allImages.map((img, i) => (
                <div
                  key={i}
                  className="min-w-full transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${imgIndex * 100}%)` }}
                >
                  {img ? (
                    <img
                      src={mediaUrl(img)}
                      alt={`${story.userName} travel photo ${i + 1}`}
                      className="h-[400px] w-full rounded-2xl object-cover sm:h-[480px]"
                    />
                  ) : (
                    <div className="flex h-[400px] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50 sm:h-[480px]">
                      <svg className="h-16 w-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Image nav arrows */}
            {allImages.length > 1 && (
              <>
                {imgIndex > 0 && (
                  <button
                    onClick={() => scrollImages('prev')}
                    className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-slate-600 shadow-lg backdrop-blur-sm transition hover:bg-white"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                )}
                {imgIndex < allImages.length - 1 && (
                  <button
                    onClick={() => scrollImages('next')}
                    className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-slate-600 shadow-lg backdrop-blur-sm transition hover:bg-white"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                )}
              </>
            )}

            {/* Dots */}
            {allImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
                {allImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIndex(i)}
                    className={`h-2 rounded-full transition-all ${i === imgIndex ? 'w-6 bg-white' : 'w-2 bg-white/60'}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right — Story Details */}
          <div className="flex flex-col">
            {/* Title */}
            <h3 className="font-display text-2xl font-bold text-teal-700 sm:text-3xl">
              {chipLabel}
            </h3>

            {/* Tags */}
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  {tag}
                </span>
              ))}
            </div>

            {/* Comment */}
            <p className="mt-5 text-base leading-relaxed text-slate-600">
              {story.comment}
            </p>

            {/* User + Rating */}
            <div className="mt-6 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-sm font-bold text-white shadow-md">
                  {getInitials(story.userName)}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{story.userName}</p>
                  <p className="text-xs text-slate-400">{timeAgo(story.createdAt)}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`h-4 w-4 ${star <= story.rating ? 'text-amber-400' : 'text-slate-200'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                {story.destination && (
                  <p className="mt-0.5 text-xs font-medium text-slate-500">Trip to {story.destination}</p>
                )}
              </div>
            </div>

            {/* CTA Button */}
            {story.packageId && (
              <Link
                to={`/app/packages/${story.packageId}`}
                className="mt-5 block w-full rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-rose-200 transition-all duration-300 hover:shadow-xl hover:shadow-rose-300 hover:from-rose-600 hover:to-rose-700"
              >
                Get Quotes For This Package
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
