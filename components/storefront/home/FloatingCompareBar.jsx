'use client';

import React from 'react';
import { Scale, X } from 'lucide-react';

export default function FloatingCompareBar({ compareList, onLaunchMatrix, onClearCompare }) {
  if (!compareList || compareList.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-ink/95 backdrop-blur-md text-ink-inverse px-6 py-3.5 rounded-pill shadow-panel border-2 border-highlight flex items-center gap-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
      
      <div className="flex items-center gap-2 text-xs font-bold">
        <Scale className="w-4 h-4 text-highlight" />
        <span>Comparing {compareList.length} Items</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onLaunchMatrix}
          className="bg-highlight hover:bg-highlight-hover text-ink font-black text-xs px-4 py-1.5 rounded-pill transition shadow-subtle"
        >
          Launch Matrix
        </button>

        <button
          onClick={onClearCompare}
          className="text-ink-subtle hover:text-ink-inverse p-1 rounded-pill transition"
          aria-label="Clear Comparison"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
