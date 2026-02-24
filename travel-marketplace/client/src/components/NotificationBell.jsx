import React, { useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return '1d ago';
  return `${days}d ago`;
}

const typeIcon = {
  BOOKING_CREATED: (
    <svg className="h-5 w-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  COUPON_CREATED: (
    <svg className="h-5 w-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  ),
  COUPON_APPROVED: (
    <svg className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  COUPON_REJECTED: (
    <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  BOOKING_CANCELLED: (
    <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  GENERAL: (
    <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
};

export default function NotificationBell() {
  const { isAuthenticated } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  // Poll unread count every 30s (only when authenticated)
  useEffect(() => {
    if (!isAuthenticated) { setUnreadCount(0); return; }
    async function fetchCount() {
      try {
        const data = await apiFetch('/api/notifications/unread-count');
        setUnreadCount(data.unreadCount || 0);
      } catch { /* silent */ }
    }
    fetchCount();
    const timer = setInterval(fetchCount, 30000);
    return () => clearInterval(timer);
  }, [isAuthenticated]);

  // Load full list when panel opens
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    apiFetch('/api/notifications')
      .then((data) => {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  async function markAllRead() {
    try {
      await apiFetch('/api/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  }

  async function markRead(id) {
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* silent */ }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
        title="Notifications"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-2xl sm:w-96 animate-scale-in">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="font-display text-sm font-bold text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs font-semibold text-cyan-600 hover:text-cyan-700">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <svg className="mx-auto h-10 w-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="mt-2 text-sm text-slate-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n._id}
                  onClick={() => !n.isRead && markRead(n._id)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${!n.isRead ? 'bg-cyan-50/40' : ''}`}
                >
                  <div className="mt-0.5 shrink-0">{typeIcon[n.type] || typeIcon.GENERAL}</div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${!n.isRead ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>{n.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{n.message}</p>
                    <p className="mt-1 text-[10px] text-slate-400">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cyan-500" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
