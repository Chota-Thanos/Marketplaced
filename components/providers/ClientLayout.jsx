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

      <footer className="border-t border-line bg-surface py-8 text-xs text-ink-muted mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-black text-base text-ink">{brand.nameDisplay}<span className="text-accent">{brand.nameAccent}</span></span>
            <span className="font-semibold">© 2026 {brand.legalEntity}</span>
          </div>
          <div className="flex items-center gap-5 font-bold">
            <span className="hover:text-ink cursor-pointer">Privacy Policy</span>
            <span className="hover:text-ink cursor-pointer text-accent">BIS IS 19000 Compliance</span>
            <span className="hover:text-ink cursor-pointer">Shiprocket Partner</span>
            <span className="hover:text-ink cursor-pointer">WhatsApp Desk</span>
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
