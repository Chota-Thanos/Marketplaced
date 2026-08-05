"use client";

import { PackagePlus } from 'lucide-react';

export function BundleDealWidget({ bundle }) {
  if (!bundle) return null;
  
  return (
    <div className="bg-gradient-to-r from-inverse to-inverse border border-line-strong rounded-control p-4 mt-6">
      <div className="flex items-center space-x-2 mb-3">
        <PackagePlus className="text-highlight w-5 h-5" />
        <h3 className="font-semibold text-ink-inverse">Bundle & Save</h3>
      </div>
      
      <p className="text-sm text-ink-subtle mb-4">{bundle.name}</p>
      
      <div className="flex items-center justify-between bg-inverse p-3 rounded-control border border-line-strong">
        <div className="flex-1 text-center">
          <p className="text-xs text-ink-subtle truncate">{bundle.primaryProduct?.name || 'Primary Item'}</p>
        </div>
        <div className="text-ink-subtle px-2">+</div>
        <div className="flex-1 text-center">
          <p className="text-xs text-ink-subtle truncate">{bundle.secondaryProduct?.name || 'Secondary Item'}</p>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-highlight">₹{bundle.bundle_price}</p>
          <p className="text-xs text-ink-subtle line-through">₹{(parseFloat(bundle.primaryProduct?.base_price || 0) + parseFloat(bundle.secondaryProduct?.base_price || 0)).toFixed(2)}</p>
        </div>
        <button className="bg-highlight text-ink px-4 py-2 rounded-control font-medium hover:bg-highlight transition-colors">
          Add Bundle to Cart
        </button>
      </div>
    </div>
  );
}
