'use client';

import React from 'react';
import { Headphones, Zap, Award, Leaf, Sparkles, LayoutGrid } from 'lucide-react';

export default function CategoryGrid({ categories, activeCategory, setActiveCategory }) {
  const renderCategoryIcon = (slug) => {
    if (slug.includes('electronic')) return <Headphones className="w-6 h-6 text-accent" />;
    if (slug.includes('footwear')) return <Zap className="w-6 h-6 text-accent" />;
    if (slug.includes('decor')) return <Award className="w-6 h-6 text-warning" />;
    if (slug.includes('wellness')) return <Leaf className="w-6 h-6 text-success" />;
    return <Sparkles className="w-6 h-6 text-danger" />;
  };

  return (
    <section className="space-y-5">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-control bg-ink/5 flex items-center justify-center text-ink">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl font-black text-ink tracking-tight">Shop by Category</h2>
            <p className="text-xs text-ink-subtle font-medium">Browse verified multi-category collections</p>
          </div>
        </div>

        {activeCategory !== 'all' && (
          <button
            onClick={() => setActiveCategory('all')}
            className="text-xs text-danger font-extrabold hover:underline bg-danger-soft px-3 py-1 rounded-pill border border-danger transition"
          >
            Clear Filter (Show All)
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.slug;
          return (
            <button
              key={cat.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveCategory(isActive ? 'all' : cat.slug)}
              className={`group w-full p-4 rounded-card text-center space-y-3 cursor-pointer transition-all duration-300 border ${
                isActive
                  ? 'bg-ink text-ink-inverse border-ink shadow-card ring-2 ring-ink/20 transform -translate-y-1'
                  : 'bg-surface text-ink border-line/80 hover:border-line-strong hover:shadow-card hover:-translate-y-1'
              }`}
            >
              <div
                className={`w-14 h-14 rounded-card border shadow-subtle mx-auto flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? 'bg-surface/10 border-surface/20 scale-105'
                    : 'bg-surface-muted border-line/80 group-hover:bg-surface group-hover:scale-105'
                }`}
              >
                {renderCategoryIcon(cat.slug)}
              </div>

              <div>
                <h3 className="font-extrabold text-xs tracking-wide">{cat.name}</h3>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
