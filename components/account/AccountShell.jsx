'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '../providers/StoreProvider';
import AuthPrompt from './AuthPrompt';
import {
  Package, MapPin, User, Wallet, Star, Heart, RotateCcw, Bell, LogOut,
} from 'lucide-react';

const NAV = [
  { href: '/account/orders', label: 'My Orders', icon: Package },
  { href: '/account/returns', label: 'Returns & Refunds', icon: RotateCcw },
  { href: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/account/addresses', label: 'Addresses', icon: MapPin },
  { href: '/account/wallet', label: 'Wallet', icon: Wallet },
  { href: '/account/reviews', label: 'My Reviews', icon: Star },
  { href: '/account/notifications', label: 'Notifications', icon: Bell },
  { href: '/account/profile', label: 'Profile', icon: User },
];

export default function AccountShell({ children }) {
  const pathname = usePathname();
  const { authUser, authToken, logout } = useStore();

  if (!authToken) {
    return <AuthPrompt />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-ink">My Account</h1>
        <p className="text-ink-subtle font-medium mt-1">
          Signed in as <span className="font-bold text-ink">{authUser?.name || authUser?.email}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <nav className="lg:col-span-1 space-y-1">
          {NAV.map(item => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-card text-sm font-bold transition ${
                  active
                    ? 'bg-inverse text-ink-inverse'
                    : 'text-ink-muted hover:bg-surface-sunken hover:text-ink'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-card text-sm font-bold text-ink-subtle hover:bg-danger-soft hover:text-danger transition"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </button>
        </nav>

        <div className="lg:col-span-3 min-w-0">{children}</div>
      </div>
    </div>
  );
}
