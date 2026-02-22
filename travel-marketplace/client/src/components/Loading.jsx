import React from 'react';

export default function Loading() {
  return (
    <div className="grid min-h-[180px] place-items-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-fade-in">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 animate-spin-slow rounded-full border-4 border-slate-200 border-t-cyan-500"></div>
          <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-4 border-transparent border-r-blue-500" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-500"></span>
          <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" style={{ animationDelay: '0.2s' }}></span>
          <span className="h-2 w-2 animate-pulse rounded-full bg-purple-500" style={{ animationDelay: '0.4s' }}></span>
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    </div>
  );
}
