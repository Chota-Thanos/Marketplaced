'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { brand } from '@ds/brand';
import { StoreProvider, useStore } from './StoreProvider';
import { FeatureFlagProvider } from './FeatureFlagProvider';
import Navbar from '../Navbar';
import CheckoutDrawer from '../CheckoutDrawer';
import VernacularVoiceModal from '../VernacularVoiceModal';

function LayoutInner({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = pathname?.startsWith('/admin');

  const { 
    cartItems, 
    cartCount, 
    isCartOpen, 
    setIsCartOpen, 
    isVoiceOpen, 
    setIsVoiceOpen, 
    handleUpdateQty, 
    handleRemoveItem, 
    clearCart 
  } = useStore();
  
  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col justify-between relative font-sans">
      <Navbar 
        cartCount={cartCount} 
        onOpenCart={() => setIsCartOpen(true)}
        onOpenVoice={() => setIsVoiceOpen(true)}
        currentView="store"
        onToggleView={() => {}}
      />
      
      <main className="flex-1 w-full">
        {children}
      </main>

      <footer className="border-t border-line bg-surface text-ink mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6">

          {/* Top 4-column grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-10 border-b border-line">

            {/* Brand column */}
            <div className="col-span-2 md:col-span-1 space-y-4">
              <div>
                <span className="font-black text-xl text-ink">{brand.nameDisplay}<span className="text-danger">{brand.nameAccent}</span></span>
                <p className="text-xs text-ink-subtle font-medium mt-2 leading-relaxed">
                  India's trusted marketplace for authentic clothing, footwear, and lifestyle products.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {[{label:'FB',href:'#'},{label:'IG',href:'#'},{label:'TW',href:'#'},{label:'YT',href:'#'}].map(s=>(
                  <a key={s.label} href={s.href} className="w-8 h-8 rounded-full bg-surface-muted border border-line flex items-center justify-center text-[10px] font-black text-ink-muted hover:bg-ink hover:text-ink-inverse hover:border-ink transition">
                    {s.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Shop column */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-ink uppercase tracking-widest">Shop</h4>
              <ul className="space-y-2.5 text-xs font-semibold text-ink-muted">
                {[
                  {label:'New Arrivals', href:'/search?sort=newest'},
                  {label:'Best Sellers', href:'/search?sort=rating'},
                  {label:'Ethnic Wear', href:'/category/ethnic-wear'},
                  {label:'Footwear', href:'/category/footwear'},
                  {label:'Electronics', href:'/category/electronics'},
                  {label:'Today\'s Deals', href:'/search'},
                ].map(l=>(
                  <li key={l.label}><a href={l.href} className="hover:text-ink transition">{l.label}</a></li>
                ))}
              </ul>
            </div>

            {/* Help column */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-ink uppercase tracking-widest">Help</h4>
              <ul className="space-y-2.5 text-xs font-semibold text-ink-muted">
                {[
                  {label:'Track My Order', href:'/account/orders'},
                  {label:'Returns & Refunds', href:'#'},
                  {label:'Size Guide', href:'#'},
                  {label:'FAQs', href:'#'},
                  {label:'Contact Support', href:'#'},
                ].map(l=>(
                  <li key={l.label}><a href={l.href} className="hover:text-ink transition">{l.label}</a></li>
                ))}
              </ul>
            </div>

            {/* Policy column */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-ink uppercase tracking-widest">Company</h4>
              <ul className="space-y-2.5 text-xs font-semibold text-ink-muted">
                {[
                  {label:'About Us', href:'#'},
                  {label:'Privacy Policy', href:'#'},
                  {label:'Terms of Service', href:'#'},
                  {label:'Seller Program', href:'#'},
                  {label:'BIS IS 19000 Compliance', href:'#'},
                ].map(l=>(
                  <li key={l.label}><a href={l.href} className="hover:text-ink transition">{l.label}</a></li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-ink-subtle font-semibold">
            <span>© 2026 {brand.legalEntity}. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <span>🚚 Shiprocket Delivery</span>
              <span>💳 UPI · Cards · EMI</span>
              <span>🛡️ Secure Checkout</span>
            </div>
          </div>
        </div>
      </footer>

      <CheckoutDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onClearCart={clearCart}
      />
      
      <VernacularVoiceModal 
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onSelectQuery={(q) => router.push(`/search?q=${encodeURIComponent(q)}`)}
      />
    </div>
  );
}

export default function ClientLayout({ children }) {
  return (
    <FeatureFlagProvider>
      <StoreProvider>
        <LayoutInner>{children}</LayoutInner>
      </StoreProvider>
    </FeatureFlagProvider>
  );
}
