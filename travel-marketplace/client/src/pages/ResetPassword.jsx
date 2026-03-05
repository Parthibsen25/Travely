import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../utils/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    setError('');

    try {
      await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password, confirmPassword })
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 animate-page-enter">
        <div className="mx-auto max-w-md rounded-2xl border border-red-200/80 bg-red-50 p-8 text-center shadow-card">
          <p className="font-semibold text-red-700">Invalid reset link. Please request a new one.</p>
          <Link to="/forgot-password" className="mt-4 inline-block text-sm font-semibold text-cyan-600 hover:text-cyan-700">
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 animate-page-enter">
        <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-glass text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
            <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h2 className="font-display text-xl font-bold text-slate-900">Password Reset!</h2>
          <p className="mt-2 text-sm text-slate-500">Your password has been reset successfully.</p>
          <Link to="/login" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 animate-page-enter">
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-glass">
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-8 py-6">
          <h1 className="font-display text-2xl font-bold text-white">Set New Password</h1>
          <p className="mt-1 text-sm text-cyan-100/90">Enter your new password below</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">New Password</label>
              <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="focus-ring w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition-colors focus:bg-white" placeholder="Min 6 characters" />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Confirm Password</label>
              <input id="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="focus-ring w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition-colors focus:bg-white" placeholder="Re-enter password" />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 animate-scale-in">
                <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:from-cyan-700 hover:to-blue-700 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Resetting...
                </span>
              ) : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
