'use client';

import React from 'react';
import Link from 'next/link';
import * as Icons from 'lucide-react';

const CATEGORY_STYLES = [
  { bg: 'from-rose-500/15 to-amber-500/15', border: 'border-rose-500/30', text: 'text-rose-600 dark:text-rose-400' },
  { bg: 'from-blue-500/15 to-cyan-500/15', border: 'border-blue-500/30', text: 'text-blue-600 dark:text-blue-400' },
  { bg: 'from-emerald-500/15 to-teal-500/15', border: 'border-emerald-500/30', text: 'text-emerald-600 dark:text-emerald-400' },
  { bg: 'from-violet-500/15 to-purple-500/15', border: 'border-violet-500/30', text: 'text-violet-600 dark:text-violet-400' },
  { bg: 'from-orange-500/15 to-yellow-500/15', border: 'border-orange-500/30', text: 'text-orange-600 dark:text-orange-400' },
  { bg: 'from-indigo-500/15 to-sky-500/15', border: 'border-indigo-500/30', text: 'text-indigo-600 dark:text-indigo-400' },
];

export default function CategoryGrid({ categories = [] }) {
  const renderCategoryIcon = (cat, style) => {
    const iconName = cat.iconUrl || cat.icon_url;

    if (iconName && (iconName.startsWith('http://') || iconName.startsWith('https://'))) {
      return <img src={iconName} alt={cat.name} className="w-6 h-6 object-contain" />;
    }
    if (iconName && Icons[iconName]) {
      const IconComponent = Icons[iconName];
      return <IconComponent className={`w-6 h-6 ${style.text}`} />;
    }
    const slug = (cat.slug || '').toLowerCase();
    if (slug.includes('casual') || slug.includes('shirt')) return <Icons.Shirt className={`w-6 h-6 ${style.text}`} />;
    if (slug.includes('electronic') || slug.includes('tech')) return <Icons.Headphones className={`w-6 h-6 ${style.text}`} />;
    if (slug.includes('footwear') || slug.includes('shoe')) return <Icons.Zap className={`w-6 h-6 ${style.text}`} />;
    if (slug.includes('decor') || slug.includes('home')) return <Icons.Award className={`w-6 h-6 ${style.text}`} />;
    if (slug.includes('wellness') || slug.includes('glow')) return <Icons.Leaf className={`w-6 h-6 ${style.text}`} />;
    return <Icons.Sparkles className={`w-6 h-6 ${style.text}`} />;
  };

  if (!categories.length) return null;

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icons.LayoutGrid className="w-5 h-5 text-accent" />
          <h2 className="text-xl font-black text-ink tracking-tight">Shop by Category</h2>
        </div>
        <Link
          href="/search"
          className="text-xs font-black text-accent hover:underline flex items-center gap-1"
        >
          View All Categories →
        </Link>
      </div>

      {/* Visually Appealing Category Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {categories.map((cat, idx) => {
          const style = CATEGORY_STYLES[idx % CATEGORY_STYLES.length];
          const itemCount = cat._count?.products ?? cat.products_count ?? 0;

          return (
            <Link
              key={cat.id || cat.slug}
              href={`/category/${cat.slug}`}
              className="group relative overflow-hidden rounded-panel border border-line bg-surface hover:border-accent/50 hover:shadow-panel transition-all duration-300 transform hover:-translate-y-1 p-4 flex flex-col items-center text-center"
            >
              {/* Optional Background Banner Image Blur */}
              {cat.bannerUrl && (
                <div
                  className="absolute inset-0 opacity-5 group-hover:opacity-20 transition duration-500 scale-105"
                  style={{
                    backgroundImage: `url(${cat.bannerUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              )}

              {/* Icon Container with Gradient Background */}
              <div className={`relative z-10 w-14 h-14 rounded-full bg-gradient-to-br ${style.bg} border ${style.border} flex items-center justify-center transition transform group-hover:scale-110 shadow-subtle`}>
                {renderCategoryIcon(cat, style)}
              </div>

              {/* Category Name */}
              <div className="relative z-10 mt-3 w-full">
                <h3 className="text-xs sm:text-sm font-extrabold text-ink group-hover:text-accent transition truncate">
                  {cat.name}
                </h3>
                <p className="text-[11px] text-ink-subtle font-semibold mt-0.5">
                  {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
                </p>
              </div>

              {/* Hover Call-to-Action */}
              <span className="relative z-10 text-[10px] font-black text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-1.5 flex items-center gap-0.5">
                Explore <Icons.ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
