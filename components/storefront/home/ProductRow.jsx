'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '../../ProductCard';

/**
 * Horizontal scroll product row — used for Recommended, New Arrivals, Best Sellers sections.
 */
export default function ProductRow({
  title,
  icon,
  accentColor = 'text-accent',
  products = [],
  viewAllHref,
  onAddToCart,
  onToggleCompare,
  compareList = [],
}) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  if (!products.length) return null;

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className={`${accentColor}`}>{icon}</span>}
          <h2 className="text-lg font-black text-ink tracking-tight">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Scroll arrows */}
          <button
            onClick={() => scroll(-1)}
            className="w-7 h-7 rounded-full border border-line bg-surface hover:bg-surface-sunken flex items-center justify-center text-ink-muted transition"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => scroll(1)}
            className="w-7 h-7 rounded-full border border-line bg-surface hover:bg-surface-sunken flex items-center justify-center text-ink-muted transition"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="text-xs font-black text-accent hover:underline ml-1"
            >
              View All →
            </Link>
          )}
        </div>
      </div>

      {/* Horizontal scroll container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <div key={product.id} className="flex-none w-[220px] sm:w-[240px]">
            <ProductCard
              product={product}
              onAddToCart={onAddToCart}
              onQuickView={() => {}}
              onToggleCompare={onToggleCompare}
              isCompared={compareList.some((p) => p.id === product.id)}
              compact
            />
          </div>
        ))}
      </div>
    </section>
  );
}
