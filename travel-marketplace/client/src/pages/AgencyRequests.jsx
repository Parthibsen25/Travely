import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { useToast } from '../context/ToastContext';
import Loading from '../components/Loading';

export default function AgencyRequests() {
  const { showToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseForm, setResponseForm] = useState({ message: '', quotedPrice: '' });
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      const data = await apiFetch('/api/package-requests/all');
      setRequests(data.requests || []);
    } catch {
      showToast('Failed to load requests', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleRespond(requestId) {
    if (!responseForm.message.trim()) {
      showToast('Please enter a message', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch(`/api/package-requests/${requestId}/respond`, {
        method: 'POST',
        body: JSON.stringify({
          message: responseForm.message,
          quotedPrice: responseForm.quotedPrice ? Number(responseForm.quotedPrice) : undefined,
        }),
      });
      showToast('Response sent to traveler!', 'success');
      setRespondingTo(null);
      setResponseForm({ message: '', quotedPrice: '' });
      load();
    } catch (err) {
      showToast(err.message || 'Failed to send response', 'error');
    } finally {
      setSubmitting(false);
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

  if (loading) return <Loading fullPage />;

  return (
    <div className="mx-auto max-w-5xl animate-page-enter">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">Custom Package Requests</h1>
        <p className="mt-1 text-sm text-slate-500">
          Travelers are looking for custom packages. Send them a quote to win their booking!
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
            <svg className="h-7 w-7 text-amber-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-700">No active requests</p>
          <p className="mt-1 text-xs text-slate-500">When travelers submit custom package requests, they'll appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const myResponse = req.agencyResponses?.find(
              (r) => r.agencyId?._id === req._currentAgencyId || r.agencyId?.businessName
            );
            const hasResponded = req.agencyResponses?.length > 0;

            return (
              <div
                key={req._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:shadow-md"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">
                        {req.destination || 'Exploring destinations'}
                      </h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${statusColors[req.status] || 'bg-slate-100 text-slate-600'}`}>
                        {req.status}
                      </span>
                      {req.agencyResponses?.length > 0 && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                          {req.agencyResponses.length} quote{req.agencyResponses.length > 1 ? 's' : ''} sent
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      By {req.userId?.name || req.userId?.email || 'Traveler'} · {formatDate(req.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Details grid */}
                <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
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
                  {req.themes?.length > 0 && (
                    <div className="col-span-2">
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
                </div>

                {req.specialRequirements && (
                  <div className="mt-2 rounded-lg bg-slate-50 p-2.5">
                    <p className="text-xs text-slate-400">Special requirements</p>
                    <p className="mt-0.5 text-sm text-slate-600">{req.specialRequirements}</p>
                  </div>
                )}

                {/* Respond button / form */}
                <div className="mt-4">
                  {respondingTo === req._id ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <h4 className="text-sm font-bold text-slate-800">Send Your Quote</h4>
                      <div className="mt-3 space-y-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">Quoted Price (₹)</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="e.g. 25000"
                            value={responseForm.quotedPrice}
                            onChange={(e) => setResponseForm({ ...responseForm, quotedPrice: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">Message to Traveler *</label>
                          <textarea
                            rows={3}
                            placeholder="Describe your proposed package, inclusions, and why they should choose you..."
                            value={responseForm.message}
                            onChange={(e) => setResponseForm({ ...responseForm, message: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none resize-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRespond(req._id)}
                            disabled={submitting}
                            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
                          >
                            {submitting ? 'Sending...' : 'Send Quote'}
                          </button>
                          <button
                            onClick={() => { setRespondingTo(null); setResponseForm({ message: '', quotedPrice: '' }); }}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRespondingTo(req._id)}
                      className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600"
                    >
                      Send Quote
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
