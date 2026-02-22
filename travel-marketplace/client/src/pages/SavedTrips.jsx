import React, { useState, useEffect } from 'react';
import { loadSavedTrips, removeTrip } from '../utils/savedTrips';

export default function SavedTrips() {
  const [trips, setTrips] = useState([]);
  useEffect(() => setTrips(loadSavedTrips()), []);
  const del = (id) => {
    removeTrip(id);
    setTrips(loadSavedTrips());
  };

  if (!trips.length)
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center animate-scale-in">
        <svg className="mx-auto h-16 w-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="mt-4 text-lg font-semibold text-slate-900">No saved trips offline</p>
        <p className="mt-2 text-sm text-slate-600">Save packages to view them here when offline</p>
      </div>
    );
  return (
    <div className="mx-auto max-w-3xl p-6 animate-fade-in">
      <h2 className="font-display mb-6 text-2xl font-bold text-slate-900 animate-slide-down">Saved Trips (Offline)</h2>
      <div className="space-y-4">
        {trips.map((t, index) => (
          <div
            key={t.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-scale-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-display font-semibold text-slate-900">{t.title || 'Custom Trip'}</div>
                <div className="mt-1 text-sm text-slate-600">{t.destination}</div>
              </div>
              <div>
                <button
                  onClick={() => del(t.id)}
                  className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:from-red-700 hover:to-red-800 hover:scale-105"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
