import React, { useContext } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AppLogo from '../components/AppLogo';

const linkClass = ({ isActive }) =>
  `rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-300 ${
    isActive ? 'bg-slate-900 text-white shadow-md scale-105' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:scale-105'
  }`;

export default function UserLayout() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-sm animate-slide-down">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <AppLogo to="/app" />

          <nav className="flex flex-wrap items-center gap-2">
            <NavLink to="/app" end className={linkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/app/packages" className={linkClass}>
              Packages
            </NavLink>
            <NavLink to="/app/booking" className={linkClass}>
              Book
            </NavLink>
            <NavLink to="/app/my-trips" className={linkClass}>
              My Trips
            </NavLink>
            <NavLink to="/app/wishlist" className={linkClass}>
              Wishlist
            </NavLink>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
              <p className="text-xs uppercase tracking-wider text-slate-500">User Panel</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-50 hover:scale-105"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
