import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (data.user?.role !== 'ADMIN') {
        await apiFetch('/api/auth/logout', { method: 'POST' });
        setError('This account does not have admin access.');
        return;
      }

      login(data.user);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-xl animate-scale-in">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Admin Portal</p>
      <h1 className="font-display mt-2 text-3xl font-bold text-slate-900">Administrator Sign In</h1>
      <p className="mt-2 text-sm text-slate-500">Restricted access. Use an account with ADMIN role only.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="admin-email" className="mb-2 block text-sm font-semibold text-slate-700">
            Email
          </label>
          <input
            id="admin-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-cyan-300 transition-all duration-300 focus:ring-2 focus:scale-[1.02] focus:border-cyan-500"
          />
        </div>

        <div>
          <label htmlFor="admin-password" className="mb-2 block text-sm font-semibold text-slate-700">
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-cyan-300 transition-all duration-300 focus:ring-2 focus:scale-[1.02] focus:border-cyan-500"
          />
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 animate-slide-down">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:from-slate-800 hover:to-slate-600 hover:scale-105 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading ? 'Signing in...' : 'Sign In as Admin'}
        </button>
      </form>

      <div className="mt-5 text-sm">
        <Link to="/login" className="font-semibold text-cyan-700">
          Back to user login
        </Link>
      </div>
    </div>
  );
}
