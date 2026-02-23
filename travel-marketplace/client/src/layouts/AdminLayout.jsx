import React, { useContext } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AppLogo from '../components/AppLogo';
import NotificationBell from '../components/NotificationBell';

const navClass = ({ isActive }) =>
  `block rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
    isActive ? 'bg-slate-900 text-white shadow-md scale-105' : 'text-slate-700 hover:bg-slate-100 hover:scale-105'
  }`;

export default function AdminLayout() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[260px_1fr] sm:px-6">
        <aside className="sticky top-6 h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm animate-slide-in-left">
          <AppLogo to="/admin" compact />

          <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Admin Console</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-slate-400">Alerts</span>
            <NotificationBell />
          </div>
          <nav className="mt-3 space-y-2">
            <NavLink to="/admin" end className={navClass}>
              Overview
            </NavLink>
            <NavLink to="/admin/agencies" className={navClass}>
              Agencies
            </NavLink>
            <NavLink to="/admin/bookings" className={navClass}>
              Bookings
            </NavLink>
            <NavLink to="/admin/coupons" className={navClass}>
              Coupons
            </NavLink>
            <NavLink to="/admin/analytics" className={navClass}>
              Analytics
            </NavLink>
            <NavLink to="/admin/banners" className={navClass}>
              Banners
            </NavLink>
          </nav>

          <div className="mt-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-4 text-white">
            <p className="text-sm font-semibold">Signed in as</p>
            <p className="text-base font-bold">{user?.name || user?.email}</p>
            <button
              type="button"
              onClick={logout}
              className="mt-3 w-full rounded-lg bg-white/20 px-3 py-2 text-sm font-semibold backdrop-blur transition-all duration-300 hover:bg-white/30 hover:scale-105"
            >
              Logout
            </button>
          </div>
        </aside>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 animate-slide-in-right">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
