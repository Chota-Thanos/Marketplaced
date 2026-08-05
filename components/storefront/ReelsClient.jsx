'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Heart, MessageCircle, Share2, ShoppingBag, Volume2, VolumeX,
  ArrowLeft, Sparkles, ShieldCheck, Clapperboard,
} from 'lucide-react';
import { Button, EmptyState } from '@ds/ui';
import { useStore } from '../providers/StoreProvider';
import { formatINR } from '../../lib/apiClient';

/**
 * Shoppertainment feed.
 *
 * Reels are real products that a seller opted into — there is no mock or
 * placeholder data here. Most stores will have few or none, so an empty feed
 * is a normal, expected state rather than something to work around.
 *
 * Cart and voice search come from the shared StoreProvider/ClientLayout — this
 * component must not mount its own Navbar, CheckoutDrawer or voice modal.
 * Those are already rendered once, globally, by ClientLayout for every
 * non-admin route; a second copy here previously produced a duplicated navbar.
 */
export default function ReelsClient({ reels }) {
  const { handleAddToCart } = useStore();
  const [activeIdx, setActiveIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [likedIds, setLikedIds] = useState(() => new Set());

  if (!reels || reels.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20">
        <EmptyState
          icon={Clapperboard}
          title="No Shoppertainment reels yet"
          description="Reels are an optional way to show a product in action — sellers attach a short clip to a listing if they want to, but nothing here requires one. Check back once a few clips are live, or keep browsing the catalogue."
          action={
            <Button as={Link} href="/">
              Browse products
            </Button>
          }
        />
      </div>
    );
  }

  const reel = reels[Math.min(activeIdx, reels.length - 1)];
  const liked = likedIds.has(reel.id);

  const toggleLike = () => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      next.has(reel.id) ? next.delete(reel.id) : next.add(reel.id);
      return next;
    });
  };

  const nextReel = () => setActiveIdx((prev) => (prev + 1) % reels.length);

  return (
    <main className="flex-1 flex items-center justify-center p-4 sm:p-6 max-w-md mx-auto w-full">
      <div className="relative w-full h-[78vh] sm:h-[82vh] bg-inverse rounded-panel overflow-hidden shadow-panel border border-line flex flex-col justify-between group">

        <video
          key={reel.id}
          src={reel.reelVideoUrl}
          poster={reel.image}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          {/* Product b-roll has no spoken dialogue; the empty track declares
              that explicitly so screen readers don't announce missing captions. */}
          <track kind="captions" label="No dialogue" default />
        </video>

        <div className="relative z-10 p-4 bg-gradient-to-b from-inverse/80 via-inverse/30 to-transparent flex items-center justify-between">
          <Link href="/" className="text-ink-inverse hover:text-warning p-2 rounded-pill bg-inverse/40 backdrop-blur-md transition" aria-label="Back to home">
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-accent/70 backdrop-blur-md border border-accent/40 text-xs font-extrabold text-ink-inverse shadow-card">
            <Sparkles className="w-3.5 h-3.5" /> Shoppertainment Reel
          </div>

          <button
            onClick={() => setIsMuted((m) => !m)}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            className="text-ink-inverse p-2 rounded-pill bg-inverse/40 backdrop-blur-md hover:bg-inverse/60 transition"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-success" />}
          </button>
        </div>

        <div className="absolute right-3 bottom-28 z-20 flex flex-col items-center gap-5">
          <button
            onClick={toggleLike}
            aria-pressed={liked}
            className="flex flex-col items-center gap-1 text-ink-inverse hover:scale-110 transition"
          >
            <div className={`p-3 rounded-pill backdrop-blur-md ${liked ? 'bg-danger text-ink-inverse' : 'bg-inverse/60 text-ink-inverse'}`}>
              <Heart className={`w-6 h-6 ${liked ? 'fill-ink-inverse' : ''}`} />
            </div>
          </button>

          <button className="flex flex-col items-center gap-1 text-ink-inverse hover:scale-110 transition">
            <div className="p-3 rounded-pill bg-inverse/60 backdrop-blur-md text-ink-inverse">
              <MessageCircle className="w-6 h-6" />
            </div>
          </button>

          <button className="flex flex-col items-center gap-1 text-ink-inverse hover:scale-110 transition">
            <div className="p-3 rounded-pill bg-inverse/60 backdrop-blur-md text-ink-inverse">
              <Share2 className="w-6 h-6" />
            </div>
          </button>

          {reels.length > 1 && (
            <button
              onClick={nextReel}
              className="bg-gradient-to-r from-warning to-danger text-ink-inverse text-[11px] font-black px-3.5 py-2 rounded-pill shadow-hover transition transform hover:scale-105"
            >
              Next Reel ↓
            </button>
          )}
        </div>

        <div className="relative z-10 p-4 bg-gradient-to-t from-inverse/95 via-inverse/80 to-transparent space-y-3">
          {reel.reelCaption && (
            <p className="text-xs text-ink-subtle font-medium">{reel.reelCaption}</p>
          )}

          <div className="bg-surface/15 backdrop-blur-xl p-3 rounded-card border border-surface/20 flex items-center gap-3 shadow-panel">
            <img src={reel.image} alt={reel.title} className="w-14 h-14 object-cover rounded-control bg-inverse border border-surface/20" />

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-extrabold text-ink-inverse truncate">{reel.title}</h4>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-sm font-black text-warning">{formatINR(reel.price)}</span>
                {reel.mrp > reel.price && (
                  <span className="text-[10px] text-ink-subtle line-through">{formatINR(reel.mrp)}</span>
                )}
              </div>
              <span className="text-[9px] text-success font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Verified listing
              </span>
            </div>

            <Button
              size="sm"
              onClick={() => handleAddToCart(reel)}
              leadingIcon={<ShoppingBag className="w-4 h-4" />}
              className="shrink-0"
            >
              Add
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
