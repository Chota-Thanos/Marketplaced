'use client';

import React, { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

export const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest first' },
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' },
  { id: 'rating', label: 'Customer Rating' },
  { id: 'popularity', label: 'Popularity' },
];

/**
 * Filter panel + sort control. Filtering happens client-side against the
 * already-fetched list so the controls stay instant; the same field names
 * match the API's query params if this is ever moved server-side.
 */
export default function ProductFilters({ products, filters, setFilters, sort, setSort, resultCount }) {
  const [open, setOpen] = useState(false);

  const prices = products.map(p => p.price);
  const priceMin = prices.length ? Math.floor(Math.min(...prices)) : 0;
  const priceMax = prices.length ? Math.ceil(Math.max(...prices)) : 0;
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))].sort();

  const set = (key, value) => setFilters(f => ({ ...f, [key]: value }));
  const clear = () => setFilters({ maxPrice: null, minRating: null, brand: null, inStock: false, isNew: false });

  const activeCount = [
    filters.maxPrice != null,
    filters.minRating != null,
    !!filters.brand,
    filters.inStock,
    filters.isNew,
  ].filter(Boolean).length;

  const panel = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-ink text-sm">Filters</h3>
        {activeCount > 0 && (
          <button onClick={clear} className="text-[11px] font-bold text-accent hover:underline">
            Clear all ({activeCount})
          </button>
        )}
      </div>

      {priceMax > priceMin && (
        <div>
          <label className="block text-xs font-bold text-ink-muted mb-2" htmlFor="productfilters-f1">
            Max Price: <span className="text-ink">₹{(filters.maxPrice ?? priceMax).toLocaleString('en-IN')}</span>
          </label>
          <input id="productfilters-f1"
            type="range"
            min={priceMin}
            max={priceMax}
            value={filters.maxPrice ?? priceMax}
            onChange={e => set('maxPrice', Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] font-bold text-ink-subtle mt-1">
            <span>₹{priceMin.toLocaleString('en-IN')}</span>
            <span>₹{priceMax.toLocaleString('en-IN')}</span>
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-ink-muted mb-2" htmlFor="productfilters-f2">Minimum Rating</label>
        <div className="flex flex-wrap gap-2">
          {[4, 3, 2].map(r => (
            <button key={r}
              onClick={() => set('minRating', filters.minRating === r ? null : r)}
              className={`px-3 py-1.5 rounded-pill text-[11px] font-bold border transition ${
                filters.minRating === r ? 'bg-inverse text-ink-inverse border-line-strong' : 'bg-surface text-ink-muted border-line hover:border-line-strong'
              }`}>
              {r}★ & up
            </button>
          ))}
        </div>
      </div>

      {brands.length > 0 && (
        <div>
          <label htmlFor="productfilters-f2" className="block text-xs font-bold text-ink-muted mb-2">Brand</label>
          <select id="productfilters-f2"
            value={filters.brand || ''}
            onChange={e => set('brand', e.target.value || null)}
            className="w-full bg-surface-muted border border-line rounded-control px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-line-strong"
          >
            <option value="">All brands</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer" htmlFor="productfilters-f3">
          <input type="checkbox" checked={filters.inStock} onChange={e => set('inStock', e.target.checked)}
            className="w-4 h-4 accent-primary" />
          <span className="text-xs font-bold text-ink-muted">In stock only</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={filters.isNew} onChange={e => set('isNew', e.target.checked)}
            className="w-4 h-4 accent-primary" />
          <span className="text-xs font-bold text-ink-muted">New arrivals only</span>
        </label>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile trigger + sort bar */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <button
          onClick={() => setOpen(true)}
          className="lg:hidden flex items-center gap-2 bg-surface border border-line rounded-control px-4 py-2.5 text-xs font-bold text-ink-muted"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters {activeCount > 0 && <span className="bg-inverse text-ink-inverse px-1.5 rounded-pill">{activeCount}</span>}
        </button>

        <p className="text-xs font-bold text-ink-subtle hidden lg:block">
          {resultCount} product{resultCount === 1 ? '' : 's'}
        </p>

        <div className="flex items-center gap-2 ml-auto">
          <label htmlFor="productfilters-f3" className="text-xs font-bold text-ink-subtle hidden sm:inline">Sort by</label>
          <select id="productfilters-f3"
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="bg-surface border border-line rounded-control px-3 py-2.5 text-xs font-bold text-ink focus:outline-none focus:border-line-strong"
          >
            {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block bg-surface border border-line rounded-panel p-5 sticky top-6">
        {panel}
      </aside>

      {/* Mobile bottom sheet */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 bg-inverse/60 backdrop-blur-sm flex items-end">
          <div className="bg-surface w-full rounded-t-chip-panel p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-ink">Filters</h3>
              <button onClick={() => setOpen(false)} className="p-2 text-ink-subtle hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>
            {panel}
            <button onClick={() => setOpen(false)} className="btn-primary w-full justify-center mt-6">
              Show {resultCount} result{resultCount === 1 ? '' : 's'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/** Shared filter/sort logic so search and category pages behave identically. */
export function applyFiltersAndSort(products, filters, sort) {
  let list = products.filter(p => {
    if (filters.maxPrice != null && p.price > filters.maxPrice) return false;
    if (filters.minRating != null && Number(p.rating) < filters.minRating) return false;
    if (filters.brand && p.brand !== filters.brand) return false;
    if (filters.inStock && !p.inStock) return false;
    if (filters.isNew && !p.isNew) return false;
    return true;
  });

  const sorted = [...list];
  switch (sort) {
    case 'price_asc': sorted.sort((a, b) => a.price - b.price); break;
    case 'price_desc': sorted.sort((a, b) => b.price - a.price); break;
    case 'rating': sorted.sort((a, b) => Number(b.rating) - Number(a.rating)); break;
    case 'popularity': sorted.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0)); break;
    default: break; // 'newest' — API already returns newest-first
  }
  return sorted;
}

export const EMPTY_FILTERS = {
  maxPrice: null, minRating: null, brand: null, inStock: false, isNew: false,
};
