'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Mic, 
  ShoppingBag, 
  Smartphone, 
  Video, 
  Globe, 
  LayoutDashboard,
  MapPin,
  Truck,
  ChevronDown,
  CheckCircle2,
  Menu,
  X,
  Sparkles,
  Headphones,
  Zap,
  Award,
  Leaf,
  Flame,
  ArrowRight,
  ShieldCheck,
  Package,
  Layers,
  MessageSquare,
  CreditCard,
  Tv,
  Bot,
  UserRound
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import { ThemeToggle } from './ThemeToggle';
import { useStore } from './providers/StoreProvider';
import { apiFetch } from '../lib/apiClient';
import { brand } from '@ds/brand';
import { Button } from '@ds/ui';

export default function Navbar({
  cartCount,
  onOpenCart,
  onOpenVoice,
  currentView,
  onToggleView,
}) {
  const { authUser } = useStore();
  const [selectedLang, setSelectedLang] = useState('English');
  const [selectedStore, setSelectedStore] = useState('Bengaluru HSR Store');
  const [showStoreMenu, setShowStoreMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null); // 'products' | 'why' | null
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // Reels are opt-in per product — most stores will have none. Rather than
  // advertise a feature that leads to an empty page, the nav checks once
  // whether anything is actually live and only then shows the links.
  const [hasReels, setHasReels] = useState(false);

  useEffect(() => {
    let alive = true;
    apiFetch('/reels?per_page=1')
      .then((res) => {
        if (alive) setHasReels((res.meta?.total ?? 0) > 0);
      })
      .catch(() => {
        // A failed check just keeps the links hidden — reels are optional, so
        // this must never surface as a navbar error.
      });
    return () => {
      alive = false;
    };
  }, []);
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const stores = ['Bengaluru HSR Store', 'Mumbai Bandra Store', 'Delhi CP Store', 'Kolkata Park St Store', 'Hyderabad Jubilee Store'];
  const languages = ['English', 'हिंदी (Hindi)', 'தமிழ் (Tamil)', 'తెలుగు (Telugu)', 'Hinglish'];

  return (
    <header className="sticky top-0 z-50 bg-surface text-ink border-b border-line font-sans shadow-subtle">
      

      {/* 2. MAIN NORDIC MINIMALIST HEADER BAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-6">
        
        {/* Left Section: Logo & Nav Links */}
        <div className="flex items-center gap-8">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-card bg-inverse p-0.5 shadow-subtle group-hover:bg-danger transition">
              <div className="w-full h-full bg-surface rounded-[14px] flex items-center justify-center font-black text-ink text-xl tracking-wider">
                {brand.logoInitials.charAt(0)}<span className="text-danger">{brand.logoInitials.charAt(1)}</span>
              </div>
            </div>
            <div>
              <span className="font-black text-2xl tracking-tight text-ink">
                {brand.nameDisplay}<span className="text-danger">{brand.nameAccent}</span>
              </span>
              <span className="block text-[10px] font-black tracking-widest text-ink-subtle uppercase -mt-1">
                {brand.tagline}
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-ink-muted">

            {/* Shop by Category mega-menu */}
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'products' ? null : 'products')}
              className={`flex items-center gap-1.5 transition py-2 font-black ${
                activeDropdown === 'products' ? 'text-ink border-b-2 border-line-strong' : 'hover:text-ink'
              }`}
            >
              <span>Categories</span>
              <ChevronDown className={`w-3.5 h-3.5 text-ink-subtle transition-transform ${activeDropdown === 'products' ? 'rotate-180 text-ink' : ''}`} />
            </button>

            <Link href="/search?sort=newest" className="hover:text-ink transition py-2">New Arrivals</Link>
            <Link href="/search?sort=rating" className="hover:text-ink transition py-2">Best Sellers</Link>
            <Link href="/search" className="hover:text-ink transition py-2 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-warning" />
              <span>Sale</span>
            </Link>

            {hasReels && (
              <Link href="/reels" className="hover:text-ink transition py-2 flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-accent" />
                <span>Reels</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Right Section: Search & Pill Action Buttons */}
        <div className="flex items-center gap-4">
          
          {/* Vernacular Search */}
          <form onSubmit={handleSearch} role="search" className="relative hidden md:block w-64">
            {/* Visually hidden rather than absent: a placeholder is not a label
                — it disappears on input and is not reliably announced. */}
            <label htmlFor="navbar-search" className="sr-only">
              Search the catalogue
            </label>
            <input
              id="navbar-search"
              type="search"
              placeholder="Search catalog, e.g. 'silk saree'..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-sunken border border-line rounded-pill pl-9 pr-10 py-2 text-xs font-semibold text-ink placeholder-ink-subtle focus:outline-none focus:border-line-strong focus:bg-surface transition"
            />
            <button type="submit" aria-label="Search" className="absolute left-3 top-2.5 text-ink-subtle hover:text-ink">
              <Search className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onOpenVoice}
              title="Vernacular Voice Search"
              className="absolute right-1 top-1 bg-inverse hover:bg-danger text-ink-inverse p-1.5 rounded-pill transition"
            >
              <Mic className="w-3.5 h-3.5" />
            </button>
          </form>

          <ThemeToggle />

          <NotificationBell />

          <Link
            href="/account/orders"
            className="hidden sm:flex items-center gap-1.5 text-xs font-extrabold text-ink-muted hover:text-ink"
          >
            <UserRound className="w-4 h-4" />
            {authUser ? (authUser.name?.split(' ')[0] || 'Account') : 'Log in'}
          </Link>

          <Button
            size="sm"
            onClick={onOpenCart}
            leadingIcon={<ShoppingBag className="w-4 h-4" />}
          >
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="bg-danger text-ink-inverse font-black text-[11px] w-5 h-5 rounded-pill flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Button>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden p-2 text-ink-muted hover:text-ink"
          >
            {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* 3. NORDIC MINIMALIST PURE WHITE MEGA-MENU DROPDOWN */}
      {activeDropdown === 'products' && (
        <div 
          className="absolute left-0 top-full w-full bg-surface border-t border-b border-line shadow-panel z-50 animate-in fade-in slide-in-from-top-1 duration-200 text-ink"
          onMouseLeave={() => setActiveDropdown(null)}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
            {/* Top 4-Column Section */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pb-8 border-b border-line">
              
              {/* COLUMN 1: SHOP BY CATEGORY */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-[11px] font-black text-success uppercase tracking-widest mb-3">
                    SHOP BY CATEGORY
                  </h4>
                  <ul className="space-y-2.5 text-xs font-semibold">
                    <li>
                      <Link href="/category/ethnic-wear" onClick={() => setActiveDropdown(null)} className="flex items-center gap-2.5 text-ink-muted hover:text-ink transition group">
                        <Sparkles className="w-4 h-4 text-danger" />
                        <span>Ethnic & Festive Wear</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/category/electronics" onClick={() => setActiveDropdown(null)} className="flex items-center gap-2.5 text-ink-muted hover:text-ink transition group">
                        <Headphones className="w-4 h-4 text-accent" />
                        <span>Smart Tech & Wearables</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/category/footwear" onClick={() => setActiveDropdown(null)} className="flex items-center gap-2.5 text-ink-muted hover:text-ink transition group">
                        <Zap className="w-4 h-4 text-accent" />
                        <span>Footwear & Sneakers</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/category/home-decor" onClick={() => setActiveDropdown(null)} className="flex items-center gap-2.5 text-ink-muted hover:text-ink transition group">
                        <Award className="w-4 h-4 text-warning" />
                        <span>Handcrafted Heritage Decor</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/category/casual-wear" onClick={() => setActiveDropdown(null)} className="flex items-center gap-2.5 text-ink-muted hover:text-ink transition group">
                        <Leaf className="w-4 h-4 text-success" />
                        <span>Casual Wear & Everyday</span>
                      </Link>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-[11px] font-black text-accent uppercase tracking-widest mb-3">
                    QUICK LINKS
                  </h4>
                  <ul className="space-y-2.5 text-xs font-semibold">
                    <li>
                      <Link href="/search?sort=newest" onClick={() => setActiveDropdown(null)} className="flex items-center gap-2.5 text-ink-muted hover:text-ink transition">
                        <Flame className="w-4 h-4 text-danger" />
                        <span>New Arrivals</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/search?sort=rating" onClick={() => setActiveDropdown(null)} className="flex items-center gap-2.5 text-ink-muted hover:text-ink transition">
                        <Award className="w-4 h-4 text-warning" />
                        <span>Best Sellers</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/search" onClick={() => setActiveDropdown(null)} className="flex items-center gap-2.5 text-ink-muted hover:text-ink transition">
                        <Zap className="w-4 h-4 text-success" />
                        <span>Today's Deals</span>
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              {/* COLUMN 2: FEATURED CLASSIFICATIONS */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-[11px] font-black text-success uppercase tracking-widest mb-3">
                    POPULAR CATALOG ITEMS
                  </h4>
                  <ul className="space-y-2.5 text-xs font-semibold">
                    <li>
                      <Link href="/product/1" onClick={() => setActiveDropdown(null)} className="flex items-center gap-2.5 text-ink-muted hover:text-ink transition">
                        <Layers className="w-4 h-4 text-ink-subtle" />
                        <span>Chanderi Silk Anarkali Set</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/product/2" onClick={() => setActiveDropdown(null)} className="flex items-center gap-2.5 text-ink-muted hover:text-ink transition">
                        <Headphones className="w-4 h-4 text-ink-subtle" />
                        <span>ProBass ANC Headphones</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/product/3" onClick={() => setActiveDropdown(null)} className="flex items-center gap-2.5 text-ink-muted hover:text-ink transition">
                        <Zap className="w-4 h-4 text-ink-subtle" />
                        <span>AeroGlide Carbon Running Shoes</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/product/4" onClick={() => setActiveDropdown(null)} className="flex items-center gap-2.5 text-ink-muted hover:text-ink transition">
                        <Award className="w-4 h-4 text-ink-subtle" />
                        <span>Dhokra Brass Temple Lamp</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/product/5" onClick={() => setActiveDropdown(null)} className="flex items-center gap-2.5 text-ink-muted hover:text-ink transition">
                        <Leaf className="w-4 h-4 text-ink-subtle" />
                        <span>Kumkumadi Saffron Facial Oil</span>
                      </Link>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-[11px] font-black text-success uppercase tracking-widest mb-3">
                    CUSTOMER EXPERIENCES
                  </h4>
                  <ul className="space-y-2.5 text-xs font-semibold">
                    <li>
                      <button onClick={() => { onOpenVoice(); setActiveDropdown(null); }} className="flex items-center gap-2.5 text-ink-muted hover:text-ink transition text-left">
                        <Mic className="w-4 h-4 text-accent" />
                        <span>Vernacular Voice Search (4 Languages)</span>
                      </button>
                    </li>
                    {hasReels && (
                      <li>
                        <Link href="/reels" onClick={() => setActiveDropdown(null)} className="flex items-center gap-2.5 text-ink-muted hover:text-ink transition">
                          <Tv className="w-4 h-4 text-danger" />
                          <span>Shoppertainment Short Reels</span>
                        </Link>
                      </li>
                    )}
                    <li>
                      <Link href="/product/1" onClick={() => setActiveDropdown(null)} className="flex items-center gap-2.5 text-ink-muted hover:text-ink transition">
                        <CreditCard className="w-4 h-4 text-success" />
                        <span>1-Click UPI Checkout & GPS</span>
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              {/* COLUMN 3: REVIEWS & TRUST */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-[11px] font-black text-success uppercase tracking-widest mb-3">
                    MARKETPLACE COMPLIANCE
                  </h4>
                  <ul className="space-y-2.5 text-xs font-semibold">
                    <li>
                      <div className="flex items-center gap-2.5 text-ink-muted">
                        <ShieldCheck className="w-4 h-4 text-success shrink-0" />
                        <span>BIS IS 19000 Verified Reviews</span>
                      </div>
                    </li>
                    <li>
                      <div className="flex items-center gap-2.5 text-ink-muted">
                        <Flame className="w-4 h-4 text-danger shrink-0" />
                        <span>+₹50 UPI Cashback Video Reviews</span>
                      </div>
                    </li>
                    <li>
                      <div className="flex items-center gap-2.5 text-ink-muted">
                        <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                        <span>100% Verified Merchant Guarantee</span>
                      </div>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-[11px] font-black text-success uppercase tracking-widest mb-3">
                    LOGISTICS & PAYMENTS
                  </h4>
                  <ul className="space-y-2.5 text-xs font-semibold">
                    <li>
                      <span className="text-ink-muted">Shiprocket & Delhivery Express</span>
                    </li>
                    <li>
                      <span className="text-ink-muted">Google Pay, PhonePe, Paytm & BHIM</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* COLUMN 4: RIGHT-SIDE FEATURED CARD */}
              <div className="bg-pastel-green p-6 rounded-panel border border-success space-y-4 relative overflow-hidden flex flex-col justify-between shadow-subtle">
                <div>
                  <p className="text-[10px] font-black text-success uppercase tracking-widest">NON-STOP INNOVATION</p>
                  
                  {/* Visual Product Mockup Card */}
                  <div className="my-3 aspect-video bg-surface rounded-card border border-success p-3 flex flex-col justify-center items-center text-center shadow-subtle">
                    <Bot className="w-8 h-8 text-success animate-bounce" />
                    <span className="font-black text-xs text-ink mt-1">{`${brand.name} ${brand.editionLabel}`}</span>
                    <span className="text-[10px] text-ink-subtle font-medium">150+ platform updates, twice a year.</span>
                  </div>

                  <h5 className="font-extrabold text-xs text-ink">LATEST UPDATES</h5>
                  <ul className="space-y-1.5 text-[11px] text-ink-muted font-medium mt-2">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-pill bg-success" />
                      <span>Agentic Storefronts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-pill bg-success" />
                      <span>Vernacular Voice Autopilot</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-pill bg-success" />
                      <span>BIS IS 19000 Anti-Fake Reviews</span>
                    </li>
                  </ul>
                </div>

                <Button
                  as={Link}
                  href={hasReels ? '/reels' : '/'}
                  size="sm"
                  fullWidth
                  onClick={() => setActiveDropdown(null)}
                  trailingIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  {`Explore ${brand.editionLabel}`}
                </Button>
              </div>

            </div>

            {/* Bottom Footer Strip Inside Mega Menu */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6 text-xs">
              <div>
                <h5 className="font-bold text-ink text-[11px]">{`CUSTOMIZE & EXTEND ${brand.name}`}</h5>
                <p className="text-ink-subtle text-[11px] mt-0.5">Tailor themes and checkout components</p>
              </div>
              <div>
                <h5 className="font-bold text-ink text-[11px]">Commerce for Agents</h5>
                <p className="text-ink-subtle text-[11px] mt-0.5">Build with our agent SDK tools</p>
              </div>
              <div>
                <h5 className="font-bold text-ink text-[11px]">{brand.appStoreName}</h5>
                <p className="text-ink-subtle text-[11px] mt-0.5">Largest merchant ecosystem</p>
              </div>
              <div>
                <h5 className="font-bold text-ink text-[11px]">{brand.devDomain}</h5>
                <p className="text-ink-subtle text-[11px] mt-0.5">Dev docs, CLI, and APIs</p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MOBILE MENU */}
      {showMobileMenu && (
        <div className="lg:hidden bg-surface border-b border-line p-4 space-y-3">
          <Link href="/category/ethnic-wear" onClick={() => setShowMobileMenu(false)} className="block py-2 text-sm font-bold text-ink">
            Ethnic & Festive Wear
          </Link>
          <Link href="/category/electronics" onClick={() => setShowMobileMenu(false)} className="block py-2 text-sm font-bold text-ink">
            Smart Tech & Wearables
          </Link>
          <Link href="/category/footwear" onClick={() => setShowMobileMenu(false)} className="block py-2 text-sm font-bold text-ink">
            Footwear & Sneakers
          </Link>
          {hasReels && (
            <Link href="/reels" onClick={() => setShowMobileMenu(false)} className="block py-2 text-sm font-bold text-danger">
              Shoppertainment Reels
            </Link>
          )}
          <Link href="/search?sort=newest" onClick={() => setShowMobileMenu(false)} className="block py-2 text-sm font-bold text-ink">
            New Arrivals
          </Link>
          <Link href="/search?sort=rating" onClick={() => setShowMobileMenu(false)} className="block py-2 text-sm font-bold text-ink">
            Best Sellers
          </Link>
          <Link href="/account/orders" onClick={() => setShowMobileMenu(false)} className="block py-2 text-sm font-bold text-ink">
            My Orders
          </Link>
        </div>
      )}

    </header>
  );
}
