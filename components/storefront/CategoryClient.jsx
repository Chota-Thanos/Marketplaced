'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import ProductCard from '../ProductCard';
import ProductComparisonModal from '../ProductComparisonModal';
import ProductFilters, { applyFiltersAndSort, EMPTY_FILTERS } from './ProductFilters';
import DynamicFilters from './DynamicFilters';
import { useStore } from '../providers/StoreProvider';
import {
  ArrowLeft,
  Scale,
  X,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'newest',      label: 'Newest First' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating',     label: 'Highest Rated' },
  { value: 'discount',   label: 'Best Discount' },
];

function applyDynamicFilters(products, activeFilters, filterConfig) {
  const customGroups = filterConfig?.groups || [];
  const defaultPriceGroup = { id: 'price', label: 'Price Range', type: 'range' };
  const hasCustomPrice = customGroups.some(g => g.id === 'price' || g.type === 'range');
  const groups = hasCustomPrice ? customGroups : [defaultPriceGroup, ...customGroups];

  let result = [...products];

  for (const group of groups) {
    const val = activeFilters[group.id];
    if (!val) continue;

    if (group.type === 'range' || group.id === 'price') {
      if (val.max !== undefined) {
        result = result.filter(p => Number(p.price || 0) <= val.max);
      }
    } else if (group.type === 'radio') {
      result = result.filter(p => {
        const pVal = (p[group.id] || p.tags?.join(' ') || '').toLowerCase();
        return pVal.includes(String(val).toLowerCase());
      });
    } else if (group.type === 'checkbox' || group.type === 'chip') {
      if (!Array.isArray(val) || val.length === 0) continue;
      result = result.filter(p => {
        const variants = p.variants || [];
        const matchesVariant = val.some(v =>
          variants.some(variant =>
            (variant.size || '').toLowerCase() === v.toLowerCase() ||
            (variant.color || '').toLowerCase() === v.toLowerCase()
          )
        );
        const matchesTags = val.some(v =>
          (p.tags || []).some(t => t.toLowerCase().includes(v.toLowerCase()))
        );
        return matchesVariant || matchesTags;
      });
    }
  }

  return result;
}

function sortProducts(products, sort) {
  const sorted = [...products];
  switch (sort) {
    case 'price_asc':  return sorted.sort((a, b) => Number(a.price) - Number(b.price));
    case 'price_desc': return sorted.sort((a, b) => Number(b.price) - Number(a.price));
    case 'rating':     return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case 'discount':   return sorted.sort((a, b) => (b.discount || 0) - (a.discount || 0));
    case 'newest':
    default:           return sorted.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
  }
}

export default function CategoryClient({ category, products }) {
  const { handleAddToCart } = useStore();
  const [compareList, setCompareList] = useState([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [sort, setSort] = useState('newest');
  const [dynamicFilters, setDynamicFilters] = useState({});
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const filterConfig = category.filterConfig || category.filter_config || null;

  const maxCatalogPrice = useMemo(() => {
    if (!products || products.length === 0) return 10000;
    return Math.max(...products.map(p => Number(p.price || 0)));
  }, [products]);

  const handleToggleCompare = (product) => {
    setCompareList((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) return prev.filter((p) => p.id !== product.id);
      if (prev.length >= 3) { alert('You can compare up to 3 products at a time!'); return prev; }
      return [...prev, product];
    });
  };

  const visibleProducts = useMemo(() => {
    let result = applyDynamicFilters(products, dynamicFilters, filterConfig);
    return sortProducts(result, sort);
  }, [products, dynamicFilters, filterConfig, sort]);

  // Build active filter chips for display
  const activeChips = useMemo(() => {
    const chips = [];
    const customGroups = filterConfig?.groups || [];
    const defaultPriceGroup = { id: 'price', label: 'Price Range', type: 'range', max: maxCatalogPrice };
    const hasCustomPrice = customGroups.some(g => g.id === 'price' || g.type === 'range');
    const groups = hasCustomPrice ? customGroups : [defaultPriceGroup, ...customGroups];

    for (const group of groups) {
      const val = dynamicFilters[group.id];
      if (!val) continue;

      if (group.type === 'range' || group.id === 'price') {
        if (val.max !== undefined && val.max < (group.max || maxCatalogPrice)) {
          chips.push({ groupId: group.id, value: 'max', label: `Under ₹${val.max.toLocaleString('en-IN')}` });
        }
      } else if (Array.isArray(val) && val.length > 0) {
        val.forEach(v => {
          const opt = (group.options || []).find(o => o.value === v);
          chips.push({ groupId: group.id, value: v, label: `${group.label}: ${opt?.label || v}` });
        });
      } else if (group.type === 'radio' && val) {
        const opt = (group.options || []).find(o => o.value === val);
        chips.push({ groupId: group.id, value: val, label: `${group.label}: ${opt?.label || val}` });
      }
    }
    return chips;
  }, [dynamicFilters, filterConfig, maxCatalogPrice]);

  const removeChip = (groupId, value) => {
    const current = dynamicFilters[groupId];
    if (value === 'max' || typeof current !== 'object') {
      setDynamicFilters(f => ({ ...f, [groupId]: undefined }));
    } else if (Array.isArray(current)) {
      setDynamicFilters(f => ({ ...f, [groupId]: current.filter(v => v !== value) }));
    } else {
      setDynamicFilters(f => ({ ...f, [groupId]: undefined }));
    }
  };

  const clearAllFilters = () => setDynamicFilters({});

  const hasDynamicFilters = true; // Always show sidebar on category pages

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-semibold text-ink-subtle mb-4">
        <Link href="/" className="hover:text-ink transition flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Home
        </Link>
        <span>/</span>
        <Link href="/" className="hover:text-ink transition">Clothing</Link>
        <span>/</span>
        <span className="text-ink font-black">{category.name}</span>
      </div>

      {/* Category Header */}
      {category.bannerUrl && (
        <div className="bg-ink rounded-panel overflow-hidden relative mb-6">
          <div className="absolute inset-0 opacity-40">
            <img src={category.bannerUrl} alt={category.name} className="w-full h-full object-cover" />
          </div>
          <div className="relative z-10 p-8 md:p-12 flex flex-col items-center text-center">
            <h1 className="text-3xl md:text-4xl font-black text-ink-inverse mb-2 drop-shadow-lg">{category.name}</h1>
            <p className="text-white/70 font-medium text-sm">
              {visibleProducts.length} Items
            </p>
          </div>
        </div>
      )}

      {/* Title + count (when no banner) */}
      {!category.bannerUrl && (
        <div className="mb-4">
          <h1 className="text-2xl font-black text-ink">{category.name}</h1>
          <p className="text-xs text-ink-subtle font-semibold mt-0.5">{visibleProducts.length} Items</p>
        </div>
      )}

      {/* Active Filter Chips + Sort Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Mobile filter toggle */}
          {hasDynamicFilters && (
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-control border border-line bg-surface text-xs font-bold text-ink hover:bg-surface-muted transition"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters {activeChips.length > 0 && `(${activeChips.length})`}
            </button>
          )}

          {/* Active filter chips */}
          {activeChips.map(chip => (
            <span
              key={`${chip.groupId}-${chip.value}`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-ink/5 border border-line text-[11px] font-bold text-ink"
            >
              {chip.label}
              <button onClick={() => removeChip(chip.groupId, chip.value)} className="hover:text-danger transition">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {activeChips.length > 0 && (
            <button onClick={clearAllFilters} className="text-xs font-black text-danger hover:underline">
              Clear All
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <button
            onClick={() => setSortOpen(s => !s)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-control border border-line bg-surface text-xs font-bold text-ink hover:bg-surface-muted transition min-w-[160px] justify-between"
          >
            <span>Sort by: {SORT_OPTIONS.find(o => o.value === sort)?.label}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-full mt-1 bg-surface border border-line rounded-panel shadow-panel z-30 min-w-[180px] py-1">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setSort(opt.value); setSortOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-surface-muted transition ${sort === opt.value ? 'text-accent font-black' : 'text-ink'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-6 items-start">
        {/* LEFT FILTER SIDEBAR (desktop) */}
        {hasDynamicFilters && (
          <div className="hidden lg:block w-56 flex-none sticky top-20">
            <DynamicFilters
              filterConfig={filterConfig}
              activeFilters={dynamicFilters}
              onChange={setDynamicFilters}
              onClearAll={clearAllFilters}
              maxCatalogPrice={maxCatalogPrice}
            />
          </div>
        )}

        {/* PRODUCT GRID */}
        <div className="flex-1 min-w-0">
          {visibleProducts.length === 0 ? (
            <div className="bg-surface-muted border border-line rounded-panel p-12 text-center">
              <h3 className="text-lg font-bold text-ink">No products match your filters</h3>
              <p className="text-ink-subtle text-sm mt-1 font-medium">Try widening or clearing them.</p>
              {activeChips.length > 0 && (
                <button onClick={clearAllFilters} className="mt-4 text-xs font-black text-danger hover:underline">
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={p => handleAddToCart(p, p.variants?.[0] || null)}
                  onQuickView={() => {}}
                  onToggleCompare={handleToggleCompare}
                  isCompared={compareList.some((p) => p.id === product.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MOBILE FILTER DRAWER */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-surface overflow-y-auto shadow-panel">
            <div className="flex items-center justify-between p-4 border-b border-line">
              <span className="font-black text-ink">Filters</span>
              <button onClick={() => setMobileFiltersOpen(false)}>
                <X className="w-5 h-5 text-ink-muted" />
              </button>
            </div>
            <div className="p-4">
              <DynamicFilters
                filterConfig={filterConfig}
                activeFilters={dynamicFilters}
                onChange={setDynamicFilters}
                onClearAll={clearAllFilters}
              />
            </div>
            <div className="p-4 border-t border-line">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full py-3 bg-ink text-ink-inverse font-black text-sm rounded-control"
              >
                Apply Filters ({visibleProducts.length} Results)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING COMPARISON BAR */}
      {compareList.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-ink text-ink-inverse px-6 py-3.5 rounded-pill shadow-panel border-2 border-highlight flex items-center gap-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-center gap-2 text-xs font-bold">
            <Scale className="w-4 h-4 text-highlight" />
            <span>Comparing {compareList.length} Items</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCompareModalOpen(true)}
              className="bg-highlight hover:bg-highlight-hover text-ink font-black text-xs px-4 py-1.5 rounded-pill transition"
            >
              Launch Matrix
            </button>
            <button onClick={() => setCompareList([])} className="text-ink-subtle hover:text-ink-inverse p-1 rounded-pill">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* PRODUCT COMPARISON MODAL */}
      <ProductComparisonModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        compareProducts={compareList}
        onAddToCart={handleAddToCart}
        onRemove={(id) => setCompareList(list => list.filter(p => p.id !== id))}
      />
    </div>
  );
}
