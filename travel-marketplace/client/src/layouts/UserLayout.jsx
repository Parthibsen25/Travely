import React, { useContext, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import AppLogo from '../components/AppLogo';
import NotificationBell from '../components/NotificationBell';

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
    isActive ? 'text-slate-900 border-b-2 border-blue-500' : 'text-slate-600 hover:text-slate-900'
  }`;

export default function UserLayout() {
  const { user, logout } = useContext(AuthContext);
  const { cartCount } = useCart();
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
    { to: '/app/my-requests', label: 'My Requests' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
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
              to="/app/wishlist"
              className={({ isActive }) =>
                `relative hidden sm:inline-flex items-center justify-center rounded-full p-2 transition hover:bg-red-50 ${isActive ? 'text-red-500' : 'text-slate-500 hover:text-red-500'}`
              }
              title="My Wishlist"
            >
              <svg className="h-5 w-5" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </NavLink>
            <NavLink
              to="/app/cart"
              className={({ isActive }) =>
                `relative hidden sm:inline-flex items-center justify-center rounded-full p-2 transition hover:bg-blue-50 ${isActive ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'}`
              }
              title="My Cart"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </NavLink>
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
              <NavLink to="/app/wishlist" onClick={() => setMobileOpen(false)} className={linkClass}>
                ❤️ Wishlist
              </NavLink>
              <NavLink to="/app/cart" onClick={() => setMobileOpen(false)} className={linkClass}>
                🛒 Cart {cartCount > 0 && `(${cartCount})`}
              </NavLink>
              <button type="button" onClick={() => { logout(); setMobileOpen(false); }} className="mt-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 text-left">
                Logout
              </button>
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
