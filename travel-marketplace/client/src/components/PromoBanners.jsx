import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch, mediaUrl } from '../utils/api';

export default function PromoBanners() {
  const [banners, setBanners] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch('/api/banners/active');
        setBanners(data.banners || []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const total = banners.length;
  const goTo = useCallback((idx) => setCurrent((idx + total) % total), [total]);

  // Auto-slide
  useEffect(() => {
    if (total <= 1) return;
    timerRef.current = setInterval(() => setCurrent((prev) => (prev + 1) % total), 5000);
    return () => clearInterval(timerRef.current);
  }, [total]);

  const pause = () => clearInterval(timerRef.current);
  const resume = () => {
    if (total <= 1) return;
    timerRef.current = setInterval(() => setCurrent((prev) => (prev + 1) % total), 5000);
  };

  if (loading) {
    return (
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-48 animate-pulse rounded-2xl bg-slate-200 sm:h-64" />
        </div>
      </section>
    );
  }

  if (!total) return null;

  // Single banner — full width
  if (total === 1) {
    const banner = banners[0];
    return (
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <BannerSlide banner={banner} />
        </div>
      </section>
    );
  }

  // Multiple — carousel
  return (
    <section className="py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Grid layout: show 1 or 2 banners at a time */}
        <div
          className="relative"
          onMouseEnter={pause}
          onMouseLeave={resume}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Primary banner */}
            <BannerSlide banner={banners[current]} />
            {/* Secondary banner (next one) */}
            {total > 1 && <BannerSlide banner={banners[(current + 1) % total]} />}
          </div>

          {/* Dot indicators */}
          {total > 2 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              {Array.from({ length: Math.ceil(total / 2) }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i * 2)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    Math.floor(current / 2) === i
                      ? 'w-6 bg-emerald-600'
                      : 'w-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Navigation arrows */}
          {total > 2 && (
            <>
              <button
                onClick={() => goTo(current - 2)}
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow-lg text-slate-700 transition hover:bg-white"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                onClick={() => goTo(current + 2)}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow-lg text-slate-700 transition hover:bg-white"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─── Individual Banner Slide ─────────────── */
function BannerSlide({ banner }) {
  const Wrapper = banner.linkUrl ? 'a' : 'div';
  const wrapperProps = banner.linkUrl
    ? { href: banner.linkUrl, target: '_blank', rel: 'noopener noreferrer' }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="group relative block overflow-hidden rounded-2xl shadow-sm transition-all duration-300 hover:shadow-lg"
    >
      <div className="relative h-48 overflow-hidden sm:h-56">
        <img
          src={mediaUrl(banner.imageUrl)}
          alt={banner.title || 'Promotion'}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: banner.gradient || 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, transparent 60%)',
          }}
        />

        {/* Text overlay */}
        {(banner.title || banner.subtitle) && (
          <div className="absolute bottom-0 left-0 right-0 p-5">
            {banner.subtitle && (
              <p className="text-xs font-medium uppercase tracking-wider text-white/80">
                {banner.subtitle}
              </p>
            )}
            {banner.title && (
              <h3 className="mt-1 font-display text-lg font-bold text-white sm:text-xl">
                {banner.title}
              </h3>
            )}
          </div>
        )}
      </div>
    </Wrapper>
  );
}
