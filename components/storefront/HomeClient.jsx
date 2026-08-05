'use client';

import React, { useState } from 'react';
import { useStore } from '../providers/StoreProvider';
import { Star, Sparkles, TrendingUp, Flame, Gift } from 'lucide-react';

import HeroBanner from './home/HeroBanner';
import CategoryGrid from './home/CategoryGrid';
import ProductRow from './home/ProductRow';
import ShoppertainmentPromo from './home/ShoppertainmentPromo';
import TrustBanner from './home/TrustBanner';
import FloatingCompareBar from './home/FloatingCompareBar';

import ProductComparisonModal from '../ProductComparisonModal';
import AIAgentCopilot from '../AIAgentCopilot';
import VerifiedReviewModal from '../VerifiedReviewModal';

export default function HomeClient({ categories, products, hasReels = false, heroBannerSlides }) {
  const { handleAddToCart, setIsVoiceOpen } = useStore();
  const [reviewProduct, setReviewProduct] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showFloatingPromo, setShowFloatingPromo] = useState(false); // disabled

  // Comparison State
  const [compareList, setCompareList] = useState([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const handleToggleCompare = (product) => {
    setCompareList((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) return prev.filter((p) => p.id !== product.id);
      if (prev.length >= 3) { alert('You can compare up to 3 products at a time!'); return prev; }
      return [...prev, product];
    });
  };

  // Filter products by active category
  const categoryProducts = activeCategory === 'all'
    ? products
    : products.filter(p => p.categoryId === activeCategory || p.category?.slug === activeCategory);

  // Derive product sections
  const recommended = categoryProducts.slice(0, 10);
  const newArrivals  = categoryProducts.filter(p => p.isNew).slice(0, 10);
  const bestSellers  = [...categoryProducts].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 10);

  const sharedRowProps = {
    onAddToCart: handleAddToCart,
    onToggleCompare: handleToggleCompare,
    compareList,
  };

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">

      {/* 1. PROMOTIONAL HERO BANNER CAROUSEL */}
      <HeroBanner slides={heroBannerSlides} />

      {/* 2. COMPACT CATEGORY ICON ROW */}
      <CategoryGrid
        categories={categories}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />

      {/* 3. RECOMMENDED FOR YOU */}
      <ProductRow
        title="Recommended for You"
        icon={<Sparkles className="w-4 h-4" />}
        accentColor="text-warning"
        products={recommended}
        viewAllHref="/search"
        {...sharedRowProps}
      />

      {/* 4. NEW ARRIVALS */}
      {newArrivals.length > 0 && (
        <ProductRow
          title="New Arrivals"
          icon={<Gift className="w-4 h-4" />}
          accentColor="text-accent"
          products={newArrivals}
          viewAllHref="/search?sort=newest"
          {...sharedRowProps}
        />
      )}

      {/* 5. SHOPPERTAINMENT VIDEO FEED — only when reels exist */}
      {hasReels && <ShoppertainmentPromo />}

      {/* 6. BEST SELLERS */}
      <ProductRow
        title="Best Sellers"
        icon={<Flame className="w-4 h-4" />}
        accentColor="text-danger"
        products={bestSellers}
        viewAllHref="/search?sort=rating"
        {...sharedRowProps}
      />

      {/* 7. EDITORIAL / PROMO BAND */}
      <div className="relative rounded-panel overflow-hidden bg-gradient-to-br from-stone-800 to-stone-900 text-white">
        <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=60)', backgroundSize: 'cover', backgroundPosition: 'center'}} />
        <div className="relative z-10 flex flex-col items-center text-center py-14 px-6 space-y-4">
          <p className="text-xs font-black uppercase tracking-widest text-white/60">Trending This Season</p>
          <h2 className="text-3xl sm:text-4xl font-black leading-tight">The Festive Edit</h2>
          <p className="text-white/70 text-sm font-medium max-w-sm">Discover handcrafted styles curated for every occasion — from weddings to workdays</p>
          <a href="/category/ethnic-wear" className="mt-2 inline-flex items-center gap-2 px-6 py-3 bg-white text-stone-900 font-black text-sm rounded-control hover:bg-stone-100 transition-all hover:-translate-y-0.5">
            <TrendingUp className="w-4 h-4" />
            Shop the Edit
          </a>
        </div>
      </div>

      {/* 8. TRUST & COMPLIANCE BANNER */}
      <TrustBanner
        onOpenReviewModal={(p) => setReviewProduct(p)}
        sampleProduct={products[0]}
      />

      {/* 9. FLOATING STICKY COMPARISON BAR */}
      <FloatingCompareBar
        compareList={compareList}
        onLaunchMatrix={() => setIsCompareModalOpen(true)}
        onClearCompare={() => setCompareList([])}
      />


      {/* 11. AI SHOPPING AGENT COPILOT */}
      <AIAgentCopilot
        products={products}
        onOpenCompare={(prods) => { setCompareList(prods); setIsCompareModalOpen(true); }}
        onAddToCart={handleAddToCart}
      />

      {/* 12. PRODUCT COMPARISON MODAL */}
      <ProductComparisonModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        compareProducts={compareList}
        onAddToCart={handleAddToCart}
        onRemove={(id) => setCompareList(list => list.filter(p => p.id !== id))}
      />

      {/* 13. VERIFIED REVIEW SUBMISSION MODAL */}
      <VerifiedReviewModal
        isOpen={!!reviewProduct}
        onClose={() => setReviewProduct(null)}
        product={reviewProduct}
        onSubmitReview={(rev) => alert(`Thank you ${rev.user}! Your review is sent for staff approval.`)}
      />
    </div>
  );
}
