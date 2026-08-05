'use client';

import React from 'react';
import * as Icons from 'lucide-react';

export default function CategoryGrid({ categories, activeCategory, setActiveCategory }) {
  const renderCategoryIcon = (cat) => {
    const iconName = cat.iconUrl || cat.icon_url;

    // 1. Image URL icon
    if (iconName && (iconName.startsWith('http://') || iconName.startsWith('https://'))) {
      return <img src={iconName} alt={cat.name} className="w-6 h-6 object-contain" />;
    }

    // 2. Lucide Icon name stored in DB (e.g., "Sparkles", "Shirt", "Zap", "Headphones", "Award", "Leaf")
    if (iconName && Icons[iconName]) {
      const IconComponent = Icons[iconName];
      return <IconComponent className="w-6 h-6 text-accent" />;
    }

    // 3. Keyword fallbacks based on slug
    const slug = (cat.slug || '').toLowerCase();
    if (slug.includes('casual') || slug.includes('shirt') || slug.includes('apparel')) return <Icons.Shirt className="w-6 h-6 text-accent" />;
    if (slug.includes('electronic') || slug.includes('tech')) return <Icons.Headphones className="w-6 h-6 text-accent" />;
    if (slug.includes('footwear') || slug.includes('shoe')) return <Icons.Zap className="w-6 h-6 text-accent" />;
    if (slug.includes('decor') || slug.includes('home')) return <Icons.Award className="w-6 h-6 text-warning" />;
    if (slug.includes('wellness') || slug.includes('glow')) return <Icons.Leaf className="w-6 h-6 text-success" />;

    return <Icons.Sparkles className="w-6 h-6 text-danger" />;
  };

  return (
    <section className="space-y-5">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-control bg-ink/5 flex items-center justify-center text-ink">
            <Icons.LayoutGrid className="w-4 h-4" />
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
                {renderCategoryIcon(cat)}
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
