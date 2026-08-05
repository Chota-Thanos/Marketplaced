'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ProductCard from '../ProductCard';
import ProductComparisonModal from '../ProductComparisonModal';
import ProductFilters, { applyFiltersAndSort, EMPTY_FILTERS } from './ProductFilters';
import { useStore } from '../providers/StoreProvider';
import {
  ArrowLeft,
  Scale,
  X
} from 'lucide-react';

export default function CategoryClient({ category, products }) {
  const { handleAddToCart } = useStore();
  const [compareList, setCompareList] = useState([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState('newest');

  const handleToggleCompare = (product) => {
    setCompareList((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= 3) {
        alert('You can compare up to 3 products at a time!');
        return prev;
      }
      return [...prev, product];
    });
  };

  const visibleProducts = applyFiltersAndSort(products, filters, sort);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-semibold text-ink-subtle mb-6">
        <Link href="/" className="hover:text-ink transition flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Store
        </Link>
        <span>/</span>
        <span className="text-ink">{category.name}</span>
      </div>

      {/* Category Header */}
      <div className="bg-ink rounded-panel overflow-hidden relative mb-8">
        {category.bannerUrl && (
          <div className="absolute inset-0 opacity-40">
            <img src={category.bannerUrl} alt={category.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="relative z-10 p-10 md:p-16 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-5xl font-black text-ink-inverse mb-4 drop-shadow-lg">{category.name}</h1>
          <p className="text-ink-subtle font-medium max-w-xl">
            Explore our premium collection of {category.name.toLowerCase()}, verified for authenticity and quality.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <ProductFilters
            products={products}
            filters={filters}
            setFilters={setFilters}
            sort={sort}
            setSort={setSort}
            resultCount={visibleProducts.length}
          />
        </div>

        <div className="lg:col-span-3">
          {visibleProducts.length === 0 ? (
            <div className="bg-surface-muted border border-line rounded-panel p-12 text-center">
              <h3 className="text-lg font-bold text-ink">No products match your filters</h3>
              <p className="text-ink-subtle text-sm mt-1 font-medium">Try widening or clearing them.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* FLOATING PRODUCT COMPARISON BAR */}
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
            <button
              onClick={() => setCompareList([])}
              className="text-ink-subtle hover:text-ink-inverse p-1 rounded-pill"
            >
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
