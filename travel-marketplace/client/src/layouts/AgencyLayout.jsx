import React, { useContext, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AppLogo from '../components/AppLogo';
import NotificationBell from '../components/NotificationBell';

const linkClass = ({ isActive }) =>
  `rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-300 ${
    isActive ? 'bg-amber-500 text-white shadow-md scale-105' : 'text-slate-600 hover:bg-amber-50 hover:text-slate-900 hover:scale-105'
  }`;

export default function AgencyLayout() {
  const { user, logout } = useContext(AuthContext);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: '/agency/dashboard', label: 'Dashboard' },
    { to: '/agency/coupons', label: 'Coupons' },
    { to: '/agency/payouts', label: 'Payouts' }
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-sm animate-slide-down">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <AppLogo to="/agency/dashboard" />

          <nav className="hidden items-center gap-2 sm:flex">
            {navLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={linkClass}>{link.label}</NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
              <p className="text-xs uppercase tracking-wider text-slate-500">Agency Panel</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="hidden rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-50 hover:scale-105 sm:inline-flex"
            >
              Logout
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 sm:hidden"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-3 sm:hidden animate-slide-down">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <NavLink key={link.to} to={link.to} onClick={() => setMobileOpen(false)} className={linkClass}>{link.label}</NavLink>
              ))}
              <button type="button" onClick={() => { logout(); setMobileOpen(false); }} className="mt-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 text-left">Logout</button>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
