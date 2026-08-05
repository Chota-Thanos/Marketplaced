'use client';

import React from 'react';
import Link from 'next/link';
import { Video, ArrowRight, Play } from 'lucide-react';
import { Button } from '@ds/ui';

export default function ShoppertainmentPromo() {
  return (
    <section className="relative overflow-hidden rounded-panel bg-gradient-to-r from-success/10 via-pastel-green to-success/10 p-7 sm:p-8 border border-success/80 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-6">
      
      <div className="flex items-center gap-5">
        <div className="relative w-16 h-16 rounded-card bg-gradient-to-br from-success to-success text-ink-inverse flex items-center justify-center shrink-0 shadow-card group cursor-pointer">
          <Video className="w-8 h-8 animate-pulse" />
          <div className="absolute inset-0 rounded-card bg-surface/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
            <Play className="w-6 h-6 fill-ink-inverse" />
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="font-black text-lg text-ink flex items-center gap-2.5">
            <span>Shoppertainment Video Feed</span>
            <span className="bg-danger text-ink-inverse text-[10px] font-black px-2.5 py-0.5 rounded-pill uppercase tracking-wider shadow-subtle animate-pulse">
              LIVE
            </span>
          </h3>
          <p className="text-xs text-ink-muted font-medium max-w-xl leading-relaxed">
            Swipe through short video reels of products in action & buy directly from the playing clip with instant 1-click checkout.
          </p>
        </div>
      </div>

      <Button
        as={Link}
        href="/reels"
        variant="accent"
        className="shrink-0 shadow-card group"
      >
        <span>Explore Video Feed</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
      </Button>

    </section>
  );
}
