'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Zap, Clock, Truck, ShieldCheck, CreditCard } from 'lucide-react';

// Default slides used when admin hasn't configured any yet
const DEFAULT_SLIDES = [
  {
    id: 1,
    badge: '🎉 FESTIVE SEASON SALE',
    title: 'Up to 60% OFF',
    subtitle: 'On Ethnic Wear, Footwear & More',
    cta_text: 'Shop the Sale',
    cta_url: '/search',
    bg_from: '#1a1a2e',
    bg_to: '#16213e',
    accent: '#f97316',
    countdown_end: null,
  },
  {
    id: 2,
    badge: '✨ NEW ARRIVALS',
    title: 'Fresh Styles. Every Week.',
    subtitle: 'Handcrafted ethnic wear, premium sneakers & more just landed',
    cta_text: 'Explore New Arrivals',
    cta_url: '/search?sort=newest',
    bg_from: '#0f2027',
    bg_to: '#203a43',
    accent: '#22d3ee',
    countdown_end: null,
  },
  {
    id: 3,
    badge: '🚚 FREE SHIPPING',
    title: 'Free Delivery on Orders ₹499+',
    subtitle: 'Express delivery to 19,000+ pincodes across India',
    cta_text: 'Start Shopping',
    cta_url: '/search',
    bg_from: '#134e4a',
    bg_to: '#0f766e',
    accent: '#4ade80',
    countdown_end: null,
  },
];

function CountdownTimer({ endTime }) {
  const [timeLeft, setTimeLeft] = useState({ h: '00', m: '00', s: '00' });

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endTime) - Date.now();
      if (diff <= 0) return;
      const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      setTimeLeft({ h, m, s });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  return (
    <div className="flex items-center gap-1.5 text-white/90">
      <Clock className="w-3.5 h-3.5" />
      <span className="text-sm font-black font-mono tracking-widest">
        {timeLeft.h}:{timeLeft.m}:{timeLeft.s}
      </span>
    </div>
  );
}

export default function HeroBanner({ slides: propSlides }) {
  const slides = (propSlides && propSlides.length > 0) ? propSlides : DEFAULT_SLIDES;
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent(i => (i + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setCurrent(i => (i - 1 + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const id = setInterval(next, 4000);
    return () => clearInterval(id);
  }, [paused, next, slides.length]);

  const slide = slides[current];

  return (
    <div className="space-y-0">
      {/* Main Banner */}
      <section
        className="relative rounded-panel overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        style={{
          background: `linear-gradient(135deg, ${slide.bg_from || '#1a1a2e'} 0%, ${slide.bg_to || '#16213e'} 100%)`,
          transition: 'background 0.6s ease',
        }}
      >
        {/* Background image (if provided) */}
        {slide.bg_image && (
          <div className="absolute inset-0">
            <img
              src={slide.bg_image}
              alt=""
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/20" />
          </div>
        )}

        {/* Decorative orbs */}
        <div
          className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: slide.accent || '#f97316' }}
        />
        <div
          className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ background: slide.accent || '#f97316' }}
        />

        <div className="relative z-10 px-8 py-10 sm:py-14 sm:px-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Left Content */}
          <div className="space-y-4 max-w-xl">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-pill text-xs font-black uppercase tracking-widest border"
              style={{
                color: slide.accent || '#f97316',
                borderColor: `${slide.accent || '#f97316'}40`,
                backgroundColor: `${slide.accent || '#f97316'}15`,
              }}
            >
              <Zap className="w-3 h-3" style={{ fill: slide.accent || '#f97316' }} />
              {slide.badge || 'Special Offer'}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
              {slide.title || 'Shop Now'}
            </h1>

            {/* Subtitle */}
            {slide.subtitle && (
              <p className="text-sm sm:text-base text-white/70 font-medium leading-relaxed">
                {slide.subtitle}
              </p>
            )}

            {/* Countdown */}
            {slide.countdown_end && (
              <CountdownTimer endTime={slide.countdown_end} />
            )}

            {/* CTA */}
            <Link
              href={slide.cta_url || '/search'}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-control font-black text-sm text-white shadow-lg transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0"
              style={{ backgroundColor: slide.accent || '#f97316' }}
            >
              {slide.cta_text || 'Shop Now'}
            </Link>
          </div>

          {/* Right: slide count indicator (desktop) */}
          <div className="hidden sm:flex flex-col items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Go to slide ${i + 1}`}
                className="transition-all duration-300 rounded-full"
                style={{
                  width: i === current ? '6px' : '6px',
                  height: i === current ? '24px' : '6px',
                  backgroundColor: i === current ? (slide.accent || '#f97316') : 'rgba(255,255,255,0.3)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Prev / Next arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous slide"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition border border-white/20 backdrop-blur-sm z-20"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              aria-label="Next slide"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition border border-white/20 backdrop-blur-sm z-20"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Mobile dots */}
        {slides.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:hidden z-20">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === current ? '20px' : '6px',
                  height: '6px',
                  backgroundColor: i === current ? (slide.accent || '#f97316') : 'rgba(255,255,255,0.4)',
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Trust Strip */}
      <div className="grid grid-cols-3 gap-0 bg-surface border border-line rounded-control overflow-hidden text-center mt-3">
        {[
          { icon: <Truck className="w-4 h-4" />, label: 'Free Delivery', sub: 'On orders ₹499+' },
          { icon: <CreditCard className="w-4 h-4" />, label: 'UPI 1-Click', sub: 'Instant checkout' },
          { icon: <ShieldCheck className="w-4 h-4" />, label: 'Verified Products', sub: 'Authenticity guaranteed' },
        ].map(({ icon, label, sub }, i) => (
          <div key={i} className={`py-2.5 px-3 flex flex-col items-center gap-0.5 ${i < 2 ? 'border-r border-line' : ''}`}>
            <div className="text-accent">{icon}</div>
            <span className="text-[10px] font-black text-ink">{label}</span>
            <span className="text-[9px] text-ink-subtle font-medium hidden sm:block">{sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
