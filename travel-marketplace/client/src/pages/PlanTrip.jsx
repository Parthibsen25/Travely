import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import Loading from '../components/Loading';

/* ────────────────────────────── Constants ─────────────────────────────── */

const BUDGET_CATEGORIES = [
  'Transport', 'Accommodation', 'Food', 'Activities',
  'Shopping', 'Insurance', 'Visa', 'Other'
];

const STATUS_COLORS = {
  PLANNING: 'bg-blue-100 text-blue-700 ring-blue-200/60',
  CONFIRMED: 'bg-emerald-100 text-emerald-700 ring-emerald-200/60',
  COMPLETED: 'bg-slate-100 text-slate-600 ring-slate-200/60',
  CANCELLED: 'bg-red-100 text-red-700 ring-red-200/60'
};

const CATEGORY_ICONS = {
  Transport: '🚗', Accommodation: '🏨', Food: '🍽️', Activities: '🎯',
  Shopping: '🛍️', Insurance: '🛡️', Visa: '📋', Other: '📦'
};

const CATEGORY_COLORS = {
  Transport: '#3b82f6',
  Accommodation: '#8b5cf6',
  Food: '#f59e0b',
  Activities: '#10b981',
  Shopping: '#ec4899',
  Insurance: '#6366f1',
  Visa: '#14b8a6',
  Other: '#94a3b8'
};

const PAYMENT_METHODS = [
  { value: 'cash', label: '💵 Cash' },
  { value: 'card', label: '💳 Card' },
  { value: 'upi', label: '📱 UPI' },
  { value: 'other', label: '🔄 Other' }
];

const TABS = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'budget', label: 'Budget', icon: '💰' },
  { key: 'expenses', label: 'Expenses', icon: '💳' },
  { key: 'checklist', label: 'Checklist', icon: '✅' }
];

function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency, maximumFractionDigits: 0
  }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function formatShortDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short'
  });
}

function daysBetween(start, end) {
  if (!start || !end) return 0;
  return Math.max(1, Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)));
}

/* ─────────────────────── Donut Chart Component ───────────────────────── */

function DonutChart({ items, total, size = 160 }) {
  const segments = useMemo(() => {
    if (!items.length || total === 0) return [];
    let cumulative = 0;
    return items.map(([cat, amt]) => {
      const pct = (amt / total) * 100;
      const seg = { category: cat, amount: amt, pct, start: cumulative };
      cumulative += pct;
      return seg;
    });
  }, [items, total]);

  const conicGradient = useMemo(() => {
    if (!segments.length) return 'conic-gradient(#e2e8f0 0% 100%)';
    const stops = segments.map((s) =>
      `${CATEGORY_COLORS[s.category] || '#94a3b8'} ${s.start}% ${s.start + s.pct}%`
    ).join(', ');
    return `conic-gradient(${stops})`;
  }, [segments]);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
      <div
        className="relative shrink-0 rounded-full"
        style={{
          width: size, height: size,
          background: conicGradient
        }}
      >
        <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-white shadow-sm">
          <span className="text-xs text-slate-400">Total</span>
          <span className="font-display text-lg font-bold text-slate-900">{formatCurrency(total)}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        {segments.map((s) => (
          <div key={s.category} className="flex items-center gap-2 text-sm">
            <span
              className="h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: CATEGORY_COLORS[s.category] }}
            />
            <span className="text-slate-600">{s.category}</span>
            <span className="ml-auto font-semibold text-slate-800">{Math.round(s.pct)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────── Progress Bar Component ──────────────────────── */

function BudgetProgressBar({ spent, budget, label }) {
  const pct = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0;
  const isOver = spent > budget;
  const color = isOver ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-teal-500';

  return (
    <div>
      {label && <p className="mb-1 text-xs font-medium text-slate-500">{label}</p>}
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
        <span>{formatCurrency(spent)} spent</span>
        <span className={isOver ? 'font-semibold text-rose-600' : ''}>
          {isOver ? `${formatCurrency(spent - budget)} over` : `${formatCurrency(budget - spent)} left`}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════ Main Component ═══════════════════════════ */

export default function PlanTrip() {
  const { showToast } = useToast();

  // List state
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Detail view
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Form state
  const emptyForm = {
    title: '', destinations: [''], startDate: '', endDate: '',
    travelers: 1, travelerNames: [], budgetItems: [], notes: '', budgetLimit: 0,
    currency: 'INR', tags: [], checklist: []
  };
  const [form, setForm] = useState({ ...emptyForm });

  // Budget item form
  const [budgetCategory, setBudgetCategory] = useState('Transport');
  const [budgetDesc, setBudgetDesc] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');

  // Expense form
  const [expForm, setExpForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: 'Food', description: '', amount: '', paymentMethod: 'upi', paidBy: ''
  });
  const [addingExpense, setAddingExpense] = useState(false);

  // Checklist
  const [newCheckItem, setNewCheckItem] = useState('');

  // Share
  const [shareText, setShareText] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

  /* ─── Data Loading ─────────────────────────────────────────────────── */

  useEffect(() => { loadTrips(); loadTemplates(); }, []);

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

  async function loadTemplates() {
    try {
      const data = await apiFetch('/api/custom-trips/templates');
      setTemplates(data.templates || []);
    } catch { /* silent */ }
  }

  /* ─── CRUD Helpers ─────────────────────────────────────────────────── */

  function openCreate() {
    setEditingTrip(null);
    setForm({ ...emptyForm, destinations: [''] });
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
      travelerNames: trip.travelerNames || [],
      budgetItems: trip.budgetItems.map((b) => ({ ...b })),
      notes: trip.notes || '',
      budgetLimit: trip.budgetLimit || 0,
      currency: trip.currency || 'INR',
      tags: trip.tags || [],
      checklist: trip.checklist ? trip.checklist.map((c) => ({ ...c })) : []
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

  function applyTemplate(template) {
    setForm({
      ...emptyForm,
      title: template.title,
      travelers: template.travelers,
      travelerNames: [],
      budgetItems: template.budgetItems.map((b) => ({ ...b, actualAmount: 0, isPaid: false })),
      destinations: ['']
    });
    setShowTemplateModal(false);
    setShowModal(true);
  }

  // Destinations
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
    const item = {
      category: budgetCategory,
      description: budgetDesc.trim(),
      amount: Number(budgetAmount),
      actualAmount: 0,
      isPaid: false
    };
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
      travelerNames: form.travelerNames.filter((n) => n.trim()),
      budgetItems: form.budgetItems,
      notes: form.notes,
      budgetLimit: form.budgetLimit || 0,
      currency: form.currency || 'INR',
      tags: form.tags,
      checklist: form.checklist
    };

    setSaving(true);
    try {
      if (editingTrip) {
        await apiFetch(`/api/custom-trips/${editingTrip._id}`, {
          method: 'PUT', body: JSON.stringify(payload)
        });
        showToast('Trip updated', 'success');
      } else {
        await apiFetch('/api/custom-trips', {
          method: 'POST', body: JSON.stringify(payload)
        });
        showToast('Trip created', 'success');
      }
      closeModal();
      await loadTrips();
      if (selectedTrip) {
        const refreshed = await apiFetch(`/api/custom-trips/${selectedTrip._id}`);
        setSelectedTrip(refreshed.trip);
      }
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
      if (selectedTrip?._id === id) setSelectedTrip(null);
      await loadTrips();
    } catch (err) {
      showToast(err.message || 'Failed to delete', 'error');
    }
  }

  async function handleStatusChange(trip, newStatus) {
    try {
      await apiFetch(`/api/custom-trips/${trip._id}`, {
        method: 'PUT', body: JSON.stringify({ status: newStatus })
      });
      showToast(`Trip marked as ${newStatus.toLowerCase()}`, 'success');
      await loadTrips();
      if (selectedTrip?._id === trip._id) {
        const refreshed = await apiFetch(`/api/custom-trips/${trip._id}`);
        setSelectedTrip(refreshed.trip);
      }
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  }

  async function handleDuplicate(trip) {
    try {
      await apiFetch(`/api/custom-trips/${trip._id}/duplicate`, { method: 'POST' });
      showToast('Trip duplicated!', 'success');
      await loadTrips();
    } catch (err) {
      showToast(err.message || 'Failed to duplicate', 'error');
    }
  }

  /* ─── Daily Expense Handlers ───────────────────────────────────────── */

  async function handleAddExpense(tripId) {
    if (!expForm.description.trim() || !expForm.amount || Number(expForm.amount) <= 0) {
      showToast('Enter description and valid amount', 'warning');
      return;
    }
    setAddingExpense(true);
    try {
      const result = await apiFetch(`/api/custom-trips/${tripId}/expenses`, {
        method: 'POST',
        body: JSON.stringify({
          date: expForm.date,
          category: expForm.category,
          description: expForm.description.trim(),
          amount: Number(expForm.amount),
          paymentMethod: expForm.paymentMethod,
          paidBy: expForm.paidBy
        })
      });
      setSelectedTrip(result.trip);
      setTrips((prev) => prev.map((t) => t._id === tripId ? result.trip : t));
      setExpForm({ ...expForm, description: '', amount: '' });
      showToast('Expense added', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to add expense', 'error');
    } finally {
      setAddingExpense(false);
    }
  }

  async function handleRemoveExpense(tripId, expenseId) {
    try {
      const result = await apiFetch(`/api/custom-trips/${tripId}/expenses/${expenseId}`, {
        method: 'DELETE'
      });
      setSelectedTrip(result.trip);
      setTrips((prev) => prev.map((t) => t._id === tripId ? result.trip : t));
      showToast('Expense removed', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to remove expense', 'error');
    }
  }

  /* ─── Checklist Handlers ───────────────────────────────────────────── */

  async function handleAddCheckItem(tripId) {
    if (!newCheckItem.trim()) return;
    const trip = trips.find((t) => t._id === tripId) || selectedTrip;
    if (!trip) return;
    const updatedChecklist = [...(trip.checklist || []), { text: newCheckItem.trim(), checked: false }];
    try {
      const result = await apiFetch(`/api/custom-trips/${tripId}`, {
        method: 'PUT', body: JSON.stringify({ checklist: updatedChecklist })
      });
      setSelectedTrip(result.trip);
      setTrips((prev) => prev.map((t) => t._id === tripId ? result.trip : t));
      setNewCheckItem('');
    } catch (err) {
      showToast(err.message || 'Failed to add item', 'error');
    }
  }

  async function handleToggleCheck(tripId, index) {
    const trip = trips.find((t) => t._id === tripId) || selectedTrip;
    if (!trip) return;
    const updatedChecklist = (trip.checklist || []).map((c, i) =>
      i === index ? { ...c, checked: !c.checked } : { ...c }
    );
    try {
      const result = await apiFetch(`/api/custom-trips/${tripId}`, {
        method: 'PUT', body: JSON.stringify({ checklist: updatedChecklist })
      });
      setSelectedTrip(result.trip);
      setTrips((prev) => prev.map((t) => t._id === tripId ? result.trip : t));
    } catch { /* silent */ }
  }

  async function handleRemoveCheckItem(tripId, index) {
    const trip = trips.find((t) => t._id === tripId) || selectedTrip;
    if (!trip) return;
    const updatedChecklist = (trip.checklist || []).filter((_, i) => i !== index);
    try {
      const result = await apiFetch(`/api/custom-trips/${tripId}`, {
        method: 'PUT', body: JSON.stringify({ checklist: updatedChecklist })
      });
      setSelectedTrip(result.trip);
      setTrips((prev) => prev.map((t) => t._id === tripId ? result.trip : t));
    } catch { /* silent */ }
  }

  /* ─── Share ────────────────────────────────────────────────────────── */

  async function handleShare(trip) {
    try {
      const data = await apiFetch(`/api/custom-trips/${trip._id}/summary`);
      setShareText(data.summary);
      setShowShareModal(true);
    } catch (err) {
      showToast(err.message || 'Failed to generate summary', 'error');
    }
  }

  function copyShareText() {
    navigator.clipboard.writeText(shareText).then(() => {
      showToast('Copied to clipboard!', 'success');
    }).catch(() => {
      showToast('Failed to copy', 'error');
    });
  }

  /* ─── Category Summary ────────────────────────────────────────────── */

  function getCategorySummary(items) {
    const map = {};
    items.forEach((item) => {
      map[item.category] = (map[item.category] || 0) + item.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }

  /* ─── Computed Insights ────────────────────────────────────────────── */

  function getTripInsights(trip) {
    const insights = [];
    const totalPlanned = trip.totalBudget || 0;
    const totalActual = trip.totalActual || 0;
    const dailyExpTotal = (trip.dailyExpenses || []).reduce((s, e) => s + e.amount, 0);
    const days = daysBetween(trip.startDate, trip.endDate);

    if (totalPlanned > 0 && days > 0) {
      insights.push({
        icon: '📅', label: 'Daily Budget',
        value: formatCurrency(totalPlanned / days, trip.currency),
        desc: `over ${days} days`
      });
    }
    if (trip.travelers > 1 && totalPlanned > 0) {
      insights.push({
        icon: '👤', label: 'Per Person',
        value: formatCurrency(totalPlanned / trip.travelers, trip.currency),
        desc: `split among ${trip.travelers}`
      });
    }
    if (totalActual > 0 && totalPlanned > 0) {
      const savePct = Math.round(((totalPlanned - totalActual) / totalPlanned) * 100);
      if (savePct > 0) {
        insights.push({ icon: '💚', label: 'Under Budget', value: `${savePct}%`, desc: 'savings so far' });
      } else if (savePct < 0) {
        insights.push({ icon: '🔴', label: 'Over Budget', value: `${Math.abs(savePct)}%`, desc: 'exceeded budget' });
      }
    }
    if (dailyExpTotal > 0 && (trip.dailyExpenses || []).length > 0) {
      const uniqueDays = new Set((trip.dailyExpenses || []).map((e) => new Date(e.date).toDateString())).size;
      insights.push({
        icon: '💳', label: 'Avg Daily Spend',
        value: formatCurrency(dailyExpTotal / Math.max(uniqueDays, 1), trip.currency),
        desc: `across ${uniqueDays} day${uniqueDays > 1 ? 's' : ''}`
      });
    }
    if (trip.budgetItems.length > 0) {
      const cats = getCategorySummary(trip.budgetItems);
      if (cats.length > 0) {
        const topPct = Math.round((cats[0][1] / totalPlanned) * 100);
        insights.push({
          icon: CATEGORY_ICONS[cats[0][0]],
          label: 'Biggest Spend',
          value: cats[0][0],
          desc: `${topPct}% of budget`
        });
      }
    }

    return insights;
  }

  /* ─── Memoized daily expense grouping (must be before conditional returns) ─── */
  const expensesByDate = useMemo(() => {
    if (!selectedTrip?.dailyExpenses?.length) return [];
    const grouped = {};
    selectedTrip.dailyExpenses.forEach((exp) => {
      const key = new Date(exp.date).toDateString();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(exp);
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => new Date(b) - new Date(a));
  }, [selectedTrip?.dailyExpenses]);

  /* ═══════════════════════════ RENDER ═══════════════════════════════ */

  if (loading) return <Loading fullPage />;

  // Compute detail-view data (safe even when selectedTrip is null)
  const trip = selectedTrip;
  const totalPlanned = trip ? (trip.totalBudget || 0) : 0;
  const budgetSpent = trip ? trip.budgetItems.reduce((s, b) => s + (b.actualAmount || 0), 0) : 0;
  const dailyExpTotal = trip ? (trip.dailyExpenses || []).reduce((s, e) => s + e.amount, 0) : 0;
  const totalActual = budgetSpent + dailyExpTotal;
  const categorySummary = trip ? getCategorySummary(trip.budgetItems) : [];
  const insights = trip ? getTripInsights(trip) : [];
  const checklist = trip ? (trip.checklist || []) : [];
  const checkDone = checklist.filter((c) => c.checked).length;

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <>
    {/* ─── Detail View ──────────────────────────────────────────── */}
    {selectedTrip ? (
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 animate-page-enter">
        {/* Back + Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedTrip(null)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">{trip.title}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                {trip.destinations.length > 0 && <span>📍 {trip.destinations.join(' → ')}</span>}
                {trip.startDate && (
                  <span>📅 {formatShortDate(trip.startDate)}{trip.endDate ? ` – ${formatShortDate(trip.endDate)}` : ''}</span>
                )}
                <span>👥 {trip.travelers}{trip.travelerNames && trip.travelerNames.length > 0 && (
                  <span className="ml-1 text-xs text-slate-400">({trip.travelerNames.join(', ')})</span>
                )}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ring-1 ${STATUS_COLORS[trip.status]}`}>
              {trip.status}
            </span>
            <button onClick={() => openEdit(trip)} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200" title="Edit">
              ✏️ Edit
            </button>
            <button onClick={() => handleShare(trip)} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200" title="Share">
              📤 Share
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? 'bg-white text-slate-900 shadow-card'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ────── Overview Tab ────── */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-page-enter">
            {/* Smart Insights */}
            {insights.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {insights.map((ins, i) => (
                  <div key={i} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
                    <span className="text-2xl">{ins.icon}</span>
                    <p className="mt-2 font-display text-lg font-bold text-slate-900">{ins.value}</p>
                    <p className="text-xs font-medium text-slate-500">{ins.label}</p>
                    <p className="text-[11px] text-slate-400">{ins.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Budget Progress */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-card">
                <h3 className="font-display text-lg font-bold text-slate-900">Budget Overview</h3>
                <div className="mt-4">
                  <BudgetProgressBar spent={totalActual} budget={totalPlanned} label="Overall spending" />
                </div>
                {trip.budgetLimit > 0 && totalPlanned > trip.budgetLimit && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
                    <span>⚠️</span>
                    <span>Planned budget exceeds your limit of {formatCurrency(trip.budgetLimit, trip.currency)}</span>
                  </div>
                )}

                {/* Status actions */}
                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  {trip.status === 'PLANNING' && (
                    <button onClick={() => handleStatusChange(trip, 'CONFIRMED')}
                      className="rounded-xl bg-emerald-100 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-200">
                      ✓ Confirm Trip
                    </button>
                  )}
                  {trip.status === 'CONFIRMED' && (
                    <button onClick={() => handleStatusChange(trip, 'COMPLETED')}
                      className="rounded-xl bg-blue-100 px-4 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-200">
                      ✓ Mark Completed
                    </button>
                  )}
                  {(trip.status === 'PLANNING' || trip.status === 'CONFIRMED') && (
                    <button onClick={() => handleStatusChange(trip, 'CANCELLED')}
                      className="rounded-xl bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100">
                      Cancel Trip
                    </button>
                  )}
                </div>
              </div>

              {/* Donut Chart */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-card">
                <h3 className="font-display text-lg font-bold text-slate-900">Category Breakdown</h3>
                <div className="mt-4">
                  {categorySummary.length > 0 ? (
                    <DonutChart items={categorySummary} total={totalPlanned} />
                  ) : (
                    <p className="py-8 text-center text-sm text-slate-400 italic">No budget items yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            {trip.notes && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-card">
                <h3 className="flex items-center gap-2 text-sm font-bold text-amber-800">📝 Notes</h3>
                <p className="mt-2 text-sm text-amber-900 whitespace-pre-wrap">{trip.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* ────── Budget Tab ────── */}
        {activeTab === 'budget' && (
          <div className="space-y-4 animate-page-enter">
            <div className="rounded-2xl border border-slate-100 bg-white shadow-card overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4">
                <h3 className="font-display text-lg font-bold text-slate-900">Planned Budget Items</h3>
              </div>
              {trip.budgetItems.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {trip.budgetItems.map((item, idx) => {
                    const pct = totalPlanned > 0 ? Math.round((item.amount / totalPlanned) * 100) : 0;
                    return (
                      <div key={idx} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/50 transition">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
                          style={{ backgroundColor: `${CATEGORY_COLORS[item.category]}15` }}>
                          {CATEGORY_ICONS[item.category]}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800">{item.description}</p>
                          <p className="text-xs text-slate-400">{item.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">
                            {formatCurrency(item.amount, trip.currency)}
                          </p>
                          <p className="text-xs text-slate-400">{pct}% of total</p>
                        </div>
                        {item.isPaid && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            PAID
                          </span>
                        )}
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between bg-gradient-to-r from-cyan-50 to-blue-50 px-6 py-4">
                    <span className="text-sm font-bold text-slate-700">Total Planned</span>
                    <span className="font-display text-lg font-bold text-slate-900">
                      {formatCurrency(totalPlanned, trip.currency)}
                    </span>
                  </div>
                  {trip.travelers > 1 && (
                    <div className="flex justify-end px-6 py-2 text-xs text-slate-500">
                      {formatCurrency(totalPlanned / trip.travelers, trip.currency)} per person
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-10 text-center text-sm text-slate-400 italic">
                  No budget items yet. Click "Edit" to add items to your plan.
                </div>
              )}
            </div>

            {/* Actual vs Planned */}
            {trip.budgetItems.some((b) => b.actualAmount > 0) && (
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-card">
                <h3 className="font-display text-lg font-bold text-slate-900 mb-4">Actual vs Planned</h3>
                <div className="space-y-3">
                  {trip.budgetItems.filter((b) => b.actualAmount > 0).map((item, idx) => {
                    const diff = item.amount - item.actualAmount;
                    return (
                      <div key={idx} className="flex items-center gap-4 rounded-xl bg-slate-50 p-3">
                        <span className="text-lg">{CATEGORY_ICONS[item.category]}</span>
                        <span className="min-w-0 flex-1 text-sm font-medium text-slate-700 truncate">{item.description}</span>
                        <div className="text-right text-xs">
                          <span className="text-slate-400 line-through">{formatCurrency(item.amount)}</span>
                          <span className="ml-2 font-bold text-slate-900">{formatCurrency(item.actualAmount)}</span>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          diff >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {diff >= 0 ? `↓ ${formatCurrency(diff)}` : `↑ ${formatCurrency(Math.abs(diff))}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ────── Expenses Tab ────── */}
        {activeTab === 'expenses' && (
          <div className="space-y-4 animate-page-enter">
            {/* Add expense form */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-card">
              <h3 className="font-display text-lg font-bold text-slate-900 mb-4">Log Expense</h3>
              <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${(trip.travelerNames && trip.travelerNames.length > 0) ? 'lg:grid-cols-[1fr_130px_1fr_100px_110px_120px_auto]' : 'lg:grid-cols-[1fr_140px_1fr_120px_120px_auto]'}`}>
                <input
                  type="date"
                  value={expForm.date}
                  onChange={(e) => setExpForm({ ...expForm, date: e.target.value })}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus-ring"
                />
                <select
                  value={expForm.category}
                  onChange={(e) => setExpForm({ ...expForm, category: e.target.value })}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus-ring"
                >
                  {BUDGET_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{CATEGORY_ICONS[cat]} {cat}</option>
                  ))}
                </select>
                <input
                  value={expForm.description}
                  onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus-ring"
                  placeholder="What did you spend on?"
                />
                <input
                  type="number"
                  min="0"
                  value={expForm.amount}
                  onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus-ring"
                  placeholder="₹ Amount"
                />
                <select
                  value={expForm.paymentMethod}
                  onChange={(e) => setExpForm({ ...expForm, paymentMethod: e.target.value })}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus-ring"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                {trip.travelerNames && trip.travelerNames.length > 0 && (
                  <select
                    value={expForm.paidBy}
                    onChange={(e) => setExpForm({ ...expForm, paidBy: e.target.value })}
                    className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus-ring"
                  >
                    <option value="">Who paid?</option>
                    {trip.travelerNames.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                )}
                <button
                  onClick={() => handleAddExpense(trip._id)}
                  disabled={addingExpense}
                  className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:shadow-xl disabled:opacity-60"
                >
                  {addingExpense ? '...' : '+ Add'}
                </button>
              </div>
            </div>

            {/* Expense Summary */}
            {dailyExpTotal > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-4 text-white shadow-lg">
                  <p className="text-xs font-medium opacity-80">Total Expenses</p>
                  <p className="font-display text-xl font-bold">{formatCurrency(dailyExpTotal, trip.currency)}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
                  <p className="text-xs font-medium text-slate-500"># Transactions</p>
                  <p className="font-display text-xl font-bold text-slate-900">{(trip.dailyExpenses || []).length}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
                  <p className="text-xs font-medium text-slate-500">Avg / Transaction</p>
                  <p className="font-display text-xl font-bold text-slate-900">
                    {formatCurrency(dailyExpTotal / Math.max((trip.dailyExpenses || []).length, 1), trip.currency)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
                  <p className="text-xs font-medium text-slate-500">Budget Remaining</p>
                  <p className={`font-display text-xl font-bold ${totalPlanned - totalActual >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatCurrency(Math.abs(totalPlanned - totalActual), trip.currency)}
                  </p>
                </div>
              </div>
            )}

            {/* Per-Person Expense Breakdown */}
            {trip.travelerNames && trip.travelerNames.length > 0 && (trip.dailyExpenses || []).length > 0 && (() => {
              const personData = {};
              trip.travelerNames.forEach((name) => { personData[name] = { total: 0, count: 0, categories: {} }; });
              let unassigned = { total: 0, count: 0 };
              (trip.dailyExpenses || []).forEach((exp) => {
                if (exp.paidBy && personData[exp.paidBy]) {
                  personData[exp.paidBy].total += exp.amount;
                  personData[exp.paidBy].count += 1;
                  personData[exp.paidBy].categories[exp.category] = (personData[exp.paidBy].categories[exp.category] || 0) + exp.amount;
                } else {
                  unassigned.total += exp.amount;
                  unassigned.count += 1;
                }
              });
              const equalShare = dailyExpTotal / trip.travelerNames.length;

              return (
                <div className="rounded-2xl border border-slate-100 bg-white shadow-card overflow-hidden">
                  <div className="border-b border-slate-50 bg-slate-50/50 px-5 py-3">
                    <h3 className="font-display text-sm font-bold text-slate-700">👥 Per-Person Expense Breakdown</h3>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {trip.travelerNames.map((name) => {
                        const pd = personData[name];
                        const diff = pd.total - equalShare;
                        const topCat = Object.entries(pd.categories).sort((a, b) => b[1] - a[1])[0];
                        return (
                          <div key={name} className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white">
                                  {name.charAt(0).toUpperCase()}
                                </span>
                                <span className="text-sm font-semibold text-slate-800">{name}</span>
                              </div>
                              <span className="font-display text-lg font-bold text-slate-900">{formatCurrency(pd.total, trip.currency)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">{pd.count} expense{pd.count !== 1 ? 's' : ''}</span>
                              <span className={`rounded-full px-2 py-0.5 font-semibold ${
                                diff > 0 ? 'bg-rose-50 text-rose-600' : diff < 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {diff > 0 ? `↑ ${formatCurrency(diff, trip.currency)} over avg` : diff < 0 ? `↓ ${formatCurrency(Math.abs(diff), trip.currency)} under avg` : 'At average'}
                              </span>
                            </div>
                            {topCat && (
                              <p className="text-[11px] text-slate-400">Top: {CATEGORY_ICONS[topCat[0]]} {topCat[0]} ({formatCurrency(topCat[1], trip.currency)})</p>
                            )}
                            {/* Mini progress bar — share of total */}
                            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                                style={{ width: `${dailyExpTotal > 0 ? Math.min((pd.total / dailyExpTotal) * 100, 100) : 0}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {unassigned.count > 0 && (
                      <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-3 text-sm">
                        <span>⚠️</span>
                        <span className="text-amber-700">
                          {unassigned.count} expense{unassigned.count !== 1 ? 's' : ''} ({formatCurrency(unassigned.total, trip.currency)}) not assigned to anyone
                        </span>
                      </div>
                    )}
                    {/* Equal share info */}
                    <div className="flex items-center gap-2 rounded-xl bg-cyan-50 p-3 text-sm text-cyan-700">
                      <span>💡</span>
                      <span>Equal share per person: <strong>{formatCurrency(equalShare, trip.currency)}</strong></span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Expense List by Date */}
            {expensesByDate.length > 0 ? (
              <div className="space-y-4">
                {expensesByDate.map(([dateStr, exps]) => (
                  <div key={dateStr} className="rounded-2xl border border-slate-100 bg-white shadow-card overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-50 bg-slate-50/50 px-5 py-3">
                      <span className="text-sm font-bold text-slate-700">
                        {new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      <span className="text-sm font-semibold text-slate-500">
                        {formatCurrency(exps.reduce((s, e) => s + e.amount, 0), trip.currency)}
                      </span>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {exps.map((exp) => (
                        <div key={exp._id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/50 transition">
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg text-lg"
                            style={{ backgroundColor: `${CATEGORY_COLORS[exp.category]}15` }}>
                            {CATEGORY_ICONS[exp.category]}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-800">{exp.description}</p>
                            <p className="text-xs text-slate-400">
                              {exp.category} • {PAYMENT_METHODS.find((m) => m.value === exp.paymentMethod)?.label || exp.paymentMethod}
                              {exp.paidBy && <span className="ml-1 inline-flex items-center rounded-full bg-cyan-50 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-700">👤 {exp.paidBy}</span>}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-slate-900">{formatCurrency(exp.amount, trip.currency)}</span>
                          <button
                            onClick={() => handleRemoveExpense(trip._id, exp._id)}
                            className="rounded-lg p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 transition"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                <span className="text-4xl">💳</span>
                <h3 className="mt-3 text-lg font-semibold text-slate-700">No expenses logged yet</h3>
                <p className="mt-1 text-sm text-slate-500">Start logging your daily expenses to track your spending.</p>
              </div>
            )}
          </div>
        )}

        {/* ────── Checklist Tab ────── */}
        {activeTab === 'checklist' && (
          <div className="space-y-4 animate-page-enter">
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-card">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-slate-900">Trip Checklist</h3>
                {checklist.length > 0 && (
                  <span className="text-sm text-slate-500">
                    {checkDone}/{checklist.length} done
                  </span>
                )}
              </div>

              {/* Progress */}
              {checklist.length > 0 && (
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${(checkDone / checklist.length) * 100}%` }}
                  />
                </div>
              )}

              {/* Add item */}
              <div className="mt-4 flex gap-2">
                <input
                  value={newCheckItem}
                  onChange={(e) => setNewCheckItem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCheckItem(trip._id)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus-ring"
                  placeholder="Add task... (e.g., Book flights, Pack sunscreen)"
                />
                <button
                  onClick={() => handleAddCheckItem(trip._id)}
                  className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Add
                </button>
              </div>

              {/* Items */}
              {checklist.length > 0 ? (
                <div className="mt-4 space-y-1.5">
                  {checklist.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                        item.checked ? 'bg-emerald-50/50' : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <button
                        onClick={() => handleToggleCheck(trip._id, idx)}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition ${
                          item.checked
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-slate-300 hover:border-emerald-400'
                        }`}
                      >
                        {item.checked && (
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <span className={`flex-1 text-sm ${item.checked ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                        {item.text}
                      </span>
                      <button
                        onClick={() => handleRemoveCheckItem(trip._id, idx)}
                        className="rounded-lg p-1 text-slate-300 hover:text-red-500 transition"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-6 text-center text-sm text-slate-400 italic">
                  No checklist items yet. Add tasks to stay organized!
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    ) : (
    // ─── List View ────────────────────────────────────────────────────
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 animate-page-enter">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">Budget My Plan</h1>
          <p className="mt-1 text-sm text-slate-600">
            Create, budget, and track your custom travel plans
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-card transition hover:bg-slate-50 hover:shadow-card-hover"
          >
            📋 Templates
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:shadow-xl hover:scale-105"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Trip
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      {trips.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Trips</p>
            <p className="mt-1 font-display text-2xl font-bold text-slate-900">{trips.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Active</p>
            <p className="mt-1 font-display text-2xl font-bold text-blue-600">
              {trips.filter((t) => t.status === 'PLANNING' || t.status === 'CONFIRMED').length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Budgeted</p>
            <p className="mt-1 font-display text-2xl font-bold text-slate-900">
              {formatCurrency(trips.reduce((s, t) => s + (t.totalBudget || 0), 0))}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Spent</p>
            <p className="mt-1 font-display text-2xl font-bold text-emerald-600">
              {formatCurrency(trips.reduce((s, t) => s + (t.totalActual || 0), 0))}
            </p>
          </div>
        </div>
      )}

      {/* Trip Cards */}
      {trips.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-16 text-center">
          <span className="text-5xl">🗺️</span>
          <h3 className="mt-4 text-lg font-bold text-slate-700">No custom trips yet</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
            Start planning your dream trip with a personalized budget tracker,
            daily expense log, and a handy checklist.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={openCreate}
              className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:shadow-xl"
            >
              Create Your First Trip
            </button>
            <button
              onClick={() => setShowTemplateModal(true)}
              className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Start from Template
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => {
            const totalPlanned = trip.totalBudget || 0;
            const totalActual = trip.totalActual || 0;
            const pct = totalPlanned > 0 ? Math.min(Math.round((totalActual / totalPlanned) * 100), 100) : 0;
            const catSummary = getCategorySummary(trip.budgetItems);
            const days = daysBetween(trip.startDate, trip.endDate);

            return (
              <div
                key={trip._id}
                className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 cursor-pointer"
                onClick={() => { setSelectedTrip(trip); setActiveTab('overview'); }}
              >
                {/* Card Header */}
                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-lg font-bold text-slate-900 truncate">{trip.title}</h3>
                      {trip.destinations.length > 0 && (
                        <p className="mt-1 text-sm text-slate-500 truncate">
                          📍 {trip.destinations.join(' → ')}
                        </p>
                      )}
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold uppercase ring-1 ${STATUS_COLORS[trip.status]}`}>
                      {trip.status}
                    </span>
                  </div>

                  {/* Meta */}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {trip.startDate && (
                      <span className="inline-flex items-center gap-1">
                        📅 {formatShortDate(trip.startDate)}
                        {trip.endDate ? ` – ${formatShortDate(trip.endDate)}` : ''}
                        {days > 0 && <span className="text-slate-400">({days}d)</span>}
                      </span>
                    )}
                    <span>👥 {trip.travelers}{trip.travelerNames && trip.travelerNames.length > 0 && (
                      <span className="ml-1 text-xs text-slate-400">({trip.travelerNames.join(', ')})</span>
                    )}</span>
                    {(trip.dailyExpenses || []).length > 0 && (
                      <span className="text-cyan-600 font-medium">
                        💳 {(trip.dailyExpenses || []).length} expense{(trip.dailyExpenses || []).length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Budget Summary */}
                  <div className="mt-4 rounded-xl bg-gradient-to-r from-slate-50 to-cyan-50 p-3.5">
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-xs font-medium text-slate-400">Planned</span>
                        <p className="font-display text-lg font-bold text-slate-900">{formatCurrency(totalPlanned)}</p>
                      </div>
                      {totalActual > 0 && (
                        <div className="text-right">
                          <span className="text-xs font-medium text-slate-400">Spent</span>
                          <p className={`text-sm font-bold ${totalActual > totalPlanned ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {formatCurrency(totalActual)}
                          </p>
                        </div>
                      )}
                    </div>
                    {totalActual > 0 && totalPlanned > 0 && (
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            pct > 80 ? 'bg-rose-500' : pct > 50 ? 'bg-amber-500' : 'bg-teal-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                    {catSummary.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {catSummary.slice(0, 3).map(([cat, amt]) => (
                          <span key={cat} className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-xs text-slate-600 shadow-sm">
                            {CATEGORY_ICONS[cat]} {formatCurrency(amt)}
                          </span>
                        ))}
                        {catSummary.length > 3 && (
                          <span className="rounded-md bg-white px-2 py-0.5 text-xs text-slate-400 shadow-sm">
                            +{catSummary.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                  <span className="text-xs font-semibold text-cyan-600">
                    View Details →
                  </span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleDuplicate(trip)}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                      title="Duplicate"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
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
                      onClick={() => handleShare(trip)}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                      title="Share"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
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

                {/* Delete Confirm */}
                {deleteConfirm === trip._id && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/95 backdrop-blur-sm animate-page-enter"
                    onClick={(e) => e.stopPropagation()}>
                    <div className="text-center p-6">
                      <p className="text-sm font-bold text-slate-900">Delete this trip?</p>
                      <p className="mt-1 text-xs text-slate-500">This action cannot be undone.</p>
                      <div className="mt-4 flex justify-center gap-3">
                        <button onClick={() => setDeleteConfirm(null)} className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                          Cancel
                        </button>
                        <button onClick={() => handleDelete(trip._id)} className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
    )}

    {/* ─── Create / Edit Modal ─────────────────────────────────────── */}
    <Modal isOpen={showModal} onClose={closeModal} title={editingTrip ? 'Edit Trip' : 'Plan a New Trip'} size="lg">
        <form onSubmit={handleSave} className="space-y-5">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Trip Name *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus-ring"
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
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus-ring"
                  placeholder={`Destination ${i + 1}`}
                />
                {form.destinations.length > 1 && (
                  <button type="button" onClick={() => removeDestination(i)}
                    className="rounded-lg p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 transition">
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addDestination}
              className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 transition">
              + Add another destination
            </button>
          </div>

          {/* Dates, Travelers, Budget Limit */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Start Date</label>
              <input type="date" value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus-ring" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">End Date</label>
              <input type="date" value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus-ring" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Travelers</label>
              <input type="number" min="1" value={form.travelers}
                onChange={(e) => {
                  const num = Math.max(1, parseInt(e.target.value) || 1);
                  const names = [...(form.travelerNames || [])];
                  // Auto-adjust travelerNames array length
                  while (names.length < num) names.push('');
                  while (names.length > num) names.pop();
                  setForm({ ...form, travelers: num, travelerNames: names });
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus-ring" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Budget Limit</label>
              <input type="number" min="0" value={form.budgetLimit || ''}
                onChange={(e) => setForm({ ...form, budgetLimit: Number(e.target.value) || 0 })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus-ring"
                placeholder="₹ Max budget" />
            </div>
          </div>

          {/* Traveler Names (shown when travelers > 1) */}
          {form.travelers > 1 && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                👥 Traveler Names <span className="text-xs font-normal text-slate-400">(for expense tracking)</span>
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: form.travelers }, (_, i) => (
                  <input
                    key={i}
                    value={(form.travelerNames || [])[i] || ''}
                    onChange={(e) => {
                      const names = [...(form.travelerNames || [])];
                      while (names.length <= i) names.push('');
                      names[i] = e.target.value;
                      setForm({ ...form, travelerNames: names });
                    }}
                    className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus-ring"
                    placeholder={`Traveler ${i + 1} name`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Budget Limit Warning */}
          {form.budgetLimit > 0 && formTotal > form.budgetLimit && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
              <span>⚠️</span>
              <span>Your items total ({formatCurrency(formTotal)}) exceeds your budget limit ({formatCurrency(form.budgetLimit)})</span>
            </div>
          )}

          {/* Budget Items */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Budget Items</label>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              {/* Add budget item */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[140px_1fr_120px_auto]">
                <select value={budgetCategory} onChange={(e) => setBudgetCategory(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus-ring">
                  {BUDGET_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{CATEGORY_ICONS[cat]} {cat}</option>
                  ))}
                </select>
                <input value={budgetDesc} onChange={(e) => setBudgetDesc(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus-ring" placeholder="Description" />
                <input type="number" min="0" value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus-ring" placeholder="₹ Amount" />
                <button type="button" onClick={addBudgetItem}
                  className="rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700">
                  Add
                </button>
              </div>

              {/* Items list */}
              {form.budgetItems.length > 0 && (
                <div className="space-y-1.5">
                  {form.budgetItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-xl bg-white px-4 py-2.5 shadow-card">
                      <span className="flex items-center gap-2 text-sm text-slate-700">
                        <span>{CATEGORY_ICONS[item.category]}</span>
                        <span className="font-medium">{item.description}</span>
                        <span className="text-xs text-slate-400">({item.category})</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{formatCurrency(item.amount)}</span>
                        <button type="button" onClick={() => removeBudgetItem(idx)}
                          className="rounded p-1 text-slate-400 hover:text-red-500 transition">
                          ✕
                        </button>
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-3 text-sm font-bold text-slate-900">
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
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus-ring"
              placeholder="Packing list, reminders, links..." />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} disabled={saving}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:shadow-xl disabled:opacity-60">
              {saving ? 'Saving...' : editingTrip ? 'Update Trip' : 'Create Trip'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Templates Modal ─────────────────────────────────────────── */}
      <Modal isOpen={showTemplateModal} onClose={() => setShowTemplateModal(false)} title="Start from a Template" size="lg">
        <p className="mb-4 text-sm text-slate-500">
          Choose a pre-built budget template to get started quickly. You can customize everything after.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => applyTemplate(tpl)}
              className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-cyan-300 hover:bg-cyan-50/50 hover:shadow-card"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 text-2xl shadow-sm group-hover:scale-110 transition">
                {tpl.icon}
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="font-display text-sm font-bold text-slate-800">{tpl.title}</h4>
                <p className="mt-0.5 text-xs text-slate-500">{tpl.description}</p>
                <p className="mt-2 text-xs font-semibold text-cyan-600">
                  {tpl.budgetItems.length} items • {formatCurrency(tpl.budgetItems.reduce((s, b) => s + b.amount, 0))} total
                </p>
              </div>
            </button>
          ))}
        </div>
      </Modal>

      {/* ─── Share Modal ─────────────────────────────────────────────── */}
      <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)} title="Share Budget Plan">
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <pre className="whitespace-pre-wrap text-sm text-slate-700 font-mono leading-relaxed">
              {shareText}
            </pre>
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyShareText}
              className="flex-1 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:shadow-xl"
            >
              📋 Copy to Clipboard
            </button>
            <button
              onClick={() => setShowShareModal(false)}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
