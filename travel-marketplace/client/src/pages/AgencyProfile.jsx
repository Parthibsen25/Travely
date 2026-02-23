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
  return 'A';
}

export default function AgencyProfile() {
  const { user, refreshSession, logout } = useContext(AuthContext);
  const { showToast } = useToast();
  const [businessName, setBusinessName] = useState('');
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
    async function loadStats() {
      try {
        const data = await apiFetch('/api/bookings/agency').catch(() => ({ bookings: [] }));
        if (!ignore) setBookings(data.bookings || []);
      } finally {
        if (!ignore) setLoadingBookings(false);
      }
    }
    loadStats();
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
    setBusinessName(user?.businessName || user?.name || '');
    setEmail(user?.email || '');
  }, [user]);

  const initials = useMemo(() => getInitials(businessName, email), [businessName, email]);
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : null;

  const verificationBadge = (() => {
    const status = user?.verificationStatus;
    if (status === 'VERIFIED') return { label: 'Verified', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    if (status === 'REJECTED') return { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200' };
    return { label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200' };
  })();

  async function handleSave(event) {
    event.preventDefault();
    if (!businessName.trim()) {
      showToast('Business name is required', 'warning');
      return;
    }

    setSaving(true);
    try {
      await apiFetch('/api/auth/me', {
        method: 'PUT',
        body: JSON.stringify({ name: businessName.trim(), email: email.trim() })
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
    setBusinessName(user?.businessName || user?.name || '');
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

  function closePasswordModal() {
    if (changingPassword) return;
    setShowPasswordModal(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 animate-fade-in">
      {/* Header */}
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xl font-bold text-white">
            {initials}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-slate-900">Agency Profile</h1>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${verificationBadge.color}`}>
                {verificationBadge.label}
              </span>
            </div>
            <p className="text-sm text-slate-600">Manage your agency account</p>
            {memberSince && (
              <p className="mt-1 text-xs text-slate-500">Member since {memberSince}</p>
            )}
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm text-center">
          <p className="text-sm font-medium text-slate-500">Total Bookings</p>
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

      {/* Profile Details */}
      <form onSubmit={handleSave} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Agency Details</h2>
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Business Name</label>
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              disabled={!isEditing}
              className={`w-full rounded-lg border px-3 py-2 text-sm ${
                isEditing ? 'border-slate-300' : 'border-slate-200 bg-slate-50 text-slate-500'
              }`}
              placeholder="Your business name"
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
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Role</label>
            <input
              value="AGENCY"
              disabled
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Commission Tier</label>
            <input
              value={user?.commissionTier || 'STANDARD'}
              disabled
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
          </div>
        </div>

        {isEditing && (
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
        )}
      </form>

      {/* Security */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Security</h2>
        <p className="mt-1 text-sm text-slate-600">Change your account password.</p>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Change Password
          </button>
        </div>
      </div>

      {/* Logout */}
      <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Account</h2>
        <p className="mt-1 text-sm text-slate-600">Sign out of your account on this device.</p>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-100"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Logout
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
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
