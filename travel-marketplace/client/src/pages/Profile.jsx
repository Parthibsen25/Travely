import React, { useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { useToast } from '../context/ToastContext';

function getInitials(name, email) {
  const base = (name || '').trim();
  if (base) {
    const parts = base.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return 'U';
}

export default function Profile() {
  const { user, refreshSession } = useContext(AuthContext);
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
  }, [user]);

  const initials = useMemo(() => getInitials(name, email), [name, email]);
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : null;

  async function handleSave(event) {
    event.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast('Name and email are required', 'warning');
      return;
    }

    setSaving(true);
    try {
      await apiFetch('/api/auth/me', {
        method: 'PUT',
        body: JSON.stringify({ name: name.trim(), email: email.trim() })
      });
      showToast('Profile updated', 'success');
      await refreshSession();
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-xl font-bold text-white">
            {initials}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">Profile</h1>
            <p className="text-sm text-slate-600">Manage your account details</p>
            {memberSince && (
              <p className="mt-1 text-xs text-slate-500">Member since {memberSince}</p>
            )}
          </div>
        </div>
      </header>

      <form onSubmit={handleSave} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Your full name"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Role</label>
            <input
              value={user?.role || 'USER'}
              disabled
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
