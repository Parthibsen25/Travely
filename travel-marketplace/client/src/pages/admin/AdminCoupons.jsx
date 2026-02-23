import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function AdminCoupons() {
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(null);

  async function load() {
    try {
      const query = filter === 'ALL' ? '' : `?status=${filter}`;
      const data = await apiFetch(`/api/coupons/all${query}`);
      setCoupons(data.coupons || []);
    } catch {
      showToast('Failed to load coupons', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { setLoading(true); load(); }, [filter]);

  async function handleReview(id, action) {
    setActionLoading(id);
    try {
      await apiFetch(`/api/coupons/${id}/review`, { method: 'POST', body: JSON.stringify({ action }) });
      showToast(`Coupon ${action === 'approve' ? 'approved' : 'rejected'}`, 'success');
      load();
    } catch (err) {
      showToast(err.message || 'Failed', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  const statusColor = { PENDING: 'bg-amber-100 text-amber-700', APPROVED: 'bg-emerald-100 text-emerald-700', REJECTED: 'bg-red-100 text-red-700' };
  const tabs = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-800 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">Coupon Management</h1>
        <p className="mt-1 text-sm text-slate-500">Review and approve coupon codes submitted by agencies.</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t} onClick={() => setFilter(t)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${filter === t ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {t === 'ALL' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {coupons.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <p className="text-sm text-slate-500">No coupons found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {coupons.map((c) => {
            const agency = c.agencyId;
            return (
              <div key={c._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg font-bold tracking-wide text-slate-900">{c.code}</h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[c.status]}`}>{c.status}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% off` : `₹${c.discountValue} off`}
                      {c.maxDiscount > 0 && c.discountType === 'PERCENTAGE' && ` (max ₹${c.maxDiscount})`}
                      {c.minOrderAmount > 0 && ` • Min order ₹${c.minOrderAmount}`}
                    </p>
                    {c.description && <p className="mt-1 text-xs text-slate-400 italic">"{c.description}"</p>}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>Agency: <strong>{agency?.businessName || agency?.email || 'Unknown'}</strong></span>
                      <span>Used: {c.usedCount || 0}{c.maxUsage > 0 ? `/${c.maxUsage}` : '/∞'}</span>
                      {c.expiresAt && <span>Expires: {new Date(c.expiresAt).toLocaleDateString()}</span>}
                      <span>
                        Packages: {c.applicablePackages?.length > 0
                          ? c.applicablePackages.map((p) => p.title || p).join(', ')
                          : 'All agency packages'}
                      </span>
                    </div>
                  </div>
                  {c.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleReview(c._id, 'approve')} disabled={actionLoading === c._id}
                        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-600 disabled:opacity-50">
                        Approve
                      </button>
                      <button onClick={() => handleReview(c._id, 'reject')} disabled={actionLoading === c._id}
                        className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-red-600 disabled:opacity-50">
                        Reject
                      </button>
                    </div>
                  )}
                  {c.status !== 'PENDING' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleReview(c._id, c.status === 'APPROVED' ? 'reject' : 'approve')} disabled={actionLoading === c._id}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">
                        {c.status === 'APPROVED' ? 'Revoke' : 'Approve'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
