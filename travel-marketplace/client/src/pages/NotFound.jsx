import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xl animate-scale-in">
      <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-pink-100">
        <svg className="h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 animate-fade-in">404</p>
      <h1 className="font-display mt-2 text-4xl font-bold text-slate-900 animate-slide-down">Page not found</h1>
      <p className="mt-3 text-base text-slate-600 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        The page you requested does not exist or you may not have access.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:from-slate-800 hover:to-slate-600 hover:scale-105 hover:shadow-xl"
        style={{ animationDelay: '0.2s' }}
      >
        Return Home
      </Link>
    </div>
  );
}
