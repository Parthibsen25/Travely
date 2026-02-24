import React from 'react';
import { Link } from 'react-router-dom';

const cards = [
  {
    title: 'Agency Governance',
    description: 'Review verification state, approve onboarding, and suspend risky accounts.',
    href: '/admin/agencies'
  },
  {
    title: 'Booking Oversight',
    description: 'Inspect all bookings and resolve disputes with clear operational controls.',
    href: '/admin/bookings'
  },
  {
    title: 'Revenue Analytics',
    description: 'Monitor marketplace commission trends and key operational metrics.',
    href: '/admin/analytics'
  }
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6 animate-page-enter">
      <header className="animate-slide-down">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Admin</p>
        <h1 className="font-display mt-2 text-3xl font-bold text-slate-900">Platform Control Center</h1>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {cards.map((card, index) => (
          <Link
            key={card.href}
            to={card.href}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl animate-scale-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <h2 className="font-display text-xl font-bold text-slate-900">{card.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{card.description}</p>
            <p className="mt-4 text-sm font-semibold text-cyan-700">Open section</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
