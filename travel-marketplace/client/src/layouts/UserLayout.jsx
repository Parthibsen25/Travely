import React, { useContext, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import AppLogo from '../components/AppLogo';
import NotificationBell from '../components/NotificationBell';

const linkClass = ({ isActive }) =>
  `relative rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
    isActive ? 'text-cyan-700 bg-cyan-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
  }`;

export default function UserLayout() {
  const { user, logout } = useContext(AuthContext);
  const { cartCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

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
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <AppLogo to="/" />

          {/* Desktop nav */}
          <nav className="hidden flex-wrap items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <NavLink key={`${link.to}-${link.label}`} to={link.to} end={link.end} className={linkClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <NavLink
              to="/app/wishlist"
              className={({ isActive }) =>
                `relative hidden sm:inline-flex items-center justify-center rounded-full p-2.5 transition-all duration-200 ${isActive ? 'bg-red-50 text-red-500' : 'text-slate-400 hover:bg-red-50 hover:text-red-500'}`
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
                `relative hidden sm:inline-flex items-center justify-center rounded-full p-2.5 transition-all duration-200 ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-blue-50 hover:text-blue-600'}`
              }
              title="My Cart"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white animate-badge-pulse">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </NavLink>

            {/* Divider */}
            <div className="hidden sm:block h-6 w-px bg-slate-200 mx-1" />

            {/* Profile dropdown */}
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:shadow-md hover:scale-105 ring-2 ring-white"
                title="Profile"
              >
                {initials}
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-xl border border-slate-100 bg-white py-1 shadow-glass animate-scale-in">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'User'}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <NavLink to="/app/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50">
                      <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      My Profile
                    </NavLink>
                    <NavLink to="/app/wishlist" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50">
                      <svg className="h-4 w-4 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                      My Wishlist
                    </NavLink>
                    <NavLink to="/app/my-trips" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50">
                      <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      My Trips
                    </NavLink>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      type="button"
                      onClick={() => { setProfileOpen(false); logout(); }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="border-t border-slate-100 bg-white/95 backdrop-blur-lg px-4 py-3 md:hidden animate-slide-down">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <NavLink key={`${link.to}-${link.label}`} to={link.to} end={link.end} onClick={() => setMobileOpen(false)} className={linkClass}>
                  {link.label}
                </NavLink>
              ))}
              <div className="my-2 border-t border-slate-100" />
              <NavLink to="/app/wishlist" onClick={() => setMobileOpen(false)} className={linkClass}>
                Wishlist
              </NavLink>
              <NavLink to="/app/cart" onClick={() => setMobileOpen(false)} className={linkClass}>
                Cart {cartCount > 0 && <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{cartCount}</span>}
              </NavLink>
              <NavLink to="/app/profile" onClick={() => setMobileOpen(false)} className={linkClass}>
                Profile
              </NavLink>
              <button type="button" onClick={() => { logout(); setMobileOpen(false); }} className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 text-left transition hover:bg-red-50">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 animate-page-enter">
        <Outlet />
      </main>
    </div>
  );
}
