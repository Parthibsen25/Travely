import React, { useContext, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AppLogo from '../components/AppLogo';

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
    isActive ? 'text-slate-900 border-b-2 border-blue-500' : 'text-slate-600 hover:text-slate-900'
  }`;

export default function UserLayout() {
  const { user, logout } = useContext(AuthContext);
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = (() => {
    const name = (user?.name || '').trim();
    if (name) {
      const parts = name.split(/\s+/).filter(Boolean);
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    if (user?.email) return user.email.slice(0, 2).toUpperCase();
    return 'U';
  })();

  const navLinks = [
    { to: '/app', label: 'Home', end: true },
    { to: '/app/packages', label: 'Packages' },
    { to: '/app/plan-trip', label: 'Plan My Budget Trip' },
    { to: '/app/my-trips', label: 'My Trips' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm animate-slide-down">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <AppLogo to="/" />

          {/* Desktop nav */}
          <nav className="hidden flex-wrap items-center gap-2 md:flex">
            {navLinks.map((link) => (
              <NavLink key={`${link.to}-${link.label}`} to={link.to} end={link.end} className={linkClass}>
                <span className="inline-flex items-center gap-2">
                  {link.label}
                  {link.isNew && <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">New</span>}
                </span>
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <NavLink
              to="/app/profile"
              className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-bold text-white shadow-sm"
              title="Profile"
            >
              {initials}
            </NavLink>
            <button
              type="button"
              onClick={logout}
              className="hidden rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:inline-flex"
            >
              Logout
            </button>
            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
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

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden animate-slide-down">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <NavLink key={`${link.to}-${link.label}`} to={link.to} end={link.end} onClick={() => setMobileOpen(false)} className={linkClass}>
                  {link.label}
                </NavLink>
              ))}
              <button type="button" onClick={() => { logout(); setMobileOpen(false); }} className="mt-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 text-left">
                Logout
              </button>
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
