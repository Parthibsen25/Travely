import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../utils/api';
import PackageCard from '../components/PackageCard';
import SearchBar from '../components/SearchBar';
import FilterBar from '../components/FilterBar';
import Loading from '../components/Loading';

export default function Packages() {
  const [packages, setPackages] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadPackages() {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set('q', search.trim());
        if (category !== 'all') params.set('category', category);
        const query = params.toString();
        const data = await apiFetch(`/api/packages${query ? `?${query}` : ''}`);
        if (!ignore) {
          let filtered = data.packages || [];
          
          // Apply price filter
          if (priceRange !== 'all') {
            filtered = filtered.filter((pkg) => {
              const price = pkg.price || 0;
              switch (priceRange) {
                case '0-5000':
                  return price < 5000;
                case '5000-10000':
                  return price >= 5000 && price < 10000;
                case '10000-20000':
                  return price >= 10000 && price < 20000;
                case '20000+':
                  return price >= 20000;
                default:
                  return true;
              }
            });
          }
          
          setPackages(filtered);
        }
      } catch (err) {
        if (!ignore) setError(err.message || 'Failed to load packages');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadPackages();
    return () => {
      ignore = true;
    };
  }, [search, category, priceRange]);

  const groupedCount = useMemo(() => {
    return packages.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});
  }, [packages]);

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-600 via-blue-600 to-purple-600 p-8 text-white shadow-xl animate-slide-down">
        <div className="absolute inset-0 opacity-20">
          <div className="h-full w-full bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] [background-size:20px_20px]" />
        </div>
        <div className="relative">
          <h1 className="font-display text-4xl font-bold sm:text-5xl">Discover Your Next Adventure</h1>
          <p className="mt-3 text-base text-cyan-50 sm:text-lg">Search by destination, category, and compare top offers from verified partners.</p>

          <div className="mt-6">
            <SearchBar onSearch={setSearch} placeholder="Search destination or package title..." />
          </div>
        </div>
      </section>

      <FilterBar
        selectedCategory={category}
        onCategoryChange={setCategory}
        priceRange={priceRange}
        onPriceRangeChange={setPriceRange}
      />

      {loading ? (
        <Loading />
      ) : error ? (
        <div className="rounded-xl bg-red-50 border border-red-200 p-6">
          <div className="flex items-center gap-3">
            <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium text-red-700">{error}</p>
          </div>
        </div>
      ) : packages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <svg className="mx-auto h-16 w-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-4 text-lg font-semibold text-slate-900">No packages found</p>
          <p className="mt-2 text-sm text-slate-600">Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-600">
              Showing <span className="font-bold text-slate-900">{packages.length}</span> packages
            </p>
          </div>
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {packages.map((pkg, index) => (
              <div key={pkg._id} className="animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <PackageCard pkg={pkg} showAgency={true} />
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
