'use client';

import React, { useMemo } from 'react';
import { Button } from '@ds/ui';
import {
  X,
  Scale,
  Star,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  Award,
  MapPin,
  TrendingDown,
  Trophy
} from 'lucide-react';

/**
 * Computes a real, data-driven verdict from the products actually being
 * compared — no scripted "Product 1 wins for X" text naming products that
 * may not even be in the comparison. Only calls out a winner when the values
 * genuinely differ; ties are left alone rather than manufacturing a reason.
 */
function buildVerdict(products) {
  if (products.length < 2) return [];

  const notes = [];
  const byPrice = [...products].sort((a, b) => a.price - b.price);
  const byRating = [...products].sort((a, b) => b.rating - a.rating);
  const byReviews = [...products].sort((a, b) => b.reviewsCount - a.reviewsCount);
  const byDiscount = [...products].sort((a, b) => b.discount - a.discount);

  if (byPrice[0].price < byPrice[byPrice.length - 1].price) {
    notes.push({ icon: TrendingDown, text: `${trunc(byPrice[0].title)} is the cheapest at ₹${byPrice[0].price.toLocaleString('en-IN')}.` });
  }
  if (byRating[0].rating > 0 && byRating[0].rating > byRating[byRating.length - 1].rating) {
    notes.push({ icon: Star, text: `${trunc(byRating[0].title)} has the highest rating (${byRating[0].rating}★).` });
  }
  if (byReviews[0].reviewsCount > 0 && byReviews[0].reviewsCount > byReviews[byReviews.length - 1].reviewsCount) {
    notes.push({ icon: ShieldCheck, text: `${trunc(byReviews[0].title)} has the most verified reviews (${byReviews[0].reviewsCount}).` });
  }
  if (byDiscount[0].discount > 0 && byDiscount[0].discount > byDiscount[byDiscount.length - 1].discount) {
    notes.push({ icon: Sparkles, text: `${trunc(byDiscount[0].title)} has the deepest discount (${byDiscount[0].discount}% off).` });
  }

  return notes;
}

function trunc(title, len = 34) {
  return title.length > len ? title.slice(0, len - 1) + '…' : title;
}

/** Highlights the best value in a row (lowest price or highest rating/reviews/discount). */
function useBestIndex(products, key, mode = 'max') {
  return useMemo(() => {
    const values = products.map(p => p[key] ?? 0);
    const best = mode === 'max' ? Math.max(...values) : Math.min(...values);
    // Only highlight when values actually differ — an all-tied row has no "best".
    if (new Set(values).size < 2) return -1;
    return values.indexOf(best);
  }, [products, key, mode]);
}

export default function ProductComparisonModal({ isOpen, onClose, compareProducts, onAddToCart, onRemove }) {
  // filter(Boolean) because the hooks below run before the early return and
  // index into every entry — a single undefined in the list threw during render
  // and took the whole page down with a 500.
  const products = (compareProducts || []).filter(Boolean);
  const cheapestIdx = useBestIndex(products, 'price', 'min');
  const ratingIdx = useBestIndex(products, 'rating', 'max');
  const reviewsIdx = useBestIndex(products, 'reviewsCount', 'max');
  const discountIdx = useBestIndex(products, 'discount', 'max');
  const verdict = useMemo(() => buildVerdict(products), [products]);

  if (!isOpen || products.length === 0) return null;

  const addAllToCart = () => products.forEach(p => onAddToCart(p));

  return (
    <div className="fixed inset-0 z-50 bg-inverse/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-surface text-ink rounded-panel border border-line shadow-panel max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">

        {/* Modal Header */}
        <div className="bg-inverse text-ink-inverse p-5 border-b border-line-strong flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-card bg-agent/10 border border-agent/40 flex items-center justify-center text-agent">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-ink-inverse">Side-by-Side Product Comparison</h3>
              <p className="text-xs text-ink-subtle font-medium">Comparing {products.length} selected items</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {products.length > 1 && (
              <button
                onClick={addAllToCart}
                className="hidden sm:flex items-center gap-1.5 bg-agent text-ink font-black text-xs px-4 py-2 rounded-pill hover:bg-agent-hover transition"
              >
                <ShoppingBag className="w-3.5 h-3.5" /> Add All to Cart
              </button>
            )}
            <button onClick={onClose} className="text-ink-subtle hover:text-ink-inverse p-2 rounded-pill hover:bg-inverse transition">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Body: Comparison Table */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {products.length < 2 ? (
            <div className="bg-warning-soft border border-warning rounded-card p-4 text-xs font-bold text-warning">
              Add at least one more product to see a side-by-side comparison.
            </div>
          ) : verdict.length > 0 && (
            <div className="bg-pastel-green p-4 rounded-card border border-success flex items-start gap-3 text-xs">
              <div className="w-9 h-9 rounded-control bg-success text-ink-inverse flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h5 className="font-black text-ink">At a glance</h5>
                {verdict.map((note, i) => (
                  <p key={i} className="text-ink-muted font-medium leading-relaxed flex items-start gap-1.5">
                    <note.icon className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                    <span>{note.text}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Comparison Matrix Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-line">
                  <th className="p-4 bg-surface-muted font-black text-ink-subtle uppercase tracking-wider w-1/4">Specification</th>
                  {products.map((p) => (
                    <th key={p.id} className="p-4 w-1/3 min-w-[200px] align-top">
                      <div className="space-y-2 text-center relative">
                        {onRemove && (
                          <button
                            onClick={() => onRemove(p.id)}
                            title="Remove from comparison"
                            className="absolute -top-1 -right-1 w-6 h-6 rounded-pill bg-surface-sunken hover:bg-danger-soft text-ink-subtle hover:text-danger flex items-center justify-center transition"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <img src={p.image} alt={p.title} className="w-24 h-24 object-cover rounded-card mx-auto border border-line shadow-subtle" />
                        <h4 className="font-extrabold text-xs text-ink line-clamp-2">{p.title}</h4>
                        <Button
                          size="xs"
                          fullWidth
                          onClick={() => onAddToCart(p)}
                          className="shadow-subtle"
                          leadingIcon={<ShoppingBag className="w-3.5 h-3.5" />}
                        >
                          Add to Cart
                        </Button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-medium">

                {/* Row 1: Price & MRP */}
                <tr>
                  <td className="p-4 font-extrabold text-ink bg-surface-muted">Offer Price & MRP</td>
                  {products.map((p, i) => (
                    <td key={p.id} className={`p-4 text-center ${i === cheapestIdx ? 'bg-success-soft' : ''}`}>
                      <span className="font-black text-sm text-ink">₹{p.price.toLocaleString('en-IN')}</span>
                      {p.mrp > p.price && (
                        <span className="block text-[11px] text-ink-subtle line-through">MRP ₹{p.mrp.toLocaleString('en-IN')}</span>
                      )}
                      {p.discount > 0 && (
                        <span className={`inline-block mt-1 font-black text-[10px] px-2 py-0.5 rounded-pill ${i === discountIdx ? 'bg-success text-ink-inverse' : 'bg-danger-soft text-danger'}`}>
                          {p.discount}% OFF
                        </span>
                      )}
                      {i === cheapestIdx && (
                        <span className="block mt-1 text-[10px] font-black text-success uppercase tracking-wide">Best Price</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Row 2: Customer Rating & Reviews */}
                <tr>
                  <td className="p-4 font-extrabold text-ink bg-surface-muted">Rating & Reviews</td>
                  {products.map((p, i) => (
                    <td key={p.id} className={`p-4 text-center ${i === ratingIdx ? 'bg-success-soft' : ''}`}>
                      <div className="flex items-center justify-center gap-1 font-black text-ink">
                        <Star className="w-4 h-4 fill-rating text-warning" />
                        <span>{p.rating > 0 ? `${p.rating} / 5.0` : 'No ratings yet'}</span>
                      </div>
                      <span className="text-[11px] text-ink-subtle font-semibold block mt-0.5">
                        ({p.reviewsCount} {i === reviewsIdx && p.reviewsCount > 0 ? 'most' : ''} review{p.reviewsCount === 1 ? '' : 's'})
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Row 3: Category & Authenticity Standard */}
                <tr>
                  <td className="p-4 font-extrabold text-ink bg-surface-muted">Category & Quality Grade</td>
                  {products.map((p) => (
                    <td key={p.id} className="p-4 text-center font-bold text-ink">
                      <span>{p.category}</span>
                      {p.authenticityGrade && <span className="block text-[11px] text-warning mt-0.5 font-extrabold">{p.authenticityGrade}</span>}
                    </td>
                  ))}
                </tr>

                {/* Row 4: Lifestyle Badges */}
                <tr>
                  <td className="p-4 font-extrabold text-ink bg-surface-muted">Lifestyle Certifications</td>
                  {products.map((p) => (
                    <td key={p.id} className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        {(p.lifestyleBadges || []).length > 0
                          ? p.lifestyleBadges.map((badge, i) => (
                              <span key={i} className="text-[10px] font-bold bg-surface-sunken border border-line px-2 py-0.5 rounded-pill text-ink">
                                {badge}
                              </span>
                            ))
                          : <span className="text-ink-subtle text-[11px]">—</span>}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Row 5: Local Store Pickup */}
                <tr>
                  <td className="p-4 font-extrabold text-ink bg-surface-muted">Local Store Pickup</td>
                  {products.map((p) => (
                    <td key={p.id} className="p-4 text-center text-[11px]">
                      <span className="text-success font-bold flex items-center justify-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-success" /> {p.localStoreName || 'Not available'}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Row 6: Key Features */}
                <tr>
                  <td className="p-4 font-extrabold text-ink bg-surface-muted">Key Features</td>
                  {products.map((p) => (
                    <td key={p.id} className="p-4 text-left text-[11px]">
                      {(p.features || []).length > 0 ? (
                        <ul className="space-y-1 text-ink-muted">
                          {p.features.map((feat, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-ink-subtle">No features listed</span>
                      )}
                    </td>
                  ))}
                </tr>

              </tbody>
            </table>
          </div>

        </div>

      </div>
    </div>
  );
}
