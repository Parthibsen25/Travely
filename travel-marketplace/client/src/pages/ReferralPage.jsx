import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

export default function ReferralPage() {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function fetch() {
      try {
        const [refData, couponData] = await Promise.all([
          apiFetch('/api/referrals/me'),
          apiFetch('/api/referrals/coupons'),
        ]);
        setData(refData);
        setCoupons(couponData.coupons || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const referralCode = data?.referralCode || user?.referralCode || '';
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  function copyCode() {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyLink() {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  function shareWhatsApp() {
    const text = `Join Travely and get 10% off your first booking! Use my referral code: ${referralCode}\n\nSign up here: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  function shareTwitter() {
    const text = `I'm loving @Travely for booking curated trips! 🌍 Join using my referral code ${referralCode} and get 10% off!\n\n${referralLink}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  }

  function shareEmail() {
    const subject = 'Join Travely & get 10% off!';
    const body = `Hey!\n\nI've been using Travely to book amazing trips. Sign up with my referral code and we both get 10% off!\n\nReferral Code: ${referralCode}\nSign up: ${referralLink}\n\nHappy travels!`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 animate-page-enter">
      {/* Hero Card */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-600 p-8 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
          <h1 className="font-display text-2xl font-bold">Refer & Earn</h1>
        </div>
        <p className="mt-1 text-cyan-100">
          Share your referral code with friends. When they sign up, you <strong>both</strong> get a <strong>10% discount coupon</strong> (up to ₹500)!
        </p>

        {/* Referral Code Display */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 px-5 py-3.5 text-center">
            <p className="text-xs uppercase tracking-wider text-cyan-200 mb-1">Your Referral Code</p>
            <p className="text-2xl font-bold tracking-widest">{referralCode}</p>
          </div>
          <button
            onClick={copyCode}
            className="rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-cyan-700 shadow-lg transition hover:bg-cyan-50 active:scale-95"
          >
            {copied ? '✓ Copied!' : 'Copy Code'}
          </button>
        </div>

        {/* Referral Link */}
        <div className="mt-4">
          <div className="flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-3">
            <p className="flex-1 truncate text-sm text-cyan-100 font-mono">{referralLink}</p>
            <button
              onClick={copyLink}
              className="flex-shrink-0 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/30"
            >
              {copiedLink ? '✓ Copied' : 'Copy Link'}
            </button>
          </div>
        </div>
      </div>

      {/* Share Buttons */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Share via</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={shareWhatsApp}
            className="flex items-center gap-2 rounded-xl bg-green-500 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-green-600 active:scale-95"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </button>
          <button
            onClick={shareTwitter}
            className="flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-sky-600 active:scale-95"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
            Twitter
          </button>
          <button
            onClick={shareEmail}
            className="flex items-center gap-2 rounded-xl bg-slate-700 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-slate-800 active:scale-95"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            Email
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
          <p className="text-3xl font-bold text-cyan-600">{data?.totalReferrals || 0}</p>
          <p className="mt-1 text-sm text-slate-500">Friends Referred</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
          <p className="text-3xl font-bold text-emerald-600">{data?.rewarded || 0}</p>
          <p className="mt-1 text-sm text-slate-500">Rewards Earned</p>
        </div>
      </div>

      {/* Reward Coupons */}
      {coupons.length > 0 && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Your Referral Coupons</h2>
          <div className="space-y-3">
            {coupons.map((c) => {
              const expired = c.expiresAt && new Date(c.expiresAt) < new Date();
              const used = c.usedCount > 0;
              return (
                <div
                  key={c._id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-4 ${
                    expired || used ? 'border-slate-200 bg-slate-50 opacity-60' : 'border-emerald-200 bg-emerald-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold ${expired || used ? 'bg-slate-200 text-slate-500' : 'bg-emerald-200 text-emerald-700'}`}>
                      %
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 tracking-wider">{c.code}</p>
                      <p className="text-xs text-slate-500">
                        {c.discountValue}% off (up to ₹{c.maxDiscount}) · {c.source === 'referrer' ? 'Earned by referring' : 'Welcome bonus'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    {expired ? (
                      <span className="rounded-full bg-red-100 px-3 py-1 font-semibold text-red-600">Expired</span>
                    ) : used ? (
                      <span className="rounded-full bg-slate-200 px-3 py-1 font-semibold text-slate-600">Used</span>
                    ) : (
                      <span className="rounded-full bg-emerald-200 px-3 py-1 font-semibold text-emerald-700">Active</span>
                    )}
                    {c.expiresAt && !expired && (
                      <p className="mt-1 text-slate-400">Expires {new Date(c.expiresAt).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Referral History */}
      {data?.referrals?.length > 0 && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Referral History</h2>
          <div className="space-y-3">
            {data.referrals.map((r) => (
              <div key={r._id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 text-sm font-bold text-cyan-700">
                    {(r.refereeId?.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{r.refereeId?.name || 'User'}</p>
                    <p className="text-xs text-slate-400">Joined {new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  r.status === 'REWARDED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {r.status === 'REWARDED' ? 'Rewarded' : 'Signed up'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">How it works</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { step: '1', title: 'Share your code', desc: 'Send your unique referral code or link to friends' },
            { step: '2', title: 'Friend signs up', desc: 'They enter your code during registration' },
            { step: '3', title: 'Both get rewards', desc: 'You both receive a 10% discount coupon (up to ₹500)' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 text-lg font-bold text-cyan-700">
                {item.step}
              </div>
              <h3 className="font-semibold text-slate-700">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
