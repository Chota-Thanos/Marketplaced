'use client';

import React from 'react';
import { ShieldCheck, Star } from 'lucide-react';
import { Button } from '@ds/ui';

export default function TrustBanner({ onOpenReviewModal, sampleProduct }) {
  return (
    <section className="relative overflow-hidden rounded-panel bg-gradient-to-r from-pastel-blue via-accent-soft/50 to-accent-soft/30 p-7 sm:p-8 border border-accent/70 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-6">
      
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-card bg-accent text-ink-inverse flex items-center justify-center shrink-0 shadow-card">
          <ShieldCheck className="w-8 h-8" />
        </div>
        
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-accent-soft text-accent border border-accent">
              NATIONAL STANDARD
            </span>
            <h3 className="font-black text-base text-ink">
              BIS IS 19000:2022 Compliance Guaranteed
            </h3>
          </div>

          <p className="text-xs text-ink-muted font-medium max-w-xl leading-relaxed">
            We eliminate fake reviews. Reviews are strictly locked until your database order status reaches{' '}
            <span className="text-accent font-bold">Delivered</span>. Upload a video review to get{' '}
            <span className="text-danger font-bold">+₹50 direct UPI cashback</span>!
          </p>
        </div>
      </div>

      <Button
        onClick={() => sampleProduct && onOpenReviewModal(sampleProduct)}
        className="shrink-0 shadow-card"
      >
        <Star className="w-4 h-4 fill-current" />
        <span>Submit Verified Review</span>
      </Button>

    </section>
  );
}
