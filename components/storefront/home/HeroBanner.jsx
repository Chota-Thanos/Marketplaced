'use client';

import React from 'react';
import Link from 'next/link';
import { Video, Mic, Zap, ShieldCheck, Truck, CreditCard } from 'lucide-react';
import { Button } from '@ds/ui';

/**
 * The homepage's headline claim used to be "India's Premier Video-First
 * Shopping Experience", with Reels as the primary call to action — regardless
 * of whether any seller had ever recorded a clip. Reels are opt-in per
 * product, so most stores will have few or none, and a headline built around
 * a feature that might not exist reads as broken rather than aspirational.
 *
 * The identity here is the catalogue and checkout, which always exist. Reels
 * only earn a mention — a small, secondary CTA — once `hasReels` says a clip
 * is actually live.
 */
export default function HeroBanner({ onOpenVoice, hasReels = false }) {
  return (
    <section className="relative rounded-panel overflow-hidden p-8 sm:p-12 lg:p-16 bg-gradient-to-br from-pastel-tan via-surface to-warning-soft/40 border border-warning/60 text-ink shadow-subtle transition-all duration-300">

      {/* Decorative Background Accents */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent/5 rounded-pill blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-warning/10 rounded-pill blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl space-y-6">

        {/* Sale Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-pill bg-success/10 border border-success/30 text-success text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-subtle">
          <Zap className="w-4 h-4 fill-success text-success animate-bounce" />
          <span>Festive Season Sale • Up to 60% OFF</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-ink">
          India's Marketplace for <span className="bg-gradient-to-r from-accent via-accent to-danger bg-clip-text text-transparent">Authentic</span> Everyday Shopping.
        </h1>

        {/* Hero Subtitle */}
        <p className="text-base sm:text-lg text-ink-muted font-medium leading-relaxed max-w-2xl">
          Discover authentic Indian ethnic wear, smart tech, and handcrafted heritage decor with 1-click UPI checkout and vernacular voice search across languages.
        </p>

        {/* CTA Actions */}
        <div className="pt-2 flex items-center gap-3.5 flex-wrap">
          <Button
            as={Link}
            href="/search"
            variant="accent"
            size="lg"
            className="shadow-card"
          >
            <span>Shop Now</span>
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={onOpenVoice}
            leadingIcon={<Mic className="w-4.5 h-4.5 text-accent" />}
          >
            Vernacular Voice Search
          </Button>

          {/* Only shown once a seller has actually opted a product into Reels —
              otherwise this points at an empty page. */}
          {hasReels && (
            <Button
              as={Link}
              href="/reels"
              variant="ghost"
              size="lg"
              leadingIcon={<Video className="w-4.5 h-4.5" />}
            >
              Watch &amp; Shop Reels
            </Button>
          )}
        </div>

        {/* Trust Chips / Feature Highlights */}
        <div className="pt-4 border-t border-line/70 flex items-center gap-6 text-xs font-bold text-ink-muted flex-wrap">
          <div className="flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-success" />
            <span>Instant UPI 1-Click</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-accent" />
            <span>Express Shiprocket Delivery</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-warning" />
            <span>BIS IS 19000 Verified</span>
          </div>
        </div>

      </div>
    </section>
  );
}
