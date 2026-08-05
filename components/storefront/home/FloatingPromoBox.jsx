'use client';

import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@ds/ui';

export default function FloatingPromoBox({ isVisible, onClose }) {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-30 max-w-xs bg-surface/95 backdrop-blur-md border border-line/90 rounded-panel p-4 shadow-panel space-y-3 flex flex-col justify-between animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-line pb-2">
        <span className="text-[10px] font-black text-danger uppercase tracking-widest flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Festive Sale Active
        </span>
        <button
          onClick={onClose}
          className="text-ink-subtle hover:text-ink p-1 rounded-pill hover:bg-surface-sunken transition"
          aria-label="Close Promo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="space-y-1">
        <h4 className="text-xs font-black text-ink">Kitchen & Festive WINTER SALE</h4>
        <p className="text-[11px] text-ink-subtle font-medium leading-normal">
          Use code <span className="text-ink font-bold font-mono bg-surface-sunken px-1.5 py-0.5 rounded border border-line">BHARAT15</span> for extra 15% OFF on UPI payments!
        </p>
      </div>

      {/* CTA Button */}
      <Button
        onClick={() => {
          navigator.clipboard?.writeText('BHARAT15');
          alert('Promo code BHARAT15 copied to clipboard!');
        }}
        size="xs"
        fullWidth
      >
        <span>CLAIM 15% OFF</span>
      </Button>

    </div>
  );
}
