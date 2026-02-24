import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import Loading from '../components/Loading';

const BUDGET_CATEGORIES = [
  'Transport',
  'Accommodation',
  'Food',
  'Activities',
  'Shopping',
  'Insurance',
  'Visa',
  'Other'
];

const STATUS_COLORS = {
  PLANNING: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  COMPLETED: 'bg-slate-100 text-slate-600',
  CANCELLED: 'bg-red-100 text-red-700'
};

const CATEGORY_ICONS = {
  Transport: '🚗',
  Accommodation: '🏨',
  Food: '🍽️',
  Activities: '🎯',
  Shopping: '🛍️',
  Insurance: '🛡️',
  Visa: '📋',
  Other: '📦'
};

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const emptyTrip = {
  title: '',
  destinations: [''],
  startDate: '',
  endDate: '',
  travelers: 1,
  budgetItems: [],
  notes: ''
};

export default function PlanTrip() {
  const { showToast } = useToast();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [form, setForm] = useState({ ...emptyTrip });
  const [saving, setSaving] = useState(false);
  const [expandedTrip, setExpandedTrip] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Budget item form
  const [budgetCategory, setBudgetCategory] = useState('Transport');
  const [budgetDesc, setBudgetDesc] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');

  useEffect(() => {
    loadTrips();
  }, []);

  async function loadTrips() {
    try {
      const data = await apiFetch('/api/custom-trips/my');
      setTrips(data.trips || []);
    } catch {
      showToast('Failed to load trips', 'error');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingTrip(null);
    setForm({ ...emptyTrip, destinations: [''] });
    setShowModal(true);
  }

  function openEdit(trip) {
    setEditingTrip(trip);
    setForm({
      title: trip.title,
      destinations: trip.destinations.length ? [...trip.destinations] : [''],
      startDate: trip.startDate ? trip.startDate.slice(0, 10) : '',
      endDate: trip.endDate ? trip.endDate.slice(0, 10) : '',
      travelers: trip.travelers,
      budgetItems: trip.budgetItems.map((b) => ({ ...b })),
      notes: trip.notes || ''
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingTrip(null);
    setBudgetCategory('Transport');
    setBudgetDesc('');
    setBudgetAmount('');
  }

  // Destinations management
  function setDestination(index, value) {
    const updated = [...form.destinations];
    updated[index] = value;
    setForm({ ...form, destinations: updated });
  }

  function addDestination() {
    setForm({ ...form, destinations: [...form.destinations, ''] });
  }

  function removeDestination(index) {
    const updated = form.destinations.filter((_, i) => i !== index);
    setForm({ ...form, destinations: updated.length ? updated : [''] });
  }

  // Budget items
  function addBudgetItem() {
    if (!budgetDesc.trim() || !budgetAmount || Number(budgetAmount) <= 0) {
      showToast('Enter a valid description and amount', 'warning');
      return;
    }
    const item = { category: budgetCategory, description: budgetDesc.trim(), amount: Number(budgetAmount) };
    setForm({ ...form, budgetItems: [...form.budgetItems, item] });
    setBudgetDesc('');
    setBudgetAmount('');
  }

  function removeBudgetItem(index) {
    setForm({ ...form, budgetItems: form.budgetItems.filter((_, i) => i !== index) });
  }

  const formTotal = form.budgetItems.reduce((s, b) => s + b.amount, 0);

  async function handleSave(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      showToast('Trip title is required', 'warning');
      return;
    }

    const payload = {
      title: form.title.trim(),
      destinations: form.destinations.filter((d) => d.trim()),
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      travelers: form.travelers,
      budgetItems: form.budgetItems,
      notes: form.notes
    };

    setSaving(true);
    try {
      if (editingTrip) {
        await apiFetch(`/api/custom-trips/${editingTrip._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast('Trip updated', 'success');
      } else {
        await apiFetch('/api/custom-trips', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast('Trip created', 'success');
      }
      closeModal();
      await loadTrips();
    } catch (err) {
      showToast(err.message || 'Failed to save trip', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await apiFetch(`/api/custom-trips/${id}`, { method: 'DELETE' });
      showToast('Trip deleted', 'success');
      setDeleteConfirm(null);
      setExpandedTrip(null);
      await loadTrips();
    } catch (err) {
      showToast(err.message || 'Failed to delete', 'error');
    }
  }

  async function handleStatusChange(trip, newStatus) {
    try {
      await apiFetch(`/api/custom-trips/${trip._id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      showToast(`Trip marked as ${newStatus.toLowerCase()}`, 'success');
      await loadTrips();
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  }

  // Group budget items by category for summary
  function getCategorySummary(items) {
    const map = {};
    items.forEach((item) => {
      map[item.category] = (map[item.category] || 0) + item.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }

  if (loading) return <Loading fullPage />;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 animate-page-enter">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">Plan My Trip</h1>
          <p className="mt-1 text-sm text-slate-600">Create and budget your own custom travel plans</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-slate-800 hover:scale-105"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Trip
        </button>
      </div>

      {/* Trip List */}
      {trips.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <svg className="mx-auto h-16 w-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-slate-700">No custom trips yet</h3>
          <p className="mt-2 text-sm text-slate-500">
            Start planning your dream trip with a personalized budget tracker.
          </p>
          <button
            onClick={openCreate}
            className="mt-6 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-slate-800"
          >
            Create Your First Trip
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <div
              key={trip._id}
              className="group relative rounded-2xl border border-slate-200 bg-white shadow-card transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              {/* Card Header */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-lg font-bold text-slate-900 truncate">{trip.title}</h3>
                    {trip.destinations.length > 0 && (
                      <p className="mt-1 text-sm text-slate-500 truncate">
                        📍 {trip.destinations.join(' → ')}
                      </p>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[trip.status]}`}>
                    {trip.status}
                  </span>
                </div>

                {/* Dates & Travelers */}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  {trip.startDate && (
                    <span className="inline-flex items-center gap-1">
                      📅 {formatDate(trip.startDate)}
                      {trip.endDate ? ` – ${formatDate(trip.endDate)}` : ''}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    👥 {trip.travelers} {trip.travelers === 1 ? 'Traveler' : 'Travelers'}
                  </span>
                </div>

                {/* Budget Summary */}
                <div className="mt-4 rounded-xl bg-gradient-to-r from-slate-50 to-cyan-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Total Budget</span>
                    <span className="text-lg font-bold text-slate-900">{formatCurrency(trip.totalBudget)}</span>
                  </div>
                  {trip.budgetItems.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {getCategorySummary(trip.budgetItems).slice(0, 3).map(([cat, amt]) => (
                        <span key={cat} className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-xs text-slate-600 shadow-card">
                          {CATEGORY_ICONS[cat]} {formatCurrency(amt)}
                        </span>
                      ))}
                      {getCategorySummary(trip.budgetItems).length > 3 && (
                        <span className="rounded-md bg-white px-2 py-0.5 text-xs text-slate-400 shadow-card">
                          +{getCategorySummary(trip.budgetItems).length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                <button
                  onClick={() => setExpandedTrip(expandedTrip === trip._id ? null : trip._id)}
                  className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 transition"
                >
                  {expandedTrip === trip._id ? 'Hide Details' : 'View Details'}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(trip)}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    title="Edit"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(trip._id)}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                    title="Delete"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedTrip === trip._id && (
                <div className="border-t border-slate-100 px-5 py-4 animate-page-enter">
                  {/* Status actions */}
                  <div className="mb-4 flex flex-wrap gap-2">
                    {trip.status === 'PLANNING' && (
                      <button onClick={() => handleStatusChange(trip, 'CONFIRMED')} className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-200">
                        Mark Confirmed
                      </button>
                    )}
                    {trip.status === 'CONFIRMED' && (
                      <button onClick={() => handleStatusChange(trip, 'COMPLETED')} className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-200">
                        Mark Completed
                      </button>
                    )}
                    {(trip.status === 'PLANNING' || trip.status === 'CONFIRMED') && (
                      <button onClick={() => handleStatusChange(trip, 'CANCELLED')} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100">
                        Cancel Trip
                      </button>
                    )}
                  </div>

                  {/* Budget Breakdown */}
                  {trip.budgetItems.length > 0 ? (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">Budget Breakdown</h4>
                      <div className="space-y-1.5">
                        {trip.budgetItems.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                            <span className="flex items-center gap-2 text-slate-700">
                              <span>{CATEGORY_ICONS[item.category]}</span>
                              <span className="font-medium">{item.description}</span>
                              <span className="text-xs text-slate-400">({item.category})</span>
                            </span>
                            <span className="font-semibold text-slate-900">{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                      </div>
                      {/* Per-person */}
                      {trip.travelers > 1 && (
                        <p className="mt-2 text-right text-xs text-slate-500">
                          {formatCurrency(trip.totalBudget / trip.travelers)} per person
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No budget items added yet.</p>
                  )}

                  {trip.notes && (
                    <div className="mt-3 rounded-lg bg-amber-50 p-3">
                      <p className="text-xs font-semibold text-amber-700">Notes</p>
                      <p className="mt-1 text-sm text-amber-800 whitespace-pre-wrap">{trip.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Delete confirm overlay */}
              {deleteConfirm === trip._id && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/95 backdrop-blur-sm animate-page-enter">
                  <div className="text-center p-6">
                    <p className="text-sm font-semibold text-slate-900">Delete this trip?</p>
                    <p className="mt-1 text-xs text-slate-500">This action cannot be undone.</p>
                    <div className="mt-4 flex justify-center gap-3">
                      <button onClick={() => setDeleteConfirm(null)} className="rounded-lg border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                        Cancel
                      </button>
                      <button onClick={() => handleDelete(trip._id)} className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal isOpen={showModal} onClose={closeModal} title={editingTrip ? 'Edit Trip' : 'Plan a New Trip'} size="lg">
        <form onSubmit={handleSave} className="space-y-5">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Trip Name *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="e.g. Goa Beach Vacation"
              required
            />
          </div>

          {/* Destinations */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Destinations</label>
            {form.destinations.map((dest, i) => (
              <div key={i} className="mb-2 flex items-center gap-2">
                <input
                  value={dest}
                  onChange={(e) => setDestination(i, e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  placeholder={`Destination ${i + 1}`}
                />
                {form.destinations.length > 1 && (
                  <button type="button" onClick={() => removeDestination(i)} className="rounded-lg p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 transition">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addDestination} className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 transition">
              + Add another destination
            </button>
          </div>

          {/* Dates & Travelers */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Travelers</label>
              <input
                type="number"
                min="1"
                value={form.travelers}
                onChange={(e) => setForm({ ...form, travelers: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Budget Items */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Budget Items</label>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              {/* Add budget item */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[140px_1fr_120px_auto]">
                <select
                  value={budgetCategory}
                  onChange={(e) => setBudgetCategory(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                >
                  {BUDGET_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{CATEGORY_ICONS[cat]} {cat}</option>
                  ))}
                </select>
                <input
                  value={budgetDesc}
                  onChange={(e) => setBudgetDesc(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  placeholder="Description"
                />
                <input
                  type="number"
                  min="0"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  placeholder="₹ Amount"
                />
                <button
                  type="button"
                  onClick={addBudgetItem}
                  className="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700"
                >
                  Add
                </button>
              </div>

              {/* Items list */}
              {form.budgetItems.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {form.budgetItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-card">
                      <span className="flex items-center gap-2 text-sm text-slate-700">
                        <span>{CATEGORY_ICONS[item.category]}</span>
                        <span className="font-medium">{item.description}</span>
                        <span className="text-xs text-slate-400">({item.category})</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{formatCurrency(item.amount)}</span>
                        <button
                          type="button"
                          onClick={() => removeBudgetItem(idx)}
                          className="rounded p-1 text-slate-400 hover:text-red-500 transition"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between rounded-lg bg-gradient-to-r from-cyan-50 to-blue-50 px-3 py-2 text-sm font-bold text-slate-900">
                    <span>Total</span>
                    <span>{formatCurrency(formTotal)}</span>
                  </div>
                  {form.travelers > 1 && (
                    <p className="text-right text-xs text-slate-500">{formatCurrency(formTotal / form.travelers)} per person</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="Any extra details, packing list, reminders..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? 'Saving...' : editingTrip ? 'Update Trip' : 'Create Trip'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
