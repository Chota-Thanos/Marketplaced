'use client';

import React, { useRef } from 'react';
import * as Icons from 'lucide-react';

export default function CategoryGrid({ categories, activeCategory, setActiveCategory }) {
  const scrollRef = useRef(null);

  const renderCategoryIcon = (cat) => {
    const iconName = cat.iconUrl || cat.icon_url;

    if (iconName && (iconName.startsWith('http://') || iconName.startsWith('https://'))) {
      return <img src={iconName} alt={cat.name} className="w-6 h-6 object-contain" />;
    }
    if (iconName && Icons[iconName]) {
      const IconComponent = Icons[iconName];
      return <IconComponent className="w-5 h-5" />;
    }
    const slug = (cat.slug || '').toLowerCase();
    if (slug.includes('casual') || slug.includes('shirt')) return <Icons.Shirt className="w-5 h-5" />;
    if (slug.includes('electronic') || slug.includes('tech')) return <Icons.Headphones className="w-5 h-5" />;
    if (slug.includes('footwear') || slug.includes('shoe')) return <Icons.Zap className="w-5 h-5" />;
    if (slug.includes('decor') || slug.includes('home')) return <Icons.Award className="w-5 h-5" />;
    if (slug.includes('wellness') || slug.includes('glow')) return <Icons.Leaf className="w-5 h-5" />;
    return <Icons.Sparkles className="w-5 h-5" />;
  };

  return (
    <section className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icons.LayoutGrid className="w-4 h-4 text-ink-subtle" />
          <h2 className="text-base font-black text-ink tracking-tight">Shop by Category</h2>
        </div>
        {activeCategory !== 'all' && (
          <button
            onClick={() => setActiveCategory('all')}
            className="text-xs text-danger font-extrabold hover:underline"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Compact horizontal scroll icon row */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* All */}
        <button
          onClick={() => setActiveCategory('all')}
          className={`flex-none flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-control border transition-all duration-200 min-w-[70px] ${
            activeCategory === 'all'
              ? 'bg-ink text-ink-inverse border-ink shadow-card'
              : 'bg-surface text-ink border-line hover:border-line-strong hover:bg-surface-muted'
          }`}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            activeCategory === 'all' ? 'bg-white/10' : 'bg-surface-muted'
          }`}>
            <Icons.Grid3x3 className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black whitespace-nowrap">All</span>
        </button>

        {categories.map((cat) => {
          const isActive = activeCategory === cat.slug;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(isActive ? 'all' : cat.slug)}
              aria-pressed={isActive}
              className={`flex-none flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-control border transition-all duration-200 min-w-[70px] ${
                isActive
                  ? 'bg-ink text-ink-inverse border-ink shadow-card'
                  : 'bg-surface text-ink border-line hover:border-line-strong hover:bg-surface-muted'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isActive ? 'bg-white/10' : 'bg-surface-muted'
              }`}>
                {renderCategoryIcon(cat)}
              </div>
              <span className="text-[10px] font-black whitespace-nowrap max-w-[64px] truncate text-center">
                {cat.name.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
