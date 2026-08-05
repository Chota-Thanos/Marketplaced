'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStore } from '../providers/StoreProvider';
import { apiFetch, formatINR, formatDate, STAGE_LABELS } from '../../lib/apiClient';
import { Package, Search, ChevronRight, RefreshCw } from 'lucide-react';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'DELIVERED', label: 'Delivered' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_COLORS = {
  PENDING: 'bg-warning-soft text-warning border-warning',
  CONFIRMED: 'bg-accent-soft text-accent border-accent',
  PACKED: 'bg-accent-soft text-accent border-accent',
  SHIPPED: 'bg-accent-soft text-accent border-accent',
  OUT_FOR_DELIVERY: 'bg-warning-soft text-warning border-warning',
  DELIVERED: 'bg-success-soft text-success border-success',
  CANCELLED: 'bg-danger-soft text-danger border-danger',
};

const ACTIVE_STATUSES = ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY'];

export default function OrdersClient() {
  const { authToken } = useStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!authToken) return;
    apiFetch('/orders/mine', { token: authToken })
      .then(res => setOrders(res.data || []))
      .finally(() => setLoading(false));
  }, [authToken]);

  const filtered = orders.filter(order => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' ? ACTIVE_STATUSES.includes(order.status) : order.status === filter);

    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      order.order_number.toLowerCase().includes(term) ||
      (order.items || []).some(i => i.product?.title?.toLowerCase().includes(term));

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by order ID or product name..."
            className="w-full bg-surface border border-line rounded-card pl-10 pr-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-line-strong"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-pill text-xs font-bold border transition ${
              filter === f.id
                ? 'bg-inverse text-ink-inverse border-line-strong'
                : 'bg-surface text-ink-muted border-line hover:border-line-strong'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-ink-subtle font-bold">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading your orders...
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="bg-surface-muted border border-line rounded-panel p-12 text-center">
          <div className="w-14 h-14 bg-surface-sunken rounded-pill flex items-center justify-center mx-auto mb-4">
            <Package className="w-7 h-7 text-ink-subtle" />
          </div>
          <h3 className="font-black text-ink">No orders found</h3>
          <p className="text-ink-subtle text-sm mt-1 font-medium">
            {orders.length === 0 ? "You haven't placed any orders yet." : 'Try a different filter or search term.'}
          </p>
          {orders.length === 0 && (
            <Link href="/" className="btn-primary inline-flex mt-5 text-sm">Start shopping</Link>
          )}
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(order => {
          const firstItem = (order.items || [])[0];
          const extra = (order.items || []).length - 1;
          return (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="flex items-center gap-4 bg-surface border border-line rounded-card p-4 hover:shadow-card hover:border-line transition"
            >
              <div className="w-16 h-16 rounded-control bg-surface-sunken overflow-hidden shrink-0">
                {firstItem?.product?.images?.[0] && (
                  <img src={firstItem.product.images[0]} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-ink text-sm">{order.order_number}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-pill border ${STATUS_COLORS[order.status] || 'bg-surface-muted text-ink-muted border-line'}`}>
                    {STAGE_LABELS[order.status] || order.status}
                  </span>
                </div>
                <p className="text-xs text-ink-muted font-semibold truncate mt-0.5">
                  {firstItem?.product?.title || 'Order'}
                  {extra > 0 && <span className="text-ink-subtle"> +{extra} more</span>}
                </p>
                <p className="text-[11px] text-ink-subtle font-medium mt-0.5">{formatDate(order.created_at)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-black text-ink">{formatINR(order.total_amount)}</p>
                <ChevronRight className="w-4 h-4 text-ink-subtle ml-auto mt-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
