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
    <div className="mx-auto grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl md:grid-cols-2 animate-scale-in">
      <section className="bg-gradient-to-br from-cyan-600 to-blue-700 p-8 text-white animate-slide-in-left">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">Welcome Back</p>
        <h1 className="font-display mt-3 text-3xl font-bold">Sign in to your traveler account</h1>
        <p className="mt-4 text-sm text-cyan-50">Manage bookings, track trip progress, and access saved plans.</p>
        <ul className="mt-8 space-y-2 text-sm text-cyan-50">
          <li>- Secure session-based login</li>
          <li>- Real-time booking status updates</li>
          <li>- Fast trip cancellation and support</li>
        </ul>
      </section>

      <section className="p-8 sm:p-10 animate-slide-in-right">
        <h2 className="font-display text-2xl font-bold text-slate-900">User Login</h2>
        <p className="mt-1 text-sm text-slate-500">Admin? Use the dedicated admin login.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-cyan-300 transition-all duration-300 focus:ring-2 focus:scale-[1.02] focus:border-cyan-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-cyan-300 transition-all duration-300 focus:ring-2 focus:scale-[1.02] focus:border-cyan-500"
              placeholder="Enter password"
            />
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 animate-slide-down">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:from-slate-800 hover:to-slate-600 hover:scale-105 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link to="/register" className="font-semibold text-cyan-700">
            Create user account
          </Link>
          <Link to="/admin/login" className="font-semibold text-slate-600">
            Admin login
          </Link>
        </div>
      </section>
    </div>
  );
}
