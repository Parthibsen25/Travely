import React from 'react';
import { Link } from 'react-router-dom';

export default function AppLogo({ to = '/', compact = false }) {
  return (
    <Link to={to} className="inline-flex items-center gap-3 transition-all duration-300 hover:scale-105">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-cyan-200 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-300">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 16c0-4 3-7 7-7h5" />
          <path d="M15 6h2a2 2 0 0 1 2 2v2" />
          <path d="M7 18h10a2 2 0 0 0 2-2v-2" />
          <path d="M10 13l2 2 4-4" />
        </svg>
      </span>
      <div className={compact ? 'hidden sm:block' : ''}>
        <p className="font-display text-2xl font-bold tracking-tight text-slate-900">Travely</p>
        <p className="-mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">Travel Marketplace</p>
      </div>
    </Link>
  );
}
