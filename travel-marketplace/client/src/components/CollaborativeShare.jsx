import React, { useState } from 'react';
import { apiFetch } from '../utils/api';

export default function CollaborativeShare({ trip, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [removeId, setRemoveId] = useState(null);

  const isShared = trip?.isShared;
  const shareToken = trip?.shareToken;
  const collaborators = trip?.collaborators || [];
  const shareUrl = shareToken ? `${window.location.origin}/app/shared-trip/${shareToken}` : '';

  async function enableSharing() {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/custom-trips/${trip._id}/share`, { method: 'POST' });
      onUpdate?.(data.trip);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function disableSharing() {
    if (!window.confirm('Disable sharing? All collaborators will lose access.')) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/api/custom-trips/${trip._id}/share`, { method: 'DELETE' });
      onUpdate?.(data.trip);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function removeCollaborator(collabId) {
    setRemoveId(collabId);
    try {
      const data = await apiFetch(`/api/custom-trips/${trip._id}/collaborators/${collabId}`, { method: 'DELETE' });
      onUpdate?.(data.trip);
    } catch (err) {
      console.error(err);
    } finally {
      setRemoveId(null);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white shadow-card overflow-hidden">
      <div className="border-b border-slate-100 bg-gradient-to-r from-cyan-50 to-blue-50 px-5 py-4">
        <h3 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
          🤝 Collaborative Planning
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">Share this trip and plan together in real-time</p>
      </div>
      <div className="p-5 space-y-4">
        {!isShared ? (
          <div className="text-center py-4">
            <span className="text-4xl block mb-3">🔗</span>
            <p className="text-sm text-slate-600 mb-4">Enable sharing to get a link that anyone can use to view and collaborate on this trip.</p>
            <button onClick={enableSharing} disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow transition hover:shadow-lg disabled:opacity-50">
              {loading ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
              ) : '🔓'}
              Enable Sharing
            </button>
          </div>
        ) : (
          <>
            {/* Share Link */}
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-xs text-slate-400 font-medium mb-0.5">Share Link</p>
                <p className="text-sm text-slate-700 font-mono truncate">{shareUrl}</p>
              </div>
              <button onClick={copyLink}
                className={`shrink-0 rounded-xl px-4 py-4 text-sm font-bold transition shadow-sm ${
                  copied ? 'bg-emerald-100 text-emerald-700' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}>
                {copied ? '✓' : '📋'}
              </button>
            </div>

            {/* Collaborators */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Collaborators ({collaborators.length})
              </h4>
              {collaborators.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No one has joined yet. Share the link above!</p>
              ) : (
                <div className="space-y-2">
                  {collaborators.map((c) => (
                    <div key={c._id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 text-xs font-bold text-white shadow">
                        {(c.name || c.email || '?').charAt(0).toUpperCase()}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{c.name || 'Anonymous'}</p>
                        <p className="text-xs text-slate-400 truncate">{c.email || ''}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        c.role === 'editor' ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {c.role}
                      </span>
                      <button onClick={() => removeCollaborator(c._id)}
                        disabled={removeId === c._id}
                        className="text-slate-300 hover:text-rose-500 transition disabled:opacity-50"
                        title="Remove collaborator">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Disable sharing */}
            <button onClick={disableSharing} disabled={loading}
              className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50">
              🔒 Disable Sharing
            </button>
          </>
        )}
      </div>
    </div>
  );
}
