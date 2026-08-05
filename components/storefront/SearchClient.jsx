'use client';

import React, { useState } from 'react';
import ProductCard from '../ProductCard';
import ProductFilters, { applyFiltersAndSort, EMPTY_FILTERS } from './ProductFilters';
import { useStore } from '../providers/StoreProvider';
import { Search, Frown } from 'lucide-react';

export default function SearchClient({ query, products }) {
  const { handleAddToCart } = useStore();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState('newest');

  const visible = applyFiltersAndSort(products, filters, sort);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-ink flex items-center gap-3">
          <Search className="w-8 h-8 text-accent" />
          Search Results
        </h1>
        {query ? (
          <p className="text-ink-subtle mt-2 font-medium">
            Found {visible.length} {visible.length === 1 ? 'result' : 'results'} for{' '}
            <span className="font-bold text-ink">"{query}"</span>
          </p>
        ) : (
          <p className="text-ink-subtle mt-2 font-medium">All products</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <ProductFilters
            products={products}
            filters={filters}
            setFilters={setFilters}
            sort={sort}
            setSort={setSort}
            resultCount={visible.length}
          />
        </div>

        <div className="lg:col-span-3">
          {visible.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {visible.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={p => handleAddToCart(p, p.variants?.[0] || null)}
                  onQuickView={() => {}}
                />
              ))}
            </div>
          ) : (
            <div className="bg-surface-muted border border-line rounded-panel p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-surface-sunken rounded-pill flex items-center justify-center mb-4">
                <Frown className="w-8 h-8 text-ink-subtle" />
              </div>
              <h3 className="text-xl font-bold text-ink mb-2">No products found</h3>
              <p className="text-ink-subtle max-w-md mx-auto">
                {products.length > 0
                  ? 'No products match your filters. Try widening them.'
                  : `We couldn't find anything matching "${query}". Try checking your spelling or searching for a broader term.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
