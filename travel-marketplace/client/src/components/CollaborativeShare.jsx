import React, { useState } from 'react';
import { apiFetch } from '../utils/api';
import { useToast } from '../context/ToastContext';

export default function CollaborativeShare({ trip, onUpdate }) {
  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [removeId, setRemoveId] = useState(null);
  const { showToast } = useToast();

  const collaborators = trip?.collaborators || [];

  async function handleInvite(e) {
    e.preventDefault();
    if (!email.trim()) {
      showToast('Enter an email address', 'warning');
      return;
    }
    setInviting(true);
    try {
      const data = await apiFetch(`/api/custom-trips/${trip._id}/invite`, {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() })
      });
      onUpdate?.(data.trip);
      showToast(data.message || 'Collaborator invited!', 'success');
      setEmail('');
    } catch (err) {
      showToast(err.message || 'Failed to invite', 'error');
    } finally {
      setInviting(false);
    }
  }

  async function removeCollaborator(collabId, name) {
    if (!window.confirm(`Remove ${name || 'this collaborator'} from the trip?`)) return;
    setRemoveId(collabId);
    try {
      const data = await apiFetch(`/api/custom-trips/${trip._id}/collaborators/${collabId}`, { method: 'DELETE' });
      onUpdate?.(data.trip);
      showToast('Collaborator removed', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to remove', 'error');
    } finally {
      setRemoveId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white shadow-card overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-100 bg-gradient-to-r from-cyan-50 to-blue-50 px-5 py-4">
        <h3 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
          🤝 Collaborate on This Trip
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Invite people by email — they can add expenses, update the checklist, and more
        </p>
      </div>

      <div className="p-5 space-y-5">
        {/* ─── Invite Form ─── */}
        <form onSubmit={handleInvite} className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            Invite by Email
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="friend@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition"
                disabled={inviting}
              />
            </div>
            <button
              type="submit"
              disabled={inviting || !email.trim()}
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow transition hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {inviting ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              )}
              Invite
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            The person must have a Travely account. They'll get a notification and the trip will appear in their trip list.
          </p>
        </form>

        {/* ─── Collaborator List ─── */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Team Members ({collaborators.length})
          </h4>

          {collaborators.length === 0 ? (
            <div className="text-center py-6 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50">
              <span className="text-3xl block mb-2">👥</span>
              <p className="text-sm text-slate-400">No collaborators yet</p>
              <p className="text-xs text-slate-300 mt-1">Invite someone above to start planning together</p>
            </div>
          ) : (
            <div className="space-y-2">
              {collaborators.map((c) => {
                const displayName = typeof c.userId === 'object' && c.userId?.name
                  ? c.userId.name
                  : c.name || 'Unknown';
                const displayEmail = typeof c.userId === 'object' && c.userId?.email
                  ? c.userId.email
                  : c.email || '';
                const initial = displayName.charAt(0).toUpperCase();

                return (
                  <div key={c._id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 group hover:border-slate-200 transition">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 text-xs font-bold text-white shadow-sm">
                      {initial}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{displayName}</p>
                      <p className="text-xs text-slate-400 truncate">{displayEmail}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      c.role === 'editor'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {c.role === 'editor' ? '✏️ Editor' : '👁 Viewer'}
                    </span>
                    <button
                      onClick={() => removeCollaborator(c._id, displayName)}
                      disabled={removeId === c._id}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition disabled:opacity-50"
                      title="Remove collaborator"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Info Box ─── */}
        <div className="rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 p-4">
          <h5 className="text-xs font-bold text-blue-800 flex items-center gap-1.5 mb-2">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How collaboration works
          </h5>
          <ul className="text-[11px] text-blue-700/80 space-y-1.5">
            <li className="flex items-start gap-1.5">
              <span className="mt-0.5">•</span>
              <span>Invited editors can add/edit expenses, update the checklist, and view split bills</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="mt-0.5">•</span>
              <span>The trip appears automatically in their "My Trips" list</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="mt-0.5">•</span>
              <span>Only you (the owner) can edit the trip title, budget, and trip details</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="mt-0.5">•</span>
              <span>You can remove a collaborator at any time</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
