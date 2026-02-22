import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

export default function AgencyRegister() {
  const [businessName, setBusinessName] = useState('');
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
      const data = await apiFetch('/api/auth/agency-register', {
        method: 'POST',
        body: JSON.stringify({ businessName, email, password })
      });

      login({
        id: data.agency.id,
        name: data.agency.businessName,
        businessName: data.agency.businessName,
        email: data.agency.email,
        role: 'AGENCY'
      });

      navigate('/agency/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Agency registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-xl animate-scale-in">
      <h1 className="font-display text-3xl font-bold text-slate-900">Create agency account</h1>
      <p className="mt-2 text-sm text-slate-500">Publish packages and track payouts from one dashboard.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="business-name" className="mb-2 block text-sm font-semibold text-slate-700">
            Business Name
          </label>
          <input
            id="business-name"
            required
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-amber-300 transition-all duration-300 focus:ring-2 focus:scale-[1.02] focus:border-amber-500"
          />
        </div>

        <div>
          <label htmlFor="agency-reg-email" className="mb-2 block text-sm font-semibold text-slate-700">
            Email
          </label>
          <input
            id="agency-reg-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-amber-300 transition-all duration-300 focus:ring-2 focus:scale-[1.02] focus:border-amber-500"
          />
        </div>

        <div>
          <label htmlFor="agency-reg-password" className="mb-2 block text-sm font-semibold text-slate-700">
            Password
          </label>
          <input
            id="agency-reg-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-amber-300 transition-all duration-300 focus:ring-2 focus:scale-[1.02] focus:border-amber-500"
          />
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 animate-slide-down">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:from-amber-600 hover:to-amber-700 hover:scale-105 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading ? 'Creating account...' : 'Register Agency'}
        </button>
      </form>

      <p className="mt-5 text-sm text-slate-600">
        Already an agency?{' '}
        <Link to="/agency/login" className="font-semibold text-amber-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
