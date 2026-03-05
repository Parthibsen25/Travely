import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../utils/api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }

    async function verify() {
      try {
        const data = await apiFetch('/api/auth/verify-email', {
          method: 'POST',
          body: JSON.stringify({ token })
        });
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'Verification failed');
      }
    }
    verify();
  }, [token]);

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 animate-page-enter">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-glass text-center">
        {status === 'verifying' && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-100">
              <svg className="h-8 w-8 animate-spin text-cyan-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <h2 className="font-display text-xl font-bold text-slate-900">Verifying your email...</h2>
            <p className="mt-2 text-sm text-slate-500">Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
              <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <h2 className="font-display text-xl font-bold text-slate-900">Email Verified!</h2>
            <p className="mt-2 text-sm text-slate-500">{message}</p>
            <Link to="/app" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all">
              Go to Dashboard
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
              <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <h2 className="font-display text-xl font-bold text-red-700">Verification Failed</h2>
            <p className="mt-2 text-sm text-slate-500">{message}</p>
            <Link to="/login" className="mt-6 inline-block text-sm font-semibold text-cyan-600 hover:text-cyan-700 transition-colors">
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
