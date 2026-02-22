import React, { useContext } from 'react';
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

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl shadow-sm animate-slide-down">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <AppLogo />

          <div className="flex items-center gap-3">
            {!user ? (
              <>
                <Link
                  to="/agency/login"
                  className="hidden rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 transition-all duration-300 hover:bg-amber-100 hover:scale-105 sm:inline-flex"
                >
                  Agency Login
                </Link>
                <Link
                  to="/admin/login"
                  className="hidden rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-all duration-300 hover:bg-slate-50 hover:scale-105 sm:inline-flex"
                >
                  Admin Login
                </Link>
                <Link
                  to="/login"
                  className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:from-slate-800 hover:to-slate-600 hover:scale-105 hover:shadow-xl"
                >
                  Sign In
                </Link>
              </>
            ) : (
              <>
                <Link
                  to={roleHome(user.role)}
                  className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-cyan-700 hover:to-blue-700"
                >
                  Open {user.role === 'ADMIN' ? 'Admin' : user.role === 'AGENCY' ? 'Agency' : 'App'}
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
