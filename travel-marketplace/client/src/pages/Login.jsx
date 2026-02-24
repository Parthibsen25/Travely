import React, { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

function routeForRole(role) {
  if (role === 'ADMIN') return '/admin';
  if (role === 'AGENCY') return '/agency/dashboard';
  return '/app';
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      login(data.user);

      const fallback = routeForRole(data.user?.role);
      navigate(location.state?.from || fallback, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 animate-page-enter">
      <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-glass md:grid md:grid-cols-5">
        <section className="relative overflow-hidden bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 p-8 md:col-span-2 md:p-10">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/5" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-cyan-100 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Secure login
            </div>
            <h1 className="font-display mt-5 text-3xl font-bold text-white">Welcome back</h1>
            <p className="mt-3 text-sm leading-relaxed text-cyan-100/90">Sign in to manage your bookings, track trips, and access your saved plans.</p>
            <div className="mt-8 space-y-3">
              {['Real-time booking updates', 'Secure session-based auth', 'Trip planning tools'].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm text-cyan-50/90">
                  <svg className="h-4 w-4 flex-shrink-0 text-emerald-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="p-8 md:col-span-3 md:p-10">
          <h2 className="font-display text-2xl font-bold text-slate-900">User Login</h2>
          <p className="mt-1 text-sm text-slate-500">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="focus-ring w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition-colors focus:bg-white"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="focus-ring w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition-colors focus:bg-white"
                placeholder="Enter password"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 animate-scale-in">
                <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:from-cyan-700 hover:to-blue-700 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
            <Link to="/register" className="font-semibold text-cyan-600 transition hover:text-cyan-700">
              Create account
            </Link>
            <span className="text-slate-300">|</span>
            <Link to="/agency/login" className="font-semibold text-amber-600 transition hover:text-amber-700">
              Agency login
            </Link>
            <span className="text-slate-300">|</span>
            <Link to="/admin/login" className="font-semibold text-slate-500 transition hover:text-slate-700">
              Admin login
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
