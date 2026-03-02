import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import Modal from '../components/Modal';
import Loading from '../components/Loading';
import SplitBills from '../components/SplitBills';
import BudgetOptimizer from '../components/BudgetOptimizer';
import CollaborativeShare from '../components/CollaborativeShare';

/* ═══════════════════════════════════════════════════════════════════════
   Constants & helpers
   ═══════════════════════════════════════════════════════════════════════ */
const BUDGET_CATEGORIES = ['Transport', 'Accommodation', 'Food', 'Activities', 'Shopping', 'Insurance', 'Visa', 'Other'];

const CATEGORY_ICONS = {
  Transport: '🚆', Accommodation: '🏨', Food: '🍽️', Activities: '🎯',
  Shopping: '🛍️', Insurance: '🛡️', Visa: '📋', Other: '📦'
};

const CATEGORY_COLORS = {
  Transport: '#0ea5e9', Accommodation: '#8b5cf6', Food: '#f59e0b',
  Activities: '#10b981', Shopping: '#ec4899', Insurance: '#6366f1',
  Visa: '#14b8a6', Other: '#64748b'
};

const STATUS_COLORS = {
  PLANNING: 'bg-blue-50 text-blue-700 ring-blue-200/60',
  CONFIRMED: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60',
  COMPLETED: 'bg-slate-100 text-slate-600 ring-slate-200/60',
  CANCELLED: 'bg-red-50 text-red-700 ring-red-200/60'
};

const PAYMENT_METHODS = [
  { value: 'upi', label: 'UPI' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'other', label: 'Other' }
];

const TABS = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'budget', label: 'Budget', icon: '💰' },
  { key: 'expenses', label: 'Expenses', icon: '💳' },
  { key: 'checklist', label: 'Checklist', icon: '✅' },
  { key: 'splits', label: 'Split Bills', icon: '💸' },
  { key: 'collaborate', label: 'Collaborate', icon: '🤝' }
];

function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency, maximumFractionDigits: 0
  }).format(Number(amount || 0));
}

function formatShortDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function daysBetween(a, b) {
  if (!a || !b) return 0;
  return Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000));
}

/* ─── Donut Chart (CSS conic-gradient) ─────────────────────────────── */
function DonutChart({ data, size = 140, thickness = 22 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total <= 0) return null;
  let cumulative = 0;
  const segments = data.map((d) => {
    const start = cumulative;
    cumulative += (d.value / total) * 360;
    return `${d.color} ${start}deg ${cumulative}deg`;
  });
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full" style={{
        background: `conic-gradient(${segments.join(', ')})`,
      }} />
      <div className="absolute rounded-full bg-white" style={{
        inset: thickness, boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.06)'
      }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-lg font-bold text-slate-900">{formatCurrency(total)}</span>
        <span className="text-[10px] text-slate-400">Total</span>
      </div>
    </div>
  );
}

/* ─── Budget Progress Bar ──────────────────────────────────────────── */
function BudgetProgressBar({ spent, total, className = '' }) {
  if (total <= 0) return null;
  const pct = Math.min((spent / total) * 100, 100);
  const isOver = spent > total;
  return (
    <div className={className}>
      <div className="flex items-end justify-between text-xs text-slate-500 mb-1.5">
        <span>Spent {formatCurrency(spent)}</span>
        <span>{formatCurrency(total)}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all duration-700 ${
          isOver ? 'bg-gradient-to-r from-rose-400 to-rose-500' : pct > 80 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-cyan-400 to-blue-500'
        }`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════════════ */
export default function PlanTrip() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useContext(AuthContext);

  /* ─── State ─────────────────────────────────────────────────────── */
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [templates, setTemplates] = useState([]);

  // Modals
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
    travelers: 1, travelerNames: [], budgetItems: [], notes: '',
    budgetLimit: 0, currency: 'INR', tags: [], checklist: []
  };
  const [form, setForm] = useState({ ...emptyForm });

  // Budget item form
  const [budgetCategory, setBudgetCategory] = useState('Transport');
  const [budgetDesc, setBudgetDesc] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');

  // Expense form
  const [expForm, setExpForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: 'Food', description: '', amount: '', paymentMethod: 'upi', paidBy: '',
    splitType: 'equal'
  });
  const [addingExpense, setAddingExpense] = useState(false);

  // Editing expense
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editExpForm, setEditExpForm] = useState({
    date: '', category: 'Food', description: '', amount: '', paymentMethod: 'upi', paidBy: '',
    splitType: 'equal'
  });

  // Checklist
  const [newCheckItem, setNewCheckItem] = useState('');

  // Share
  const [shareText, setShareText] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

  // Budget Optimizer
  const [showOptimizer, setShowOptimizer] = useState(false);

  /* ─── Computed values (above conditional returns) ────────────────── */
  const trip = selectedTrip;
  const totalPlanned = trip?.totalBudget || 0;
  const budgetSpent = trip?.budgetItems?.reduce((s, b) => s + (b.actualAmount || 0), 0) || 0;
  const dailyExpTotal = trip?.dailyExpenses?.reduce((s, e) => s + e.amount, 0) || 0;
  const totalActual = trip?.totalActual || 0;
  // Check if current user is the trip owner (vs. collaborator)
  const isTripOwner = trip ? (trip.userId === user?._id || trip.userId?._id === user?._id) : true;

  const categorySummary = useMemo(() => {
    if (!trip?.dailyExpenses?.length) return [];
    const map = {};
    trip.dailyExpenses.forEach((e) => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [trip?.dailyExpenses]);

  const expensesByDate = useMemo(() => {
    if (!trip?.dailyExpenses?.length) return [];
    const map = {};
    trip.dailyExpenses.forEach((e) => {
      const key = new Date(e.date).toISOString().slice(0, 10);
      (map[key] = map[key] || []).push(e);
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [trip?.dailyExpenses]);

  const insights = useMemo(() => {
    if (!trip) return [];
    const list = [];
    if (totalPlanned > 0 && totalActual > totalPlanned) {
      list.push({ icon: '🔴', text: `Over budget by ${formatCurrency(totalActual - totalPlanned, trip.currency)}`, type: 'danger' });
    } else if (totalPlanned > 0 && totalActual > totalPlanned * 0.8) {
      list.push({ icon: '🟡', text: `${Math.round((totalActual / totalPlanned) * 100)}% of budget used`, type: 'warning' });
    } else if (totalPlanned > 0) {
      list.push({ icon: '🟢', text: `${formatCurrency(totalPlanned - totalActual, trip.currency)} remaining`, type: 'success' });
    }
    if (trip.travelers > 1 && totalPlanned > 0) {
      list.push({ icon: '👥', text: `Per person: ${formatCurrency(totalPlanned / trip.travelers, trip.currency)}`, type: 'info' });
    }
    if (trip.dailyExpenses?.length > 0) {
      const avg = dailyExpTotal / trip.dailyExpenses.length;
      list.push({ icon: '📈', text: `Avg expense: ${formatCurrency(avg, trip.currency)}`, type: 'info' });
    }
    return list;
  }, [trip, totalPlanned, totalActual, dailyExpTotal]);

  const checklist = trip?.checklist || [];
  const checkDone = checklist.filter((c) => c.checked).length;
  const isLocked = trip?.status === 'COMPLETED' || trip?.status === 'CANCELLED';

  /* ─── Data Loading ─────────────────────────────────────────────── */
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

  /* ─── Trip CRUD ────────────────────────────────────────────────── */
  function openNew() {
    setEditingTrip(null);
    setForm({ ...emptyForm });
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

  /* Destinations */
  function setDestination(index, value) {
    const updated = [...form.destinations];
    updated[index] = value;
    setForm({ ...form, destinations: updated });
  }
  function addDestination() { setForm({ ...form, destinations: [...form.destinations, ''] }); }
  function removeDestination(index) {
    const updated = form.destinations.filter((_, i) => i !== index);
    setForm({ ...form, destinations: updated.length ? updated : [''] });
  }

  /* Budget items */
  function addBudgetItem() {
    if (!budgetDesc.trim() || !budgetAmount || Number(budgetAmount) <= 0) {
      showToast('Enter a valid description and amount', 'warning');
      return;
    }
    setForm({ ...form, budgetItems: [...form.budgetItems, {
      category: budgetCategory, description: budgetDesc.trim(),
      amount: Number(budgetAmount), actualAmount: 0, isPaid: false
    }] });
    setBudgetDesc('');
    setBudgetAmount('');
  }
  function removeBudgetItem(index) {
    setForm({ ...form, budgetItems: form.budgetItems.filter((_, i) => i !== index) });
  }

  const formTotal = form.budgetItems.reduce((s, b) => s + b.amount, 0);

  async function handleSave(e) {
    e.preventDefault();
    if (!form.title.trim()) { showToast('Trip title is required', 'warning'); return; }

    const payload = {
      title: form.title.trim(),
      destinations: form.destinations.filter((d) => d.trim()),
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      travelers: form.travelers,
      travelerNames: (form.travelerNames || []).filter((n) => n.trim()),
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
        await apiFetch(`/api/custom-trips/${editingTrip._id}`, { method: 'PUT', body: JSON.stringify(payload) });
        showToast('Trip updated', 'success');
      } else {
        await apiFetch('/api/custom-trips', { method: 'POST', body: JSON.stringify(payload) });
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
      showToast(err.message || 'Failed to delete trip', 'error');
    }
  }

  async function handleStatusChange(trip, status) {
    try {
      const result = await apiFetch(`/api/custom-trips/${trip._id}`, {
        method: 'PUT', body: JSON.stringify({ status })
      });
      setSelectedTrip(result.trip);
      setTrips((prev) => prev.map((t) => t._id === trip._id ? result.trip : t));
      showToast(`Trip marked as ${status.toLowerCase()}`, 'success');
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

  async function handleShare(trip) {
    try {
      const data = await apiFetch(`/api/custom-trips/${trip._id}/summary`);
      setShareText(data.summary || '');
      setShowShareModal(true);
    } catch (err) {
      showToast(err.message || 'Failed to generate summary', 'error');
    }
  }

  /* ─── Budget Optimizer Handler ─────────────────────────────────── */
  function handleOptimizerApply(optimizedData) {
    setForm({
      ...emptyForm,
      title: optimizedData.title || '',
      destinations: optimizedData.destination ? [optimizedData.destination] : [''],
      travelers: optimizedData.travelers || 1,
      travelerNames: [],
      budgetItems: (optimizedData.budgetItems || []).map((b) => ({
        category: b.category, description: b.description || b.category,
        amount: b.amount, actualAmount: 0, isPaid: false
      })),
      budgetLimit: optimizedData.totalBudget || 0,
    });
    setEditingTrip(null);
    setShowModal(true);
    showToast('Budget applied! Review and save your trip.', 'success');
  }

  /* ─── Collaborative Trip Update Handler ─────────────────────────── */
  function handleTripUpdate(updatedTrip) {
    setSelectedTrip(updatedTrip);
    setTrips((prev) => prev.map((t) => t._id === updatedTrip._id ? updatedTrip : t));
  }

  /* ─── Expense Handlers ─────────────────────────────────────────── */
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
          date: expForm.date, category: expForm.category,
          description: expForm.description.trim(), amount: Number(expForm.amount),
          paymentMethod: expForm.paymentMethod, paidBy: expForm.paidBy,
          splitType: expForm.splitType || 'equal'
        })
      });
      setSelectedTrip(result.trip);
      setTrips((prev) => prev.map((t) => t._id === tripId ? result.trip : t));
      setExpForm({ ...expForm, description: '', amount: '', splitType: 'equal' });
      showToast('Expense added', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to add expense', 'error');
    } finally {
      setAddingExpense(false);
    }
  }

  async function handleRemoveExpense(tripId, expenseId) {
    try {
      const result = await apiFetch(`/api/custom-trips/${tripId}/expenses/${expenseId}`, { method: 'DELETE' });
      setSelectedTrip(result.trip);
      setTrips((prev) => prev.map((t) => t._id === tripId ? result.trip : t));
      showToast('Expense removed', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to remove expense', 'error');
    }
  }

  function startEditExpense(exp) {
    setEditingExpenseId(exp._id);
    setEditExpForm({
      date: exp.date ? new Date(exp.date).toISOString().slice(0, 10) : '',
      category: exp.category, description: exp.description,
      amount: exp.amount, paymentMethod: exp.paymentMethod || 'cash',
      paidBy: exp.paidBy || '', splitType: exp.splitType || 'equal'
    });
  }
  function cancelEditExpense() { setEditingExpenseId(null); }

  async function handleUpdateExpense(tripId, expenseId) {
    if (!editExpForm.description.trim() || !editExpForm.amount || Number(editExpForm.amount) <= 0) {
      showToast('Enter description and valid amount', 'warning');
      return;
    }
    try {
      const result = await apiFetch(`/api/custom-trips/${tripId}/expenses/${expenseId}`, {
        method: 'PUT',
        body: JSON.stringify({
          date: editExpForm.date, category: editExpForm.category,
          description: editExpForm.description.trim(), amount: Number(editExpForm.amount),
          paymentMethod: editExpForm.paymentMethod, paidBy: editExpForm.paidBy,
          splitType: editExpForm.splitType || 'equal'
        })
      });
      setSelectedTrip(result.trip);
      setTrips((prev) => prev.map((t) => t._id === tripId ? result.trip : t));
      setEditingExpenseId(null);
      showToast('Expense updated', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update expense', 'error');
    }
  }

  /* ─── Checklist Handlers ───────────────────────────────────────── */
  async function handleAddCheckItem(tripId) {
    if (!newCheckItem.trim()) return;
    const tr = trips.find((t) => t._id === tripId) || selectedTrip;
    if (!tr) return;
    const updated = [...(tr.checklist || []), { text: newCheckItem.trim(), checked: false }];
    try {
      const result = await apiFetch(`/api/custom-trips/${tripId}`, {
        method: 'PUT', body: JSON.stringify({ checklist: updated })
      });
      setSelectedTrip(result.trip);
      setTrips((prev) => prev.map((t) => t._id === tripId ? result.trip : t));
      setNewCheckItem('');
    } catch (err) {
      showToast(err.message || 'Failed to add item', 'error');
    }
  }

  async function handleToggleCheck(tripId, index) {
    const tr = trips.find((t) => t._id === tripId) || selectedTrip;
    if (!tr) return;
    const updated = (tr.checklist || []).map((c, i) => i === index ? { ...c, checked: !c.checked } : { ...c });
    try {
      const result = await apiFetch(`/api/custom-trips/${tripId}`, {
        method: 'PUT', body: JSON.stringify({ checklist: updated })
      });
      setSelectedTrip(result.trip);
      setTrips((prev) => prev.map((t) => t._id === tripId ? result.trip : t));
    } catch { /* silent */ }
  }

  async function handleRemoveCheckItem(tripId, index) {
    const tr = trips.find((t) => t._id === tripId) || selectedTrip;
    if (!tr) return;
    const updated = (tr.checklist || []).filter((_, i) => i !== index);
    try {
      const result = await apiFetch(`/api/custom-trips/${tripId}`, {
        method: 'PUT', body: JSON.stringify({ checklist: updated })
      });
      setSelectedTrip(result.trip);
      setTrips((prev) => prev.map((t) => t._id === tripId ? result.trip : t));
    } catch (err) {
      showToast(err.message || 'Failed to remove item', 'error');
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
     LOADING
     ═══════════════════════════════════════════════════════════════════ */
  if (loading) return <Loading />;

  /* ═══════════════════════════════════════════════════════════════════
     RENDER — selectedTrip ? DETAIL : LIST
     ═══════════════════════════════════════════════════════════════════ */
  return (
    <>
      {selectedTrip ? (
        /* ═══════════════════════════════════════════════════════════════
           DETAIL VIEW
           ═══════════════════════════════════════════════════════════════ */
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 animate-page-enter">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">

            {/* ── Detail Header ────────────────────────────────────── */}
            <div className="relative mb-6">
              {/* Decorative gradient stripe */}
              <div className="absolute -inset-x-4 -top-6 h-40 rounded-b-[2rem] bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 opacity-[0.07]" />

              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <button onClick={() => { setSelectedTrip(null); setActiveTab('overview'); }}
                    className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80 text-slate-500 shadow-card ring-1 ring-slate-200/60 backdrop-blur transition hover:bg-white hover:text-slate-700 hover:shadow-md">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <div className="min-w-0">
                    <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{trip.title}</h1>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                      {trip.destinations.length > 0 && (
                        <span className="inline-flex items-center gap-1">📍 {trip.destinations.join(' → ')}</span>
                      )}
                      {trip.startDate && (
                        <span className="inline-flex items-center gap-1">📅 {formatShortDate(trip.startDate)}{trip.endDate ? ` – ${formatShortDate(trip.endDate)}` : ''}</span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        👥 {trip.travelers}
                        {trip.travelerNames?.length > 0 && (
                          <span className="text-xs text-slate-400">({trip.travelerNames.join(', ')})</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                  <span className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ring-1 ${STATUS_COLORS[trip.status]}`}>
                    {trip.status}
                  </span>
                  {!isTripOwner && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-600 ring-1 ring-purple-200">
                      🤝 Collaborator
                    </span>
                  )}
                  {isTripOwner && (
                    <>
                      <button onClick={() => openEdit(trip)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-card ring-1 ring-slate-200/60 transition hover:bg-slate-50 hover:shadow-md">
                        ✏️ Edit
                      </button>
                      <button onClick={() => handleShare(trip)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-card ring-1 ring-slate-200/60 transition hover:bg-slate-50 hover:shadow-md">
                        📤 Share
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Status actions (owner only) */}
              {isTripOwner && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {trip.status === 'PLANNING' && (
                  <button onClick={() => handleStatusChange(trip, 'CONFIRMED')}
                    className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200/60 transition hover:bg-emerald-100">
                    ✓ Confirm Trip
                  </button>
                )}
                {trip.status === 'CONFIRMED' && (
                  <button onClick={() => handleStatusChange(trip, 'COMPLETED')}
                    className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200/60 transition hover:bg-slate-100">
                    ✓ Mark Completed
                  </button>
                )}
                {(trip.status === 'PLANNING' || trip.status === 'CONFIRMED') && (
                  <button onClick={() => handleStatusChange(trip, 'CANCELLED')}
                    className="rounded-lg px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50">
                    ✕ Cancel
                  </button>
                )}
              </div>
              )}
            </div>

            {/* ── Tabs ─────────────────────────────────────────────── */}
            <div className="mb-6 flex gap-1 rounded-2xl bg-slate-100/80 p-1.5 backdrop-blur">
              {TABS.filter((tab) => tab.key !== 'collaborate' || isTripOwner).map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    activeTab === tab.key
                      ? 'bg-white text-slate-900 shadow-card ring-1 ring-slate-200/40'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  <span className="text-base">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* ════════════ Overview Tab ════════════ */}
            {activeTab === 'overview' && (
              <div className="space-y-5 animate-page-enter">
                {/* Insights */}
                {insights.length > 0 && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {insights.map((ins, i) => (
                      <div key={i} className={`flex items-center gap-3 rounded-2xl p-4 ${
                        ins.type === 'danger' ? 'bg-rose-50 ring-1 ring-rose-100' :
                        ins.type === 'warning' ? 'bg-amber-50 ring-1 ring-amber-100' :
                        ins.type === 'success' ? 'bg-emerald-50 ring-1 ring-emerald-100' :
                        'bg-slate-50 ring-1 ring-slate-100'
                      }`}>
                        <span className="text-2xl">{ins.icon}</span>
                        <span className="text-sm font-medium text-slate-700">{ins.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Budget overview + donut */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  {/* Left — Progress */}
                  <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-card">
                    <h3 className="font-display text-base font-bold text-slate-900">Budget Progress</h3>
                    {totalPlanned > 0 ? (
                      <>
                        <BudgetProgressBar spent={totalActual} total={totalPlanned} className="mt-4" />
                        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Planned</p>
                            <p className="mt-0.5 font-display text-lg font-bold text-slate-900">{formatCurrency(totalPlanned, trip.currency)}</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Actual</p>
                            <p className="mt-0.5 font-display text-lg font-bold text-slate-900">{formatCurrency(totalActual, trip.currency)}</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Remaining</p>
                            <p className={`mt-0.5 font-display text-lg font-bold ${totalPlanned - totalActual >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {formatCurrency(Math.abs(totalPlanned - totalActual), trip.currency)}
                            </p>
                          </div>
                        </div>
                        {trip.travelers > 1 && (
                          <p className="mt-3 text-center text-xs text-slate-400">
                            {formatCurrency(totalPlanned / trip.travelers, trip.currency)} per person
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="mt-4 text-sm text-slate-400">No budget items yet. Add some in the Budget tab.</p>
                    )}
                  </div>

                  {/* Right — Donut */}
                  <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-card">
                    <h3 className="font-display text-base font-bold text-slate-900">Spending by Category</h3>
                    {categorySummary.length > 0 ? (
                      <div className="mt-4 flex flex-col items-center gap-4">
                        <DonutChart data={categorySummary.map(([cat, val]) => ({
                          value: val, color: CATEGORY_COLORS[cat] || '#94a3b8'
                        }))} />
                        <div className="flex flex-wrap justify-center gap-2">
                          {categorySummary.map(([cat, val]) => (
                            <span key={cat} className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200/60">
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
                              {CATEGORY_ICONS[cat]} {cat} {formatCurrency(val, trip.currency)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-slate-400">Log expenses to see your spending breakdown.</p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {trip.notes && (
                  <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-card">
                    <h3 className="font-display text-base font-bold text-slate-900 mb-2">📝 Notes</h3>
                    <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">{trip.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* ════════════ Budget Tab ════════════ */}
            {activeTab === 'budget' && (
              <div className="space-y-5 animate-page-enter">
                {totalPlanned > 0 && <BudgetProgressBar spent={totalActual} total={totalPlanned} />}

                {/* Budget items */}
                {trip.budgetItems.length > 0 ? (
                  <div className="rounded-2xl border border-slate-200/60 bg-white shadow-card overflow-hidden">
                    <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-base font-bold text-slate-900">Planned Budget Items</h3>
                        <span className="text-sm font-semibold text-slate-500">{formatCurrency(totalPlanned, trip.currency)}</span>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {trip.budgetItems.map((item, idx) => {
                        const pct = item.amount > 0 ? Math.round((item.actualAmount || 0) / item.amount * 100) : 0;
                        return (
                          <div key={idx} className="flex items-center gap-4 px-6 py-4 transition hover:bg-slate-50/40">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
                              style={{ backgroundColor: `${CATEGORY_COLORS[item.category]}12` }}>
                              {CATEGORY_ICONS[item.category]}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-800">{item.description}</p>
                              <p className="text-xs text-slate-400">{item.category}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold text-slate-900">{formatCurrency(item.amount, trip.currency)}</p>
                              {item.actualAmount > 0 && (
                                <p className={`text-xs font-medium ${
                                  item.actualAmount > item.amount ? 'text-rose-500' : 'text-emerald-500'
                                }`}>
                                  Actual: {formatCurrency(item.actualAmount, trip.currency)} ({pct}%)
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
                    <span className="text-4xl">💰</span>
                    <h3 className="mt-3 text-lg font-semibold text-slate-700">No budget items yet</h3>
                    <p className="mt-1 text-sm text-slate-400">Edit your trip to add planned budget items.</p>
                  </div>
                )}

                {/* Actual vs Planned comparison */}
                {trip.budgetItems.filter((b) => b.actualAmount > 0).length > 0 && (
                  <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-card">
                    <h3 className="font-display text-base font-bold text-slate-900 mb-4">Actual vs Planned</h3>
                    <div className="space-y-3">
                      {trip.budgetItems.filter((b) => b.actualAmount > 0).map((item, idx) => {
                        const diff = item.amount - item.actualAmount;
                        return (
                          <div key={idx} className="flex items-center gap-4 rounded-xl bg-slate-50/80 p-3.5">
                            <span className="text-lg">{CATEGORY_ICONS[item.category]}</span>
                            <span className="min-w-0 flex-1 text-sm font-medium text-slate-700 truncate">{item.description}</span>
                            <div className="text-right text-xs shrink-0">
                              <span className="text-slate-400 line-through">{formatCurrency(item.amount)}</span>
                              <span className="ml-2 font-bold text-slate-900">{formatCurrency(item.actualAmount)}</span>
                            </div>
                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              diff >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
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

            {/* ════════════ Expenses Tab ════════════ */}
            {activeTab === 'expenses' && (
              <div className="space-y-5 animate-page-enter">
                {/* Locked notice */}
                {isLocked && (
                  <div className={`flex items-center gap-3 rounded-2xl p-4 text-sm font-medium ${
                    trip.status === 'COMPLETED'
                      ? 'bg-slate-50 border border-slate-200 text-slate-600'
                      : 'bg-red-50 border border-red-100 text-red-600'
                  }`}>
                    <span className="text-lg">{trip.status === 'COMPLETED' ? '✅' : '🚫'}</span>
                    <span>This trip is <strong>{trip.status.toLowerCase()}</strong>. Expenses are locked.</span>
                  </div>
                )}

                {/* Add expense form */}
                {!isLocked && (
                  <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-card">
                    <h3 className="font-display text-base font-bold text-slate-900 mb-4">Log Expense</h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                      <input type="date" value={expForm.date}
                        onChange={(e) => setExpForm({ ...expForm, date: e.target.value })}
                        className="rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm transition focus:bg-white focus-ring" />
                      <select value={expForm.category}
                        onChange={(e) => setExpForm({ ...expForm, category: e.target.value })}
                        className="rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm transition focus:bg-white focus-ring">
                        {BUDGET_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{CATEGORY_ICONS[cat]} {cat}</option>
                        ))}
                      </select>
                      <input value={expForm.description}
                        onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                        className="rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm transition focus:bg-white focus-ring"
                        placeholder="What did you spend on?" />
                      <input type="number" min="0" value={expForm.amount}
                        onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })}
                        className="rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm transition focus:bg-white focus-ring"
                        placeholder="₹ Amount" />
                      <select value={expForm.paymentMethod}
                        onChange={(e) => setExpForm({ ...expForm, paymentMethod: e.target.value })}
                        className="rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm transition focus:bg-white focus-ring">
                        {PAYMENT_METHODS.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                      {trip.travelerNames?.length > 0 ? (
                        <select value={expForm.paidBy}
                          onChange={(e) => setExpForm({ ...expForm, paidBy: e.target.value })}
                          className="rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm transition focus:bg-white focus-ring">
                          <option value="">Who paid?</option>
                          {trip.travelerNames.map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                      ) : (
                        <button onClick={() => handleAddExpense(trip._id)} disabled={addingExpense}
                          className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-600/20 transition hover:shadow-xl hover:brightness-105 disabled:opacity-60">
                          {addingExpense ? '...' : '+ Add'}
                        </button>
                      )}
                    </div>
                    {trip.travelerNames?.length > 0 && (
                      <div className="mt-3 flex items-center justify-between gap-3">
                        {trip.travelerNames.length >= 2 && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500">Split:</span>
                            {[
                              { value: 'equal', label: '➗ Equal' },
                              { value: 'full', label: '👤 No Split (personal)' },
                            ].map((opt) => (
                              <button key={opt.value} type="button"
                                onClick={() => setExpForm({ ...expForm, splitType: opt.value })}
                                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                                  expForm.splitType === opt.value
                                    ? 'bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200'
                                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                }`}>
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}
                        <button onClick={() => handleAddExpense(trip._id)} disabled={addingExpense}
                          className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-600/20 transition hover:shadow-xl hover:brightness-105 disabled:opacity-60">
                          {addingExpense ? '...' : '+ Add Expense'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Expense summary cards */}
                {dailyExpTotal > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-4 text-white shadow-lg shadow-cyan-600/20">
                      <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80">Total Expenses</p>
                      <p className="mt-1 font-display text-xl font-bold">{formatCurrency(dailyExpTotal, trip.currency)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-card">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400"># Transactions</p>
                      <p className="mt-1 font-display text-xl font-bold text-slate-900">{(trip.dailyExpenses || []).length}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-card">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Avg / Txn</p>
                      <p className="mt-1 font-display text-xl font-bold text-slate-900">
                        {formatCurrency(dailyExpTotal / Math.max((trip.dailyExpenses || []).length, 1), trip.currency)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-card">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Budget Left</p>
                      <p className={`mt-1 font-display text-xl font-bold ${totalPlanned - totalActual >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatCurrency(Math.abs(totalPlanned - totalActual), trip.currency)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Per-person breakdown */}
                {trip.travelerNames?.length > 0 && (trip.dailyExpenses || []).length > 0 && (() => {
                  const pd = {};
                  trip.travelerNames.forEach((n) => { pd[n] = { total: 0, count: 0, cats: {} }; });
                  let unassigned = { total: 0, count: 0 };
                  (trip.dailyExpenses || []).forEach((e) => {
                    if (e.paidBy && pd[e.paidBy]) {
                      pd[e.paidBy].total += e.amount;
                      pd[e.paidBy].count++;
                      pd[e.paidBy].cats[e.category] = (pd[e.paidBy].cats[e.category] || 0) + e.amount;
                    } else { unassigned.total += e.amount; unassigned.count++; }
                  });
                  const eqShare = dailyExpTotal / trip.travelerNames.length;

                  return (
                    <div className="rounded-2xl border border-slate-200/60 bg-white shadow-card overflow-hidden">
                      <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                        <h3 className="font-display text-base font-bold text-slate-900">👥 Per-Person Breakdown</h3>
                      </div>
                      <div className="p-5 space-y-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {trip.travelerNames.map((name) => {
                            const p = pd[name];
                            const diff = p.total - eqShare;
                            const topCat = Object.entries(p.cats).sort((a, b) => b[1] - a[1])[0];
                            return (
                              <div key={name} className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50/80 to-white p-4 space-y-2.5 transition hover:shadow-card">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2.5">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white shadow-md">
                                      {name.charAt(0).toUpperCase()}
                                    </span>
                                    <span className="text-sm font-bold text-slate-800">{name}</span>
                                  </div>
                                  <span className="font-display text-lg font-bold text-slate-900">{formatCurrency(p.total, trip.currency)}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-400">{p.count} expense{p.count !== 1 ? 's' : ''}</span>
                                  <span className={`rounded-full px-2 py-0.5 font-bold ${
                                    diff > 0 ? 'bg-rose-50 text-rose-600' : diff < 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    {diff > 0 ? `↑ ${formatCurrency(diff, trip.currency)}` : diff < 0 ? `↓ ${formatCurrency(Math.abs(diff), trip.currency)}` : 'Average'}
                                  </span>
                                </div>
                                {topCat && <p className="text-[11px] text-slate-400">Top: {CATEGORY_ICONS[topCat[0]]} {topCat[0]} ({formatCurrency(topCat[1], trip.currency)})</p>}
                                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                                    style={{ width: `${dailyExpTotal > 0 ? Math.min((p.total / dailyExpTotal) * 100, 100) : 0}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {unassigned.count > 0 && (
                          <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-3.5 text-sm ring-1 ring-amber-100">
                            <span>⚠️</span>
                            <span className="text-amber-700">{unassigned.count} expense{unassigned.count !== 1 ? 's' : ''} ({formatCurrency(unassigned.total, trip.currency)}) not assigned</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 rounded-xl bg-cyan-50 p-3.5 text-sm text-cyan-700 ring-1 ring-cyan-100">
                          <span>💡</span>
                          <span>Equal share: <strong>{formatCurrency(eqShare, trip.currency)}</strong> per person</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Expense list by date */}
                {expensesByDate.length > 0 ? (
                  <div className="space-y-4">
                    {expensesByDate.map(([dateStr, exps]) => (
                      <div key={dateStr} className="rounded-2xl border border-slate-200/60 bg-white shadow-card overflow-hidden">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-3.5">
                          <span className="text-sm font-bold text-slate-700">
                            {new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </span>
                          <span className="text-sm font-semibold text-slate-500">
                            {formatCurrency(exps.reduce((s, e) => s + e.amount, 0), trip.currency)}
                          </span>
                        </div>
                        <div className="divide-y divide-slate-50">
                          {exps.map((exp) =>
                            editingExpenseId === exp._id && !isLocked ? (
                              /* Inline edit row */
                              <div key={exp._id} className="bg-cyan-50/30 px-6 py-4 space-y-3">
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                                  <input type="date" value={editExpForm.date}
                                    onChange={(e) => setEditExpForm({ ...editExpForm, date: e.target.value })}
                                    className="rounded-xl border border-cyan-200 bg-white px-3 py-2 text-sm focus-ring" />
                                  <select value={editExpForm.category}
                                    onChange={(e) => setEditExpForm({ ...editExpForm, category: e.target.value })}
                                    className="rounded-xl border border-cyan-200 bg-white px-3 py-2 text-sm focus-ring">
                                    {BUDGET_CATEGORIES.map((cat) => (
                                      <option key={cat} value={cat}>{CATEGORY_ICONS[cat]} {cat}</option>
                                    ))}
                                  </select>
                                  <input value={editExpForm.description}
                                    onChange={(e) => setEditExpForm({ ...editExpForm, description: e.target.value })}
                                    className="rounded-xl border border-cyan-200 bg-white px-3 py-2 text-sm focus-ring" placeholder="Description" />
                                  <input type="number" min="0" value={editExpForm.amount}
                                    onChange={(e) => setEditExpForm({ ...editExpForm, amount: e.target.value })}
                                    className="rounded-xl border border-cyan-200 bg-white px-3 py-2 text-sm focus-ring" placeholder="₹ Amount" />
                                  <select value={editExpForm.paymentMethod}
                                    onChange={(e) => setEditExpForm({ ...editExpForm, paymentMethod: e.target.value })}
                                    className="rounded-xl border border-cyan-200 bg-white px-3 py-2 text-sm focus-ring">
                                    {PAYMENT_METHODS.map((m) => (
                                      <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                  </select>
                                  {trip.travelerNames?.length > 0 && (
                                    <select value={editExpForm.paidBy}
                                      onChange={(e) => setEditExpForm({ ...editExpForm, paidBy: e.target.value })}
                                      className="rounded-xl border border-cyan-200 bg-white px-3 py-2 text-sm focus-ring">
                                      <option value="">Who paid?</option>
                                      {trip.travelerNames.map((n) => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                  )}
                                </div>
                                <div className="flex items-center justify-end gap-2">
                                  <button onClick={cancelEditExpense}
                                    className="rounded-lg px-4 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-slate-100">Cancel</button>
                                  <button onClick={() => handleUpdateExpense(trip._id, exp._id)}
                                    className="rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-1.5 text-xs font-bold text-white shadow transition hover:shadow-lg">Save</button>
                                </div>
                              </div>
                            ) : (
                              /* Normal display row */
                              <div key={exp._id} className="group flex items-center gap-3.5 px-6 py-3.5 transition hover:bg-slate-50/60">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                                  style={{ backgroundColor: `${CATEGORY_COLORS[exp.category]}12` }}>
                                  {CATEGORY_ICONS[exp.category]}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-slate-800">{exp.description}</p>
                                  <p className="text-xs text-slate-400">
                                    {exp.category} • {PAYMENT_METHODS.find((m) => m.value === exp.paymentMethod)?.label || exp.paymentMethod}
                                    {exp.paidBy && (
                                      <span className="ml-1.5 inline-flex items-center rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-cyan-700 ring-1 ring-cyan-100">
                                        👤 {exp.paidBy}
                                      </span>
                                    )}
                                    {exp.splitType && exp.splitType !== 'equal' && (
                                      <span className="ml-1.5 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-100">
                                        {exp.splitType === 'full' ? '👤 Full' : '✂️ Custom'}
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <span className="shrink-0 text-sm font-bold text-slate-900">{formatCurrency(exp.amount, trip.currency)}</span>
                                {!isLocked && (
                                  <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                                    <button onClick={() => startEditExpense(exp)}
                                      className="rounded-lg p-1.5 text-slate-300 transition hover:bg-cyan-50 hover:text-cyan-600" title="Edit">
                                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    </button>
                                    <button onClick={() => handleRemoveExpense(trip._id, exp._id)}
                                      className="rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-500" title="Delete">
                                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
                    <span className="text-4xl">💳</span>
                    <h3 className="mt-3 text-lg font-semibold text-slate-700">No expenses logged yet</h3>
                    <p className="mt-1 text-sm text-slate-400">Start logging daily expenses to track spending.</p>
                  </div>
                )}
              </div>
            )}

            {/* ════════════ Checklist Tab ════════════ */}
            {activeTab === 'checklist' && (
              <div className="space-y-5 animate-page-enter">
                <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-card">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base font-bold text-slate-900">Trip Checklist</h3>
                    {checklist.length > 0 && (
                      <span className="text-sm font-medium text-slate-400">{checkDone}/{checklist.length} done</span>
                    )}
                  </div>

                  {/* Progress */}
                  {checklist.length > 0 && (
                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                        style={{ width: `${(checkDone / checklist.length) * 100}%` }} />
                    </div>
                  )}

                  {/* Add item */}
                  <div className="mt-4 flex gap-2">
                    <input value={newCheckItem}
                      onChange={(e) => setNewCheckItem(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCheckItem(trip._id)}
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition focus:bg-white focus-ring"
                      placeholder="Add checklist item..." />
                    <button onClick={() => handleAddCheckItem(trip._id)}
                      className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:shadow-xl hover:brightness-105">
                      Add
                    </button>
                  </div>

                  {/* Items */}
                  {checklist.length > 0 ? (
                    <ul className="mt-4 space-y-1.5">
                      {checklist.map((item, idx) => (
                        <li key={idx} className={`group flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                          item.checked ? 'bg-emerald-50/60' : 'hover:bg-slate-50'
                        }`}>
                          <button onClick={() => handleToggleCheck(trip._id, idx)}
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition ${
                              item.checked
                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                : 'border-slate-300 hover:border-emerald-400'
                            }`}>
                            {item.checked && (
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <span className={`flex-1 text-sm transition ${item.checked ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}>
                            {item.text}
                          </span>
                          <button onClick={() => handleRemoveCheckItem(trip._id, idx)}
                            className="rounded-lg p-1 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:text-red-500 hover:bg-red-50">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="mt-6 text-center">
                      <span className="text-3xl">✅</span>
                      <p className="mt-2 text-sm text-slate-400">No items yet. Start adding your travel checklist!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ════════════ Split Bills Tab ════════════ */}
            {activeTab === 'splits' && (
              <SplitBills trip={trip} onUpdate={handleTripUpdate} />
            )}

            {/* ════════════ Collaborate Tab ════════════ */}
            {activeTab === 'collaborate' && (
              <div className="space-y-5 animate-page-enter">
                <CollaborativeShare trip={trip} onUpdate={handleTripUpdate} />
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════
           LIST VIEW
           ═══════════════════════════════════════════════════════════════ */
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 animate-page-enter">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

            {/* Hero header */}
            <div className="relative mb-8">
              <div className="absolute -inset-x-4 -top-8 h-48 rounded-b-[2.5rem] bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 opacity-[0.06]" />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700 ring-1 ring-cyan-100 mb-3">
                    💰 Budget Planner
                  </div>
                  <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                    Plan My Trip
                  </h1>
                  <p className="mt-2 text-base text-slate-500 max-w-md">
                    Create budgets, track expenses, and manage your travel spending — all in one place.
                  </p>
                </div>
                <div className="flex items-center gap-3 sm:shrink-0">
                  <button onClick={() => setShowOptimizer(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-600/25 transition hover:shadow-xl hover:brightness-105">
                    ✨ AI Optimizer
                  </button>
                  <button onClick={() => setShowTemplateModal(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-card transition hover:shadow-md hover:border-slate-300">
                    📋 Templates
                  </button>
                  <button onClick={openNew}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-600/25 transition hover:shadow-xl hover:brightness-105">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    New Trip
                  </button>
                </div>
              </div>
            </div>

            {/* Trip cards grid */}
            {trips.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {trips.map((trip) => {
                  const tb = trip.totalBudget || 0;
                  const ta = trip.totalActual || 0;
                  const pct = tb > 0 ? Math.min(Math.round((ta / tb) * 100), 100) : 0;
                  const days = daysBetween(trip.startDate, trip.endDate);
                  const catSummary = {};
                  (trip.dailyExpenses || []).forEach((e) => { catSummary[e.category] = (catSummary[e.category] || 0) + e.amount; });
                  const topCats = Object.entries(catSummary).sort((a, b) => b[1] - a[1]);

                  return (
                    <div key={trip._id}
                      onClick={() => { setSelectedTrip(trip); setActiveTab('overview'); }}
                      className="group cursor-pointer rounded-2xl border border-slate-200/60 bg-white shadow-card overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 hover:border-slate-300/60">
                      {/* Card gradient accent */}
                      <div className="h-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500" />

                      <div className="p-5 space-y-3.5">
                        {/* Title row */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-display text-base font-bold text-slate-900 truncate group-hover:text-cyan-700 transition-colors">
                                {trip.title}
                              </h3>
                              {trip.userId !== user?._id && (
                                <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-600 ring-1 ring-purple-200">
                                  🤝 Collab
                                </span>
                              )}
                            </div>
                            {trip.destinations.length > 0 && (
                              <p className="mt-0.5 text-xs text-slate-400 truncate">📍 {trip.destinations.join(' → ')}</p>
                            )}
                          </div>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ${STATUS_COLORS[trip.status]}`}>
                            {trip.status}
                          </span>
                        </div>

                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          {trip.startDate && (
                            <span className="inline-flex items-center gap-1">
                              📅 {formatShortDate(trip.startDate)}{trip.endDate ? ` – ${formatShortDate(trip.endDate)}` : ''}
                              {days > 0 && <span className="text-slate-300">({days}d)</span>}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            👥 {trip.travelers}
                            {trip.travelerNames?.length > 0 && (
                              <span className="text-slate-300">({trip.travelerNames.join(', ')})</span>
                            )}
                          </span>
                          {(trip.dailyExpenses || []).length > 0 && (
                            <span className="font-semibold text-cyan-600">💳 {(trip.dailyExpenses || []).length} expenses</span>
                          )}
                        </div>

                        {/* Budget bar */}
                        {tb > 0 && (
                          <div>
                            <div className="flex items-end justify-between text-[11px]">
                              <span className="font-medium text-slate-500">{formatCurrency(ta, trip.currency)} spent</span>
                              <span className="font-bold text-slate-700">{formatCurrency(tb, trip.currency)}</span>
                            </div>
                            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                              <div className={`h-full rounded-full transition-all duration-700 ${
                                ta > tb ? 'bg-gradient-to-r from-rose-400 to-rose-500'
                                : pct > 80 ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                                : 'bg-gradient-to-r from-cyan-400 to-blue-500'
                              }`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )}

                        {/* Category chips */}
                        {topCats.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {topCats.slice(0, 3).map(([cat, amt]) => (
                              <span key={cat} className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200/60">
                                {CATEGORY_ICONS[cat]} {formatCurrency(amt, trip.currency)}
                              </span>
                            ))}
                            {topCats.length > 3 && (
                              <span className="rounded-lg bg-slate-50 px-2 py-0.5 text-[11px] text-slate-400 ring-1 ring-slate-200/60">
                                +{topCats.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card footer */}
                      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 bg-slate-50/30">
                        <span className="text-xs font-bold text-cyan-600 group-hover:underline">View Details →</span>
                        {trip.userId === user?._id ? (
                        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => handleDuplicate(trip)} title="Duplicate"
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-600 hover:shadow-sm">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          </button>
                          <button onClick={() => openEdit(trip)} title="Edit"
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-600 hover:shadow-sm">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => handleShare(trip)} title="Share"
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-600 hover:shadow-sm">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                          </button>
                          <button onClick={() => setDeleteConfirm(trip._id)} title="Delete"
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                        ) : (
                          <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">Collaborator</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty state */
              <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white/60 p-16 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50 ring-1 ring-cyan-100">
                  <span className="text-4xl">✈️</span>
                </div>
                <h2 className="mt-5 font-display text-xl font-bold text-slate-900">No trips planned yet</h2>
                <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
                  Start by creating a new trip or use one of our pre-built budget templates.
                </p>
                <div className="mt-6 flex items-center justify-center gap-3">
                  <button onClick={() => setShowTemplateModal(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-card transition hover:shadow-md">
                    📋 Use Template
                  </button>
                  <button onClick={openNew}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-600/25 transition hover:shadow-xl">
                    + Create Trip
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
         MODALS
         ═════════════════════════════════════════════════════════════════ */}

      {/* ── Delete confirm ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-glass-lg animate-scale-in">
            <h3 className="font-display text-lg font-bold text-slate-900">Delete this trip?</h3>
            <p className="mt-2 text-sm text-slate-500">This action cannot be undone.</p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Templates modal ── */}
      <Modal isOpen={showTemplateModal} onClose={() => setShowTemplateModal(false)} title="Budget Templates" size="lg">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => {
            const tTotal = t.budgetItems.reduce((s, b) => s + b.amount, 0);
            return (
              <div key={t.id} onClick={() => applyTemplate(t)}
                className="group cursor-pointer rounded-2xl border border-slate-200/60 bg-white p-5 transition-all duration-200 hover:shadow-xl hover:border-cyan-200 hover:-translate-y-0.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 text-2xl ring-1 ring-cyan-100">{t.icon}</span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">{t.title}</h4>
                    <p className="text-xs text-slate-400">{t.description}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-slate-400">👥 {t.travelers} · {t.budgetItems.length} items</span>
                  <span className="font-bold text-cyan-700">{formatCurrency(tTotal)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>

      {/* ── Share modal ── */}
      <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)} title="Share Trip Summary" size="md">
        <div className="space-y-4">
          <pre className="rounded-xl bg-slate-50 p-5 text-sm text-slate-700 whitespace-pre-wrap border border-slate-200 max-h-80 overflow-y-auto font-body leading-relaxed">
            {shareText}
          </pre>
          <div className="flex items-center gap-3">
            <button onClick={() => { navigator.clipboard.writeText(shareText); showToast('Copied to clipboard!', 'success'); }}
              className="flex-1 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-600/20 transition hover:shadow-xl">
              📋 Copy to Clipboard
            </button>
            {navigator.share && (
              <button onClick={() => navigator.share({ text: shareText }).catch(() => {})}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-card transition hover:shadow-md">
                📤 Share
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* ── Create / Edit Trip Modal ── */}
      <Modal isOpen={showModal} onClose={closeModal} title={editingTrip ? 'Edit Trip' : 'Plan a New Trip'} size="lg">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">Trip Title</label>
            <input value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium transition focus:bg-white focus-ring"
              placeholder="e.g. Goa Beach Trip" />
          </div>

          {/* Destinations */}
          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">Destinations</label>
            {form.destinations.map((dest, i) => (
              <div key={i} className="mb-2 flex items-center gap-2">
                <input value={dest}
                  onChange={(e) => setDestination(i, e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition focus:bg-white focus-ring"
                  placeholder={`Destination ${i + 1}`} />
                {form.destinations.length > 1 && (
                  <button type="button" onClick={() => removeDestination(i)}
                    className="rounded-lg p-2 text-slate-400 transition hover:text-red-500 hover:bg-red-50">✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addDestination}
              className="text-xs font-bold text-cyan-600 transition hover:text-cyan-700">+ Add another destination</button>
          </div>

          {/* Dates, Travelers, Budget Limit */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">Start Date</label>
              <input type="date" value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm transition focus:bg-white focus-ring" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">End Date</label>
              <input type="date" value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm transition focus:bg-white focus-ring" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">Travelers</label>
              <input type="number" min="1" value={form.travelers}
                onChange={(e) => {
                  const num = Math.max(1, parseInt(e.target.value) || 1);
                  const names = [...(form.travelerNames || [])];
                  while (names.length < num) names.push('');
                  while (names.length > num) names.pop();
                  setForm({ ...form, travelers: num, travelerNames: names });
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm transition focus:bg-white focus-ring" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">Budget Limit</label>
              <input type="number" min="0" value={form.budgetLimit || ''}
                onChange={(e) => setForm({ ...form, budgetLimit: Number(e.target.value) || 0 })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm transition focus:bg-white focus-ring"
                placeholder="₹ Max budget" />
            </div>
          </div>

          {/* Traveler Names */}
          {form.travelers > 1 && (
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">
                👥 Traveler Names <span className="text-xs font-normal text-slate-400">(for per-person tracking)</span>
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: form.travelers }, (_, i) => (
                  <input key={i} value={(form.travelerNames || [])[i] || ''}
                    onChange={(e) => {
                      const names = [...(form.travelerNames || [])];
                      while (names.length <= i) names.push('');
                      names[i] = e.target.value;
                      setForm({ ...form, travelerNames: names });
                    }}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm transition focus:bg-white focus-ring"
                    placeholder={`Traveler ${i + 1} name`} />
                ))}
              </div>
            </div>
          )}

          {/* Budget limit warning */}
          {form.budgetLimit > 0 && formTotal > form.budgetLimit && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3.5 text-sm font-medium text-rose-700 ring-1 ring-rose-100">
              <span>⚠️</span>
              <span>Items total ({formatCurrency(formTotal)}) exceeds limit ({formatCurrency(form.budgetLimit)})</span>
            </div>
          )}

          {/* Budget Items */}
          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">Budget Items</label>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[140px_1fr_120px_auto]">
                <select value={budgetCategory} onChange={(e) => setBudgetCategory(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus-ring">
                  {BUDGET_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{CATEGORY_ICONS[cat]} {cat}</option>
                  ))}
                </select>
                <input value={budgetDesc} onChange={(e) => setBudgetDesc(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus-ring" placeholder="Description" />
                <input type="number" min="0" value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus-ring" placeholder="₹ Amount" />
                <button type="button" onClick={addBudgetItem}
                  className="rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-700">Add</button>
              </div>

              {form.budgetItems.length > 0 && (
                <div className="space-y-1.5">
                  {form.budgetItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-xl bg-white px-4 py-2.5 shadow-sm ring-1 ring-slate-200/60">
                      <span className="flex items-center gap-2 text-sm text-slate-700">
                        <span>{CATEGORY_ICONS[item.category]}</span>
                        <span className="font-medium">{item.description}</span>
                        <span className="text-xs text-slate-400">({item.category})</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{formatCurrency(item.amount)}</span>
                        <button type="button" onClick={() => removeBudgetItem(idx)}
                          className="rounded p-1 text-slate-400 transition hover:text-red-500">✕</button>
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-end pt-2">
                    <span className="text-sm font-bold text-slate-700">Total: {formatCurrency(formTotal)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">Notes</label>
            <textarea rows={3} value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm transition focus:bg-white focus-ring resize-none"
              placeholder="Any additional notes..." />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
            <button type="button" onClick={closeModal}
              className="rounded-xl px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100">Cancel</button>
            <button type="submit" disabled={saving}
              className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-600/20 transition hover:shadow-xl hover:brightness-105 disabled:opacity-60">
              {saving ? 'Saving...' : editingTrip ? 'Update Trip' : 'Create Trip'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Budget Optimizer Modal ── */}
      <BudgetOptimizer
        isOpen={showOptimizer}
        onClose={() => setShowOptimizer(false)}
        onApplyBudget={handleOptimizerApply}
      />
    </>
  );
}
