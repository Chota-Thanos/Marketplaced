'use client';

import React from 'react';
import ProductCard from '../../ProductCard';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

export default function FeaturedProductsSection({
  filteredProducts,
  handleAddToCart,
  setReviewProduct,
  handleToggleCompare,
  compareList,
  carouselIndex,
  setCarouselIndex
}) {
  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-line/60">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-warning" />
            <h2 className="text-2xl font-black text-ink tracking-tight">Featured Products</h2>
          </div>
          <p className="text-xs text-ink-subtle font-medium mt-1">
            Select "+ Compare" on cards to launch the side-by-side AI agent comparison matrix.
          </p>
        </div>

        {/* Carousel Navigation Controls */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            onClick={() => setCarouselIndex((prev) => Math.max(0, prev - 1))}
            disabled={carouselIndex === 0}
            className="w-9 h-9 rounded-pill bg-surface hover:bg-surface-sunken disabled:opacity-40 disabled:hover:bg-surface border border-line flex items-center justify-center text-ink-muted transition shadow-subtle"
            aria-label="Previous Products"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-1.5 px-2">
            <span className={`w-2.5 h-2.5 rounded-pill transition-all duration-300 ${carouselIndex === 0 ? 'bg-ink scale-110' : 'bg-surface-sunken'}`} />
            <span className={`w-2.5 h-2.5 rounded-pill transition-all duration-300 ${carouselIndex === 1 ? 'bg-ink scale-110' : 'bg-surface-sunken'}`} />
          </div>

          <button
            onClick={() => setCarouselIndex((prev) => Math.min(1, prev + 1))}
            disabled={carouselIndex === 1}
            className="w-9 h-9 rounded-pill bg-surface hover:bg-surface-sunken disabled:opacity-40 disabled:hover:bg-surface border border-line flex items-center justify-center text-ink-muted transition shadow-subtle"
            aria-label="Next Products"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Product Cards Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-surface-muted/50 rounded-panel border border-line/60 space-y-2">
          <p className="text-sm font-bold text-ink-muted">No products found matching your filter.</p>
          <p className="text-xs text-ink-subtle">Try selecting another category above!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              onQuickView={(p) => setReviewProduct(p)}
              onToggleCompare={handleToggleCompare}
              isCompared={compareList.some((p) => p.id === product.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
