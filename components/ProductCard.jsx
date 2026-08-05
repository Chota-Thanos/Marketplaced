'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Star, ShoppingBag, Tag, MapPin, Award, Leaf, Cpu, Zap, Sparkles, Scale, Heart } from 'lucide-react';
import { Button, Card } from '@ds/ui';
import { useStore } from './providers/StoreProvider';
import { apiFetch } from '../lib/apiClient';

export default function ProductCard({
  product,
  onAddToCart,
  onQuickView,
  onToggleCompare,
  isCompared
}) {
  const [selectedStore, setSelectedStore] = useState(true);
  const { authToken } = useStore();
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);

  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!authToken) { window.location.href = '/account/wishlist'; return; }
    setWishlistBusy(true);
    try {
      await apiFetch('/wishlist-items', {
        method: 'POST', token: authToken, body: { product_id: product.id },
      });
      setWishlisted(true);
    } finally {
      setWishlistBusy(false);
    }
  };

  const renderBadgeIcon = (badgeName) => {
    if (badgeName.includes('Heritage') || badgeName.includes('GI')) return <Award className="w-3 h-3 text-warning" />;
    if (badgeName.includes('Organic') || badgeName.includes('Ayush') || badgeName.includes('Paraben')) return <Leaf className="w-3 h-3 text-success" />;
    if (badgeName.includes('ANC') || badgeName.includes('Battery') || badgeName.includes('Voice')) return <Cpu className="w-3 h-3 text-accent" />;
    if (badgeName.includes('Rebound') || badgeName.includes('Ortho') || badgeName.includes('Marathon')) return <Zap className="w-3 h-3 text-accent" />;
    return <Sparkles className="w-3 h-3 text-danger" />;
  };

  return (
    <Card
      interactive
      padded={false}
      className="group overflow-hidden flex flex-col justify-between h-full relative p-4 space-y-3"
    >
      
      {/* Top Badge Strip (Green NEW & Red SALE Tags + Compare Checkbox) */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5">
          {product.isNew && (
            <span className="bg-success text-ink-inverse text-[10px] font-black px-2.5 py-0.5 rounded-pill uppercase tracking-wider shadow-subtle">
              NEW
            </span>
          )}
          <span className="bg-danger text-ink-inverse text-[10px] font-black px-2.5 py-0.5 rounded-pill uppercase tracking-wider shadow-subtle flex items-center gap-1">
            <Tag className="w-3 h-3" /> {product.discount}% OFF
          </span>
        </div>

        {/* Compare Select Trigger */}
        {onToggleCompare && (
          <button
            onClick={() => onToggleCompare(product)}
            className={`text-[10px] font-black px-2.5 py-0.5 rounded-pill border transition flex items-center gap-1 ${
              isCompared
                ? 'bg-inverse text-ink-inverse border-line-strong'
                : 'bg-surface-sunken text-ink-muted hover:bg-surface-sunken border-line'
            }`}
          >
            <Scale className="w-3 h-3" />
            <span>{isCompared ? 'Comparing' : '+ Compare'}</span>
          </button>
        )}
      </div>

      {/* Product Image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-card bg-surface-muted border border-line">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          loading="lazy"
        />

        {/* Wishlist heart */}
        <button
          onClick={toggleWishlist}
          disabled={wishlistBusy}
          title={wishlisted ? 'Saved to wishlist' : 'Add to wishlist'}
          className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-pill flex items-center justify-center shadow-subtle transition disabled:opacity-50 ${
            wishlisted ? 'bg-danger text-ink-inverse' : 'bg-surface/90 text-ink-muted hover:text-danger'
          }`}
        >
          <Heart className={`w-4 h-4 ${wishlisted ? 'fill-ink-inverse' : ''}`} />
        </button>

        {/* Quick Specs Overlay */}
        <div className="absolute inset-0 bg-inverse/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center p-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onQuickView(product)}
            className="shadow-card"
          >
            Quick Specs
          </Button>
        </div>
      </div>

      {/* Content Details */}
      <div className="space-y-2 flex-1 flex flex-col justify-between">
        <div>
          {/* Marketplace Badges */}
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            {product.lifestyleBadges.map((badge, i) => (
              <span key={i} className="text-[10px] font-extrabold text-ink bg-surface-sunken border border-line px-2 py-0.5 rounded-pill flex items-center gap-1">
                {renderBadgeIcon(badge)}
                <span>{badge}</span>
              </span>
            ))}
          </div>

          <Link href={`/product/${product.id}`} className="group-hover:text-ink transition">
            <h3 className="font-extrabold text-sm text-ink line-clamp-2 leading-snug">
              {product.title}
            </h3>
          </Link>

          {/* Star Rating & Review Count */}
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex items-center gap-1 text-xs font-black text-ink">
              <Star className="w-3.5 h-3.5 fill-rating text-warning" />
              <span>{product.rating}</span>
            </div>
            <span className="text-xs text-ink-subtle font-semibold">({product.reviewsCount} reviews)</span>
          </div>

          {/* Radio Button for Local Store Availability */}
          <div className="mt-2.5 pt-2 border-t border-line flex items-center gap-2">
            <input
              type="radio"
              id={`store-${product.id}`}
              checked={selectedStore}
              onChange={() => setSelectedStore(!selectedStore)}
              className="accent-primary w-3.5 h-3.5 cursor-pointer"
            />
            <label htmlFor={`store-${product.id}`} className="text-[11px] font-bold text-ink-muted cursor-pointer flex items-center gap-1">
              <MapPin className="w-3 h-3 text-success shrink-0" />
              <span className="truncate">{product.localStoreName}</span>
            </label>
          </div>
        </div>

        {/* Pricing & Pill Buttons */}
        <div className="pt-2 border-t border-line space-y-2.5">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black text-ink">₹{product.price.toLocaleString('en-IN')}</span>
            <span className="text-xs text-ink-subtle line-through font-semibold">MRP ₹{product.mrp.toLocaleString('en-IN')}</span>
          </div>

          {/* Specified Pill Buttons: Dark Primary (Add to cart) & White Secondary (Buy now) */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="xs"
              onClick={() => onAddToCart(product)}
              leadingIcon={<ShoppingBag className="w-3.5 h-3.5" />}
            >
              Add to cart
            </Button>

            <Button variant="secondary" size="xs" onClick={() => onAddToCart(product)}>
              Buy now
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
