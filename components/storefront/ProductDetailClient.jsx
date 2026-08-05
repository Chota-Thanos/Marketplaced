'use client';

import React, { useState } from 'react';
import { Button } from '@ds/ui';
import Link from 'next/link';
import { useStore } from '../providers/StoreProvider';
import ProductReviews from '../reviews/ProductReviews';
import ProductQnA from './ProductQnA';
import Product360Viewer from './Product360Viewer';
import RelatedProducts from './RelatedProducts';
import ProductZoomLens from './ProductZoomLens';
import HotspotDetailModal from './HotspotDetailModal';
import { apiFetch } from '../../lib/apiClient';
import { brand } from '@ds/brand';
import {
  Star,
  ShoppingBag,
  Tag,
  MapPin,
  Award,
  Leaf,
  Cpu,
  Zap,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Truck,
  Heart,
  XCircle,
  RotateCcw,
  Camera,
  CheckCircle
} from 'lucide-react';

export default function ProductDetailClient({ product }) {
  const { handleAddToCart, authToken } = useStore();
  const [selectedImage, setSelectedImage] = useState(product.images[0]);
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0] || null);
  const [pincode, setPincode] = useState('');
  const [isCheckingPincode, setIsCheckingPincode] = useState(false);
  const [pincodeResult, setPincodeResult] = useState(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [viewMode, setViewMode] = useState('photos'); // 'photos' | 'spin'
  const [activeHotspot, setActiveHotspot] = useState(null);

  const hasSpin = product.spinImages?.length > 0;
  const hasHotspots = product.hotspots?.length > 0;
  // Hotspots are authored against the main image only (that's what the admin
  // canvas places them on), so only overlay them while it's the one showing.
  const showHotspotsOnCurrentImage = hasHotspots && selectedImage === product.images[0];

  const handleCheckPincode = async () => {
    setIsCheckingPincode(true);
    setPincodeResult(null);
    try {
      const res = await apiFetch('/serviceability', { method: 'POST', body: { pincode } });
      setPincodeResult(res.data);
    } catch (e) {
      setPincodeResult({ serviceable: false, message: e.message });
    } finally {
      setIsCheckingPincode(false);
    }
  };

  const toggleWishlist = async () => {
    if (!authToken) { window.location.href = '/account/wishlist'; return; }
    setWishlistBusy(true);
    try {
      await apiFetch('/wishlist-items', {
        method: 'POST',
        token: authToken,
        body: { product_id: product.id, variant_id: selectedVariant?.id || null },
      });
      setWishlisted(true);
    } finally {
      setWishlistBusy(false);
    }
  };

  const renderBadgeIcon = (badgeName) => {
    if (badgeName.includes('Heritage') || badgeName.includes('GI')) return <Award className="w-4 h-4 text-warning" />;
    if (badgeName.includes('Organic') || badgeName.includes('Ayush') || badgeName.includes('Paraben')) return <Leaf className="w-4 h-4 text-success" />;
    if (badgeName.includes('ANC') || badgeName.includes('Battery') || badgeName.includes('Voice')) return <Cpu className="w-4 h-4 text-accent" />;
    if (badgeName.includes('Rebound') || badgeName.includes('Ortho') || badgeName.includes('Marathon')) return <Zap className="w-4 h-4 text-accent" />;
    return <Sparkles className="w-4 h-4 text-danger" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-semibold text-ink-subtle mb-6">
        <Link href="/" className="hover:text-ink transition flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Store
        </Link>
        <span>/</span>
        <span className="capitalize">{product.category?.name || 'Category'}</span>
        <span>/</span>
        <span className="text-ink truncate max-w-[200px]">{product.title}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left: Image Gallery */}
        <div className="space-y-4">
          {hasSpin && (
            <div className="flex items-center gap-1 bg-surface-sunken rounded-pill p-1 w-fit">
              <button
                onClick={() => setViewMode('photos')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-pill text-xs font-bold transition ${
                  viewMode === 'photos' ? 'bg-surface shadow-subtle text-ink' : 'text-ink-subtle'
                }`}
              >
                <Camera className="w-3.5 h-3.5" /> Photos
              </button>
              <button
                onClick={() => setViewMode('spin')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-pill text-xs font-bold transition ${
                  viewMode === 'spin' ? 'bg-surface shadow-subtle text-ink' : 'text-ink-subtle'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" /> 360°
              </button>
            </div>
          )}

          {viewMode === 'spin' && hasSpin ? (
            <Product360Viewer images={product.spinImages} alt={product.title} />
          ) : (
            <ProductZoomLens src={selectedImage} alt={product.title} className="aspect-square bg-canvas rounded-panel overflow-hidden border border-line group">
              <img
                src={selectedImage || 'https://via.placeholder.com/800'}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              {product.isNew && (
                <span className="absolute top-4 left-4 z-10 bg-success text-ink-inverse text-[10px] font-black px-3 py-1 rounded-pill uppercase tracking-wider shadow-card">
                  NEW ARRIVAL
                </span>
              )}

              {/* Interactive hotspot pins — clicking one opens a macro
                  close-up with detail + tech specs. Previously configured in
                  the admin but never rendered anywhere on the storefront. */}
              {showHotspotsOnCurrentImage && product.hotspots.map((hs) => (
                <button
                  key={hs.id}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setActiveHotspot(hs); }}
                  style={{ top: hs.top, left: hs.left }}
                  title={hs.title}
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-pill bg-surface/90 border-2 border-accent text-accent flex items-center justify-center shadow-card hover:scale-110 hover:bg-accent hover:text-ink-inverse transition-all before:absolute before:inset-0 before:rounded-pill before:border-2 before:border-accent before:animate-ping before:opacity-60"
                >
                  <span className="relative text-xs font-black">+</span>
                </button>
              ))}
            </ProductZoomLens>
          )}

          {product.images?.length > 1 && viewMode === 'photos' && (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 shrink-0 rounded-card overflow-hidden border-2 transition ${selectedImage === img ? 'border-ink' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover bg-canvas" />
                </button>
              ))}
            </div>
          )}

          {showHotspotsOnCurrentImage && (
            <p className="text-[11px] text-ink-subtle font-medium flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-accent" /> Tap the <span className="font-black text-accent">+</span> markers on the photo for close-up details
            </p>
          )}
        </div>

        <HotspotDetailModal hotspot={activeHotspot} onClose={() => setActiveHotspot(null)} />

        {/* Right: Product Info */}
        <div className="space-y-6">
          
          <div className="space-y-3">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {product.lifestyleBadges.map((badge, i) => (
                <span key={i} className="text-[11px] font-extrabold text-ink bg-surface-sunken border border-line px-2.5 py-1 rounded-pill flex items-center gap-1.5">
                  {renderBadgeIcon(badge)}
                  <span>{badge}</span>
                </span>
              ))}
            </div>

            <h1 className="text-3xl font-black text-ink leading-tight">
              {product.title}
            </h1>

            {/* Ratings */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-warning-soft border border-warning px-2 py-1 rounded-control">
                <Star className="w-4 h-4 fill-rating text-warning" />
                <span className="text-xs font-black text-warning">{product.rating}</span>
              </div>
              <span className="text-sm font-semibold text-ink-subtle underline decoration-line-strong underline-offset-4 cursor-pointer hover:text-ink">
                Read {product.reviewsCount} Verified Reviews
              </span>
            </div>
          </div>

          {/* Pricing */}
          <div className="pt-4 border-t border-line">
            <div className="flex items-end gap-3 mb-1">
              <span className="text-4xl font-black text-ink">₹{product.price.toLocaleString('en-IN')}</span>
              <span className="text-lg text-ink-subtle line-through font-semibold mb-1">MRP ₹{product.mrp.toLocaleString('en-IN')}</span>
              {product.discount > 0 && (
                <span className="bg-danger text-ink-inverse text-xs font-black px-2 py-1 rounded-control mb-1.5">
                  {product.discount}% OFF
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-success flex items-center gap-1 mt-2">
              <CheckCircle2 className="w-4 h-4" /> Inclusive of all taxes
            </p>
          </div>

          {/* Variants */}
          {product.variants?.length > 0 && (
            <div className="pt-4 space-y-3">
              <h3 className="text-sm font-bold text-ink">Select Variant</h3>
              <div className="flex flex-wrap gap-3">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2 rounded-control text-sm font-semibold border-2 transition ${
                      selectedVariant?.id === v.id 
                        ? 'border-ink bg-surface-muted text-ink' 
                        : 'border-line text-ink-subtle hover:border-line hover:text-ink-muted'
                    }`}
                  >
                    {[v.color, v.size].filter(Boolean).join(' - ')}
                  </button>
                ))}
              </div>
              {selectedVariant?.stock <= 5 && selectedVariant?.stock > 0 && (
                <p className="text-xs font-bold text-danger">Only {selectedVariant.stock} left in stock!</p>
              )}
              {selectedVariant?.stock === 0 && (
                <p className="text-xs font-bold text-danger">Out of Stock</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <Button
              size="lg"
              onClick={() => handleAddToCart(product, selectedVariant)}
              disabled={selectedVariant?.stock === 0}
              className="shadow-hover"
              leadingIcon={<ShoppingBag className="w-5 h-5" />}
            >
              {selectedVariant?.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>

            <Button
              variant="highlight"
              size="lg"
              onClick={() => handleAddToCart(product, selectedVariant)}
              disabled={selectedVariant?.stock === 0}
              className="shadow-hover"
              leadingIcon={<Zap className="w-5 h-5 fill-current" />}
            >
              Buy Now via UPI
            </Button>
          </div>

          <button
            onClick={toggleWishlist}
            disabled={wishlistBusy}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-pill text-sm font-bold border-2 transition disabled:opacity-50 ${
              wishlisted
                ? 'bg-danger-soft border-danger text-danger'
                : 'bg-surface border-line text-ink-muted hover:border-line-strong'
            }`}
          >
            <Heart className={`w-4 h-4 ${wishlisted ? 'fill-danger text-danger' : ''}`} />
            {wishlisted ? 'Saved to Wishlist' : 'Add to Wishlist'}
          </button>

          {/* Delivery & Pincode */}
          <div className="bg-canvas p-5 rounded-card border border-line space-y-4 mt-6">
            <div className="flex items-center gap-2 text-sm font-bold text-ink">
              <Truck className="w-5 h-5 text-accent" />
              <span>Check Delivery Speed</span>
            </div>
            
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Enter Pincode (e.g. 560103)" 
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                maxLength={6}
                className="flex-1 bg-surface border border-line rounded-control px-4 py-2 text-sm font-semibold focus:outline-none focus:border-ink"
              />
              <button 
                onClick={handleCheckPincode}
                disabled={!pincode || pincode.length < 6 || isCheckingPincode}
                className="bg-accent text-ink-inverse px-6 py-2 rounded-control text-sm font-bold disabled:opacity-50"
              >
                {isCheckingPincode ? 'Checking...' : 'Check'}
              </button>
            </div>
            {pincodeResult && (
              <p className={`text-xs font-bold flex items-center gap-1.5 ${pincodeResult.serviceable ? 'text-success' : 'text-danger'}`}>
                {pincodeResult.serviceable ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {pincodeResult.message}
              </p>
            )}
          </div>

          {/* Key Features */}
          {product.features?.length > 0 && (
            <div className="pt-6 border-t border-line">
              <h3 className="text-lg font-black text-ink mb-3">Key Features</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
                {product.features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink-muted font-medium">
                    <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Description Section */}
          <div className="pt-6 border-t border-line">
            <h3 className="text-lg font-black text-ink mb-3">Product Description</h3>
            <div className="prose prose-slate prose-sm max-w-none">
              <p className="text-ink-muted font-medium leading-relaxed">
                {product.description || 'No description available for this product.'}
              </p>
            </div>
          </div>

          {/* Trust Banner Inline */}
          <div className="bg-pastel-blue p-4 rounded-control border border-accent flex items-start gap-3 mt-4">
            <ShieldCheck className="w-6 h-6 text-accent shrink-0" />
            <div>
              <h4 className="text-xs font-black text-ink">100% Authentic Product</h4>
              <p className="text-[11px] text-ink-muted mt-0.5">Verified by {brand.nameDisplay} Quality Check. Eligible for 7-day hassle-free returns.</p>
            </div>
          </div>

        </div>
      </div>

      <div className="mt-16 pt-10 border-t border-line">
        <ProductReviews productId={product.id} />
      </div>

      <div className="pt-4">
        <ProductQnA productId={product.id} />
      </div>

      <div className="mt-16 pt-10 border-t border-line">
        <RelatedProducts productId={product.id} />
      </div>
    </div>
  );
}
