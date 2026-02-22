import React from 'react';

const categories = [
  { value: 'all', label: 'All Categories', icon: '🌍' },
  { value: 'adventure', label: 'Adventure', icon: '⛰️' },
  { value: 'relaxation', label: 'Relaxation', icon: '🏖️' },
  { value: 'cultural', label: 'Cultural', icon: '🏛️' },
  { value: 'romantic', label: 'Romantic', icon: '💕' },
  { value: 'budget', label: 'Budget', icon: '💰' }
];

export default function FilterBar({ selectedCategory, onCategoryChange, priceRange, onPriceRangeChange }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => onCategoryChange(cat.value)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                selectedCategory === cat.value
                  ? 'bg-slate-900 text-white shadow-md scale-105'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:shadow-sm hover:scale-105'
              }`}
            >
            <span className="mr-2">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {onPriceRangeChange && (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2">
          <label className="text-sm font-medium text-slate-700">Price:</label>
          <select
            value={priceRange}
            onChange={(e) => onPriceRangeChange(e.target.value)}
            className="rounded-lg border-0 bg-transparent text-sm font-semibold text-slate-700 outline-none"
          >
            <option value="all">All Prices</option>
            <option value="0-5000">Under ₹5,000</option>
            <option value="5000-10000">₹5,000 - ₹10,000</option>
            <option value="10000-20000">₹10,000 - ₹20,000</option>
            <option value="20000+">Above ₹20,000</option>
          </select>
        </div>
      )}
    </div>
  );
}
