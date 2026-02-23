import React, { useContext, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AppLogo from '../components/AppLogo';

function roleHome(role) {
  if (role === 'ADMIN') return '/admin';
  if (role === 'AGENCY') return '/agency/dashboard';
  return '/app';
}

export default function PublicLayout() {
  const { user, logout } = useContext(AuthContext);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl shadow-sm animate-slide-down">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <AppLogo />

          {/* Desktop nav */}
          <div className="hidden items-center gap-3 sm:flex">
            {!user ? (
              <>
                <Link to="/agency/login" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 transition-all duration-300 hover:bg-amber-100 hover:scale-105">
                  Agency Login
                </Link>
                <Link to="/admin/login" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-all duration-300 hover:bg-slate-50 hover:scale-105">
                  Admin Login
                </Link>
                <Link to="/login" className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:from-slate-800 hover:to-slate-600 hover:scale-105 hover:shadow-xl">
                  Sign In
                </Link>
              </>
            ) : (
              <>
                <Link to={roleHome(user.role)} className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-cyan-700 hover:to-blue-700">
                  Open {user.role === 'ADMIN' ? 'Admin' : user.role === 'AGENCY' ? 'Agency' : 'App'}
                </Link>
                <button type="button" onClick={logout} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  Logout
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
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

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 sm:hidden animate-slide-down">
            <div className="flex flex-col gap-2">
              {!user ? (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 px-5 py-2.5 text-center text-sm font-semibold text-white">Sign In</Link>
                  <Link to="/agency/login" onClick={() => setMobileOpen(false)} className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-700">Agency Login</Link>
                  <Link to="/admin/login" onClick={() => setMobileOpen(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700">Admin Login</Link>
                </>
              ) : (
                <>
                  <Link to={roleHome(user.role)} onClick={() => setMobileOpen(false)} className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-center text-sm font-semibold text-white">
                    Open {user.role === 'ADMIN' ? 'Admin' : user.role === 'AGENCY' ? 'Agency' : 'App'}
                  </Link>
                  <button type="button" onClick={() => { logout(); setMobileOpen(false); }} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Logout</button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
