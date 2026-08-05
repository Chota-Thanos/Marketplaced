'use client';

import React, { useState } from 'react';
import { useStore } from '../providers/StoreProvider';

import HeroBanner from './home/HeroBanner';
import CategoryGrid from './home/CategoryGrid';
import ShoppertainmentPromo from './home/ShoppertainmentPromo';
import FeaturedProductsSection from './home/FeaturedProductsSection';
import TrustBanner from './home/TrustBanner';
import FloatingCompareBar from './home/FloatingCompareBar';
import FloatingPromoBox from './home/FloatingPromoBox';

import ProductComparisonModal from '../ProductComparisonModal';
import AIAgentCopilot from '../AIAgentCopilot';
import VerifiedReviewModal from '../VerifiedReviewModal';

export default function HomeClient({ categories, products, hasReels = false }) {
  const { handleAddToCart, setIsVoiceOpen } = useStore();
  const [reviewProduct, setReviewProduct] = useState(null);
  const [searchFilter] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showFloatingPromo, setShowFloatingPromo] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Comparison State
  const [compareList, setCompareList] = useState([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

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

  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === 'all' || p.categoryId === activeCategory;
    const matchesSearch = !searchFilter || 
      p.title.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      
      {/* 1. HERO BANNER */}
      <HeroBanner onOpenVoice={() => setIsVoiceOpen(true)} hasReels={hasReels} />

      {/* 2. SHOP BY CATEGORY GRID */}
      <CategoryGrid
        categories={categories}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />

      {/* 3. SHOPPERTAINMENT VIDEO FEED PROMO — only when a seller has actually
          opted a product into it; otherwise this would promote an empty page. */}
      {hasReels && <ShoppertainmentPromo />}

      {/* 4. FEATURED PRODUCTS CATALOG GRID */}
      <FeaturedProductsSection
        filteredProducts={filteredProducts}
        handleAddToCart={handleAddToCart}
        setReviewProduct={setReviewProduct}
        handleToggleCompare={handleToggleCompare}
        compareList={compareList}
        carouselIndex={carouselIndex}
        setCarouselIndex={setCarouselIndex}
      />

      {/* 5. TRUST & COMPLIANCE BANNER */}
      <TrustBanner 
        onOpenReviewModal={(p) => setReviewProduct(p)} 
        sampleProduct={products[0]} 
      />

      {/* 6. FLOATING STICKY COMPARISON BAR */}
      <FloatingCompareBar 
        compareList={compareList} 
        onLaunchMatrix={() => setIsCompareModalOpen(true)}
        onClearCompare={() => setCompareList([])}
      />

      {/* 7. FLOATING PROMOTIONAL BOX */}
      <FloatingPromoBox 
        isVisible={showFloatingPromo} 
        onClose={() => setShowFloatingPromo(false)} 
      />

      {/* 8. AI SHOPPING AGENT COPILOT */}
      <AIAgentCopilot
        onOpenCompare={(prods) => {
          setCompareList(prods);
          setIsCompareModalOpen(true);
        }}
        onAddToCart={handleAddToCart}
      />

      {/* 9. PRODUCT COMPARISON MODAL */}
      <ProductComparisonModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        compareProducts={compareList}
        onAddToCart={handleAddToCart}
        onRemove={(id) => setCompareList(list => list.filter(p => p.id !== id))}
      />

      {/* 10. VERIFIED REVIEW SUBMISSION MODAL */}
      <VerifiedReviewModal
        isOpen={!!reviewProduct}
        onClose={() => setReviewProduct(null)}
        product={reviewProduct}
        onSubmitReview={(rev) => alert(`Thank you ${rev.user}! Your review is sent for staff approval.`)}
      />

    </div>
  );
}
