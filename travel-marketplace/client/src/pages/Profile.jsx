import React, { useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import Loading from '../components/Loading';

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
  const [isEditing, setIsEditing] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function loadBookings() {
      try {
        const data = await apiFetch('/api/bookings/my').catch(() => ({ bookings: [] }));
        if (!ignore) setBookings(data.bookings || []);
      } finally {
        if (!ignore) setLoadingBookings(false);
      }
    }
    loadBookings();
    return () => { ignore = true; };
  }, []);

  const stats = useMemo(() => {
    const total = bookings.length;
    const confirmed = bookings.filter((b) => b.status === 'CONFIRMED').length;
    const pending = bookings.filter((b) => b.status === 'PENDING_PAYMENT').length;
    const cancelled = bookings.filter((b) => b.status === 'CANCELLED').length;
    return { total, confirmed, pending, cancelled };
  }, [bookings]);

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
  }, [user]);

  const initials = useMemo(() => getInitials(name, email), [name, email]);
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : null;

  async function handleSave(event) {
    event.preventDefault();
    if (!name.trim()) {
      showToast('Name is required', 'warning');
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
      setIsEditing(false);
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    setName(user?.name || '');
    setIsEditing(false);
  }

  async function handleChangePassword(event) {
    event.preventDefault();

    if (!oldPassword || !newPassword || !confirmPassword) {
      showToast('Please fill all password fields', 'warning');
      return;
    }

    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New password and confirm password do not match', 'warning');
      return;
    }

    setChangingPassword(true);
    try {
      await apiFetch('/api/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ oldPassword, newPassword, confirmPassword })
      });
      showToast('Password changed successfully', 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordModal(false);
    } catch (err) {
      showToast(err.message || 'Failed to change password', 'error');
    } finally {
      setChangingPassword(false);
    }
  }

  function openPasswordModal() {
    setShowPasswordModal(true);
  }

  function closePasswordModal() {
    if (changingPassword) return;
    setShowPasswordModal(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
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

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm text-center">
          <p className="text-sm font-medium text-slate-500">Total Trips</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{loadingBookings ? '...' : stats.total}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm text-center">
          <p className="text-sm font-medium text-emerald-600">Confirmed</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{loadingBookings ? '...' : stats.confirmed}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm text-center">
          <p className="text-sm font-medium text-amber-600">Pending</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{loadingBookings ? '...' : stats.pending}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm text-center">
          <p className="text-sm font-medium text-slate-500">Cancelled</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{loadingBookings ? '...' : stats.cancelled}</p>
        </div>
      </section>

      <form onSubmit={handleSave} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Profile Details</h2>
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Edit
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isEditing}
              className={`w-full rounded-lg border px-3 py-2 text-sm ${
                isEditing ? 'border-slate-300' : 'border-slate-200 bg-slate-50 text-slate-500'
              }`}
              placeholder="Your full name"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
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

        {isEditing ? (
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        ) : null}
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Security</h2>
        <p className="mt-1 text-sm text-slate-600">Change your account password.</p>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={openPasswordModal}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Change Password
          </button>
        </div>
      </div>

      <Modal isOpen={showPasswordModal} onClose={closePasswordModal} title="Change Password" size="sm">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Old Password</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={closePasswordModal}
              disabled={changingPassword}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={changingPassword}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
            >
              {changingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
