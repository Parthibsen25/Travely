import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { useToast } from '../context/ToastContext';

export default function MyRequests() {
  const { showToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  async function load() {
    try {
      const data = await apiFetch('/api/package-requests/my');
      setRequests(data.requests || []);
    } catch {
      showToast('Failed to load your requests', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCancel(id) {
    if (!confirm('Cancel this request?')) return;
    try {
      await apiFetch(`/api/package-requests/${id}/cancel`, { method: 'POST' });
      showToast('Request cancelled', 'success');
      load();
    } catch (err) {
      showToast(err.message || 'Failed to cancel', 'error');
    }
  }

  function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const statusColors = {
    PENDING: 'bg-amber-100 text-amber-700',
    REVIEWED: 'bg-blue-100 text-blue-700',
    QUOTED: 'bg-emerald-100 text-emerald-700',
    ACCEPTED: 'bg-green-100 text-green-700',
    EXPIRED: 'bg-slate-200 text-slate-600',
    CANCELLED: 'bg-red-100 text-red-700',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">My Package Requests</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track your custom package requests and agency quotes.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
            <svg className="h-7 w-7 text-amber-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-700">No requests yet</p>
          <p className="mt-1 text-xs text-slate-500">Submit a custom package request from the home page to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req._id}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
            >
              {/* Header */}
              <button
                className="flex w-full items-center justify-between gap-3 p-5 text-left"
                onClick={() => setExpanded(expanded === req._id ? null : req._id)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {req.destination || 'Exploring destinations'}
                    </h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${statusColors[req.status] || 'bg-slate-100 text-slate-600'}`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Submitted {formatDate(req.createdAt)}
                    {req.agencyResponses?.length > 0 && (
                      <span className="ml-2 font-semibold text-emerald-600">
                        · {req.agencyResponses.length} quote{req.agencyResponses.length > 1 ? 's' : ''} received
                      </span>
                    )}
                  </p>
                </div>
                <svg
                  className={`h-5 w-5 shrink-0 text-slate-400 transition ${expanded === req._id ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {expanded === req._id && (
                <div className="border-t border-slate-100 px-5 pb-5 pt-3">
                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                    {req.departureCity && (
                      <div>
                        <span className="text-xs text-slate-400">From</span>
                        <p className="font-medium text-slate-700">{req.departureCity}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-slate-400">Dates</span>
                      <p className="font-medium capitalize text-slate-700">
                        {req.dateType === 'fixed'
                          ? `${formatDate(req.departureDate)} — ${formatDate(req.returnDate)}`
                          : req.dateType}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400">Travelers</span>
                      <p className="font-medium text-slate-700">{req.travelers}</p>
                    </div>
                    {req.budgetPerPerson > 0 && (
                      <div>
                        <span className="text-xs text-slate-400">Budget / person</span>
                        <p className="font-medium text-slate-700">₹{Number(req.budgetPerPerson).toLocaleString()}</p>
                      </div>
                    )}
                    {req.category && (
                      <div>
                        <span className="text-xs text-slate-400">Category</span>
                        <p className="font-medium capitalize text-slate-700">{req.category}</p>
                      </div>
                    )}
                  </div>

                  {req.themes?.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs text-slate-400">Themes</span>
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {req.themes.map((t) => (
                          <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold capitalize text-slate-600">
                            {t.replace('-', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {req.specialRequirements && (
                    <div className="mt-2 rounded-lg bg-slate-50 p-2.5">
                      <p className="text-xs text-slate-400">Special requirements</p>
                      <p className="mt-0.5 text-sm text-slate-600">{req.specialRequirements}</p>
                    </div>
                  )}

                  {/* Agency Quotes */}
                  {req.agencyResponses?.length > 0 && (
                    <div className="mt-4">
                      <h4 className="mb-2 text-sm font-bold text-slate-800">Agency Quotes</h4>
                      <div className="space-y-2">
                        {req.agencyResponses.map((resp, idx) => (
                          <div key={idx} className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-emerald-800">
                                  {resp.agencyId?.businessName || 'Agency'}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">{formatDate(resp.respondedAt)}</p>
                              </div>
                              {resp.quotedPrice > 0 && (
                                <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                                  ₹{Number(resp.quotedPrice).toLocaleString()}
                                </span>
                              )}
                            </div>
                            <p className="mt-2 text-sm text-slate-700">{resp.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cancel button */}
                  {!['CANCELLED', 'ACCEPTED', 'EXPIRED'].includes(req.status) && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => handleCancel(req._id)}
                        className="rounded-lg border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Cancel Request
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
