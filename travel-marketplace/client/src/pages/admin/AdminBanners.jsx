import React, { useEffect, useState, useRef } from 'react';
import { apiFetch, mediaUrl } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function AdminBanners() {
  const { showToast } = useToast();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editBanner, setEditBanner] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    linkUrl: '',
    position: 0,
    style: 'full-width',
    gradient: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  async function load() {
    try {
      const data = await apiFetch('/api/banners');
      setBanners(data.banners || []);
    } catch {
      showToast('Failed to load banners', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function resetForm() {
    setForm({ title: '', subtitle: '', linkUrl: '', position: 0, style: 'full-width', gradient: '' });
    setImageFile(null);
    setImagePreview('');
    setEditBanner(null);
    setShowForm(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  function openCreate() {
    resetForm();
    setShowForm(true);
  }

  function openEdit(banner) {
    setEditBanner(banner);
    setForm({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      linkUrl: banner.linkUrl || '',
      position: banner.position || 0,
      style: banner.style || 'full-width',
      gradient: banner.gradient || '',
    });
    setImagePreview(banner.imageUrl ? mediaUrl(banner.imageUrl) : '');
    setImageFile(null);
    setShowForm(true);
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!editBanner && !imageFile) {
      showToast('Please select an image', 'error');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('subtitle', form.subtitle);
      formData.append('linkUrl', form.linkUrl);
      formData.append('position', form.position);
      formData.append('style', form.style);
      formData.append('gradient', form.gradient);
      if (imageFile) formData.append('image', imageFile);

      const url = editBanner ? `/api/banners/${editBanner._id}` : '/api/banners';
      const method = editBanner ? 'PUT' : 'POST';

      await apiFetch(url, {
        method,
        body: formData,
        // Don't set Content-Type — browser sets multipart boundary automatically
        rawBody: true,
      });

      showToast(editBanner ? 'Banner updated' : 'Banner created', 'success');
      resetForm();
      load();
    } catch (err) {
      showToast(err.message || 'Failed to save banner', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id) {
    setActionLoading(id);
    try {
      await apiFetch(`/api/banners/${id}/toggle`, { method: 'POST' });
      load();
    } catch {
      showToast('Failed to toggle banner', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this banner permanently?')) return;
    setActionLoading(id);
    try {
      await apiFetch(`/api/banners/${id}`, { method: 'DELETE' });
      showToast('Banner deleted', 'success');
      load();
    } catch {
      showToast('Failed to delete', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Promotional Banners</h1>
          <p className="mt-1 text-sm text-slate-500">Manage banners shown on the user home page</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Banner
        </button>
      </div>

      {/* ── Create / Edit Form ── */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6"
        >
          <h2 className="text-lg font-bold text-slate-800">
            {editBanner ? 'Edit Banner' : 'Create Banner'}
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Title *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Summer Sale!"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Subtitle</label>
              <input
                type="text"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Up to 50% off on selected packages"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Link URL (optional)</label>
              <input
                type="url"
                value={form.linkUrl}
                onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Position (order)</label>
              <input
                type="number"
                min="0"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Style</label>
              <select
                value={form.style}
                onChange={(e) => setForm({ ...form, style: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="full-width">Full Width</option>
                <option value="card">Card</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Gradient CSS (optional)</label>
              <input
                type="text"
                value={form.gradient}
                onChange={(e) => setForm({ ...form, gradient: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="linear-gradient(135deg, rgba(0,0,0,0.5) 0%, transparent 60%)"
              />
            </div>
          </div>

          {/* Image upload */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700">
              Banner Image {!editBanner && '*'}
            </label>
            <div className="mt-2 flex items-start gap-4">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-28 w-48 rounded-lg object-cover border border-slate-200"
                />
              )}
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
                />
                <p className="mt-1 text-xs text-slate-400">Max 5MB, JPEG/PNG/WebP/AVIF</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : editBanner ? 'Update Banner' : 'Create Banner'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── Banners List ── */}
      {banners.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
            <svg className="h-7 w-7 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z" />
            </svg>
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-700">No banners yet</p>
          <p className="mt-1 text-xs text-slate-500">Create your first promotional banner to display on the user homepage</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {banners.map((banner) => (
            <div
              key={banner._id}
              className={`flex items-center gap-4 rounded-xl border p-4 transition ${
                banner.isActive ? 'border-emerald-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'
              }`}
            >
              {/* Thumbnail */}
              <div className="h-20 w-36 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200">
                <img
                  src={mediaUrl(banner.imageUrl)}
                  alt={banner.title}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800 truncate">{banner.title}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    banner.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {banner.subtitle && (
                  <p className="mt-0.5 text-xs text-slate-500 truncate">{banner.subtitle}</p>
                )}
                <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                  <span>Position: {banner.position}</span>
                  <span>Style: {banner.style}</span>
                  {banner.linkUrl && <span className="truncate max-w-[200px]">→ {banner.linkUrl}</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(banner._id)}
                  disabled={actionLoading === banner._id}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    banner.isActive
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  } disabled:opacity-50`}
                >
                  {banner.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => openEdit(banner)}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(banner._id)}
                  disabled={actionLoading === banner._id}
                  className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
