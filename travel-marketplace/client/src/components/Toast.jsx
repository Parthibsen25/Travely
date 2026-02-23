import React, { useEffect } from 'react';

export default function Toast({ message, type = 'info', onClose, duration = 3000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const bgColors = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500'
  };

  return (
    <div className="animate-slide-up">
      <div className={`${bgColors[type]} rounded-xl px-6 py-4 text-white shadow-lg`}>
        <div className="flex items-center gap-3">
          <p className="font-semibold">{message}</p>
          <button onClick={onClose} className="ml-2 rounded-lg p-1 text-white/80 transition-all duration-300 hover:bg-white/20 hover:text-white hover:scale-110 hover:rotate-90">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
