import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../utils/api';

export default function AdminAgencies() {
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function fetchAgencies() {
    setLoading(true);
    setError('');

    try {
      const data = await apiFetch('/api/admin/agencies');
      setAgencies(data.agencies || []);
    } catch (err) {
      setError(err.message || 'Failed to load agencies');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAgencies();
  }, []);

  async function verify(id, action) {
    try {
      await apiFetch(`/api/admin/agencies/${id}/verify`, {
        method: 'POST',
        body: JSON.stringify({ action })
      });
      await fetchAgencies();
    } catch (err) {
      window.alert(err.message || 'Action failed');
    }
  }

  async function toggleSuspend(id, suspend) {
    try {
      await apiFetch(`/api/admin/agencies/${id}/suspend`, {
        method: 'POST',
        body: JSON.stringify({ suspend })
      });
      await fetchAgencies();
    } catch (err) {
      window.alert(err.message || 'Action failed');
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="animate-slide-down">
        <h1 className="font-display text-3xl font-bold text-slate-900">Agency Management</h1>
        <p className="mt-1 text-sm text-slate-600">Approve, reject, or suspend agencies from a single queue.</p>
      </header>

      {loading ? (
        <p className="text-sm text-slate-500">Loading agencies...</p>
      ) : error ? (
        <p className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p>
      ) : agencies.length === 0 ? (
        <p className="rounded-xl bg-slate-100 p-4 text-sm text-slate-600">No agencies found.</p>
      ) : (
        <div className="space-y-3">
          {agencies.map((agency, index) => (
            <article
              key={agency._id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-900">{agency.businessName}</h2>
                  <p className="text-sm text-slate-600">{agency.email}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">Status: {agency.verificationStatus}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {agency.verificationStatus === 'PENDING' && (
                    <>
                      <button
                        type="button"
                        onClick={() => verify(agency._id, 'approve')}
                        className="rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 px-3 py-2 text-xs font-semibold text-white shadow-md transition-all duration-300 hover:from-emerald-700 hover:to-emerald-800 hover:scale-105"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => verify(agency._id, 'reject')}
                        className="rounded-lg bg-gradient-to-r from-rose-600 to-rose-700 px-3 py-2 text-xs font-semibold text-white shadow-md transition-all duration-300 hover:from-rose-700 hover:to-rose-800 hover:scale-105"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleSuspend(agency._id, !agency.isSuspended)}
                    className="rounded-lg bg-gradient-to-r from-slate-900 to-slate-700 px-3 py-2 text-xs font-semibold text-white shadow-md transition-all duration-300 hover:from-slate-800 hover:to-slate-600 hover:scale-105"
                  >
                    {agency.isSuspended ? 'Unsuspend' : 'Suspend'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
