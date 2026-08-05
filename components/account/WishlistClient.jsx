'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStore } from '../providers/StoreProvider';
import { apiFetch, mapProduct, formatINR } from '../../lib/apiClient';
import {
  Heart, Plus, Trash2, Share2, ShoppingBag, RefreshCw, Copy, Check, TrendingDown, PackageCheck,
} from 'lucide-react';

export default function WishlistClient() {
  const { authToken, handleAddToCart } = useStore();
  const [wishlists, setWishlists] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const load = () => apiFetch('/wishlists', { token: authToken })
    .then(res => {
      setWishlists(res.data || []);
      setActiveId(prev => prev || res.data?.[0]?.id || null);
    })
    .finally(() => setLoading(false));

  useEffect(() => { if (authToken) load(); }, [authToken]);

  const active = wishlists.find(w => w.id === activeId) || wishlists[0];

  const createList = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const res = await apiFetch('/wishlists', { method: 'POST', token: authToken, body: { name: newName.trim() } });
    setNewName('');
    setCreating(false);
    await load();
    setActiveId(res.data.id);
  };

  const removeItem = async (itemId) => {
    await apiFetch(`/wishlist-items/${itemId}`, { method: 'DELETE', token: authToken });
    load();
  };

  const deleteList = async (id) => {
    await apiFetch(`/wishlists/${id}`, { method: 'DELETE', token: authToken });
    setActiveId(null);
    load();
  };

  const share = async () => {
    const res = await apiFetch(`/wishlists/${active.id}/share`, { method: 'POST', token: authToken });
    setShareUrl(`${window.location.origin}/wishlist/${res.data.share_token}`);
    setCopied(false);
  };

  const copyShare = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-ink-subtle font-bold">
        <RefreshCw className="w-4 h-4 animate-spin" /> Loading wishlist...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 flex-wrap">
        {wishlists.map(w => (
          <button key={w.id} onClick={() => { setActiveId(w.id); setShareUrl(''); }}
            className={`px-4 py-2 rounded-pill text-xs font-bold border transition ${
              active?.id === w.id ? 'bg-inverse text-ink-inverse border-line-strong' : 'bg-surface text-ink-muted border-line hover:border-line-strong'
            }`}>
            {w.name}
            <span className="ml-1.5 opacity-60">{w.items?.length || 0}</span>
          </button>
        ))}
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-1 px-4 py-2 rounded-pill text-xs font-bold border border-dashed border-line text-ink-subtle hover:border-line-strong hover:text-ink">
          <Plus className="w-3.5 h-3.5" /> New list
        </button>
      </div>

      {creating && (
        <form onSubmit={createList} className="flex gap-2 bg-surface border border-line rounded-card p-3">
          <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="e.g. Birthday List"
            className="flex-1 bg-surface-muted border border-line rounded-control px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-line-strong" />
          <button type="submit" className="bg-inverse text-ink-inverse px-4 py-2.5 rounded-control text-xs font-bold">Create</button>
          <button type="button" onClick={() => setCreating(false)} className="bg-surface-sunken text-ink-muted px-4 py-2.5 rounded-control text-xs font-bold">Cancel</button>
        </form>
      )}

      {active && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-ink-subtle text-sm font-bold">
            {active.items?.length || 0} item{active.items?.length === 1 ? '' : 's'} in {active.name}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={share} className="flex items-center gap-1.5 text-xs font-bold text-accent bg-accent-soft border border-accent px-3 py-2 rounded-control hover:bg-accent-soft">
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
            {!active.is_default && (
              <button onClick={() => deleteList(active.id)} className="flex items-center gap-1.5 text-xs font-bold text-danger bg-danger-soft border border-danger px-3 py-2 rounded-control hover:bg-danger-soft">
                <Trash2 className="w-3.5 h-3.5" /> Delete list
              </button>
            )}
          </div>
        </div>
      )}

      {shareUrl && (
        <div className="flex items-center gap-2 bg-accent-soft border border-accent rounded-card p-3">
          <input readOnly value={shareUrl} className="flex-1 bg-surface border border-accent rounded-control px-3 py-2 text-[11px] font-mono text-ink-muted focus:outline-none" />
          <button onClick={copyShare} className="flex items-center gap-1.5 bg-accent text-ink-inverse px-3 py-2 rounded-control text-xs font-bold hover:bg-accent">
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}

      {(!active || active.items?.length === 0) && (
        <div className="bg-surface-muted border border-line rounded-panel p-12 text-center">
          <div className="w-14 h-14 bg-surface-sunken rounded-pill flex items-center justify-center mx-auto mb-4">
            <Heart className="w-7 h-7 text-ink-subtle" />
          </div>
          <h3 className="font-black text-ink">This list is empty</h3>
          <p className="text-ink-subtle text-sm mt-1 font-medium">Tap the heart on any product to save it here.</p>
          <Link href="/" className="btn-primary inline-flex mt-5 text-sm">Browse products</Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(active?.items || []).map(item => {
          const product = mapProduct(item.product);
          return (
            <div key={item.id} className="bg-surface border border-line rounded-card p-4 flex gap-4">
              <Link href={`/product/${product.id}`} className="w-20 h-20 rounded-control bg-surface-sunken overflow-hidden shrink-0">
                <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/product/${product.id}`} className="font-bold text-ink text-xs line-clamp-2 hover:underline">
                  {product.title}
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-black text-ink text-sm">{formatINR(product.price)}</span>
                  {item.price_dropped && (
                    <span className="flex items-center gap-0.5 text-[10px] font-black text-success bg-success-soft border border-success px-1.5 py-0.5 rounded-pill">
                      <TrendingDown className="w-3 h-3" /> Price dropped
                    </span>
                  )}
                </div>
                {!product.inStock ? (
                  <p className="text-[10px] font-black text-danger mt-1">Out of stock — we'll alert you</p>
                ) : item.back_in_stock && (
                  <p className="flex items-center gap-0.5 text-[10px] font-black text-success mt-1">
                    <PackageCheck className="w-3 h-3" /> In stock
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2.5">
                  <button
                    onClick={() => handleAddToCart(product, product.variants?.[0] || null)}
                    disabled={!product.inStock}
                    className="flex items-center gap-1 text-[11px] font-bold text-ink-inverse bg-inverse px-2.5 py-1.5 rounded-control hover:bg-inverse disabled:opacity-40"
                  >
                    <ShoppingBag className="w-3 h-3" /> Add to cart
                  </button>
                  <button onClick={() => removeItem(item.id)}
                    className="flex items-center gap-1 text-[11px] font-bold text-danger bg-danger-soft px-2.5 py-1.5 rounded-control hover:bg-danger-soft">
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
