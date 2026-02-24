import React from 'react';

export default function Loading({ fullPage = false, text = 'Loading...' }) {
  const content = (
    <div className="flex flex-col items-center gap-5">
      <div className="relative h-14 w-14">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-[3px] border-slate-100" />
        {/* Spinning gradient ring */}
        <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-cyan-500 border-r-blue-500" style={{ animationDuration: '0.8s' }} />
        {/* Inner pulsing dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-3 w-3 animate-pulse rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 shadow-glow-cyan" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400" style={{ animationDelay: '0ms' }} />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400" style={{ animationDelay: '150ms' }} />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-400" style={{ animationDelay: '300ms' }} />
        <span className="ml-2 text-sm font-medium text-slate-500">{text}</span>
      </div>
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center animate-fade-in">
        {content}
      </div>
    );
  }

  return (
    <div className="grid min-h-[200px] place-items-center rounded-2xl border border-slate-100 bg-white/80 p-8 backdrop-blur-sm animate-fade-in">
      {content}
    </div>
  );
}
