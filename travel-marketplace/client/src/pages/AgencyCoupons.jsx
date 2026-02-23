import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { useToast } from '../context/ToastContext';

const EMPTY = {
  code: '',
  description: '',
  discountType: 'PERCENTAGE',
  discountValue: '',
  applicablePackages: [],
  maxUsage: '',
  minOrderAmount: '',
  maxDiscount: '',
  expiresAt: '',
};

export default function AgencyCoupons() {
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const [cData, pData] = await Promise.all([
        apiFetch('/api/coupons/my'),
        apiFetch('/api/packages/my'),
      ]);
      setCoupons(cData.coupons || []);
      setPackages(pData.packages || []);
    } catch {
      showToast('Failed to load coupons', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setForm({ ...EMPTY });
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(c) {
    setForm({
      code: c.code,
      description: c.description || '',
      discountType: c.discountType,
      discountValue: c.discountValue,
      applicablePackages: (c.applicablePackages || []).map((p) => (typeof p === 'string' ? p : p._id)),
      maxUsage: c.maxUsage || '',
      minOrderAmount: c.minOrderAmount || '',
      maxDiscount: c.maxDiscount || '',
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
    });
    setEditId(c._id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        ...form,
        discountValue: Number(form.discountValue),
        maxUsage: form.maxUsage ? Number(form.maxUsage) : 0,
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : 0,
        expiresAt: form.expiresAt || null,
      };
      if (editId) {
        await apiFetch(`/api/coupons/${editId}`, { method: 'PUT', body: JSON.stringify(body) });
        showToast('Coupon updated — sent for re-approval', 'success');
      } else {
        await apiFetch('/api/coupons', { method: 'POST', body: JSON.stringify(body) });
        showToast('Coupon created — pending admin approval', 'success');
      }
      setShowForm(false);
      setEditId(null);
      load();
    } catch (err) {
      showToast(err.message || 'Failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this coupon?')) return;
    try {
      await apiFetch(`/api/coupons/${id}`, { method: 'DELETE' });
      showToast('Coupon deleted', 'success');
      load();
    } catch {
      showToast('Failed to delete', 'error');
    }
  }

  function togglePackage(pkgId) {
    setForm((prev) => {
      const has = prev.applicablePackages.includes(pkgId);
      return {
        ...prev,
        applicablePackages: has
          ? prev.applicablePackages.filter((id) => id !== pkgId)
          : [...prev.applicablePackages, pkgId],
      };
    });
  }

  const statusColor = { PENDING: 'bg-amber-100 text-amber-700', APPROVED: 'bg-emerald-100 text-emerald-700', REJECTED: 'bg-red-100 text-red-700' };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">Coupons</h1>
          <p className="mt-1 text-sm text-slate-500">Create and manage discount coupons for your packages.</p>
        </div>
        <button onClick={openCreate} className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-amber-600 hover:scale-105">
          + New Coupon
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-xl font-bold text-slate-900">{editId ? 'Edit Coupon' : 'Create Coupon'}</h2>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Code *</label>
                  <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required
                    placeholder="e.g. SUMMER20" disabled={!!editId}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm uppercase outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:bg-slate-100" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Discount Type *</label>
                  <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200">
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat (₹)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Discount Value *</label>
                  <input type="number" min={0} value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} required
                    placeholder={form.discountType === 'PERCENTAGE' ? 'e.g. 20' : 'e.g. 500'}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Max Discount (₹) {form.discountType === 'PERCENTAGE' && <span className="text-slate-400">cap</span>}</label>
                  <input type="number" min={0} value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                    placeholder="0 = no cap"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Description</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Summer sale — 20% off all Goa packages"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Max Usage</label>
                  <input type="number" min={0} value={form.maxUsage} onChange={(e) => setForm({ ...form, maxUsage: e.target.value })}
                    placeholder="0 = unlimited"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Min Order (₹)</label>
                  <input type="number" min={0} value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                    placeholder="0"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Expires</label>
                  <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200" />
                </div>
              </div>

              {/* Package selector */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Applicable Packages</label>
                <p className="mb-2 text-xs text-slate-400">Leave empty = applies to ALL your packages</p>
                <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 p-2 space-y-1">
                  {packages.length === 0 && <p className="text-xs text-slate-400 p-2">No packages found</p>}
                  {packages.map((pkg) => (
                    <label key={pkg._id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50">
                      <input type="checkbox" checked={form.applicablePackages.includes(pkg._id)} onChange={() => togglePackage(pkg._id)}
                        className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-300" />
                      <span className="truncate text-slate-700">{pkg.title}</span>
                      <span className="ml-auto text-xs text-slate-400">{pkg.destination}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="rounded-lg bg-amber-500 px-6 py-2 text-sm font-semibold text-white shadow transition hover:bg-amber-600 disabled:opacity-50">
                  {saving ? 'Saving...' : editId ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupons List */}
      {coupons.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          <p className="mt-3 text-sm font-medium text-slate-600">No coupons yet</p>
          <p className="mt-1 text-xs text-slate-400">Create your first coupon to attract more bookings.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {coupons.map((c) => (
            <div key={c._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-xl font-bold text-amber-600">%</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg font-bold tracking-wide text-slate-900">{c.code}</h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[c.status]}`}>{c.status}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% off` : `₹${c.discountValue} off`}
                      {c.maxDiscount > 0 && c.discountType === 'PERCENTAGE' && ` (max ₹${c.maxDiscount})`}
                      {c.minOrderAmount > 0 && ` • Min ₹${c.minOrderAmount}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(c)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">Edit</button>
                  <button onClick={() => handleDelete(c._id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50">Delete</button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                {c.description && <span>"{c.description}"</span>}
                <span>Used: {c.usedCount || 0}{c.maxUsage > 0 ? `/${c.maxUsage}` : '/∞'}</span>
                {c.expiresAt && <span>Expires: {new Date(c.expiresAt).toLocaleDateString()}</span>}
                <span>
                  Packages: {c.applicablePackages?.length > 0
                    ? c.applicablePackages.map((p) => (typeof p === 'string' ? p : p.title)).join(', ')
                    : 'All'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
