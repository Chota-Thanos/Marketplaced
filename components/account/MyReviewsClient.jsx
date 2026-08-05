'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStore } from '../providers/StoreProvider';
import { apiFetch, formatDate } from '../../lib/apiClient';
import WriteReviewModal from '../reviews/WriteReviewModal';
import { Star, RefreshCw, PenLine, Clock, CheckCircle2, XCircle } from 'lucide-react';

const STATUS_META = {
  PENDING: { icon: Clock, tone: 'bg-warning-soft text-warning border-warning', label: 'Awaiting moderation' },
  APPROVED: { icon: CheckCircle2, tone: 'bg-success-soft text-success border-success', label: 'Published' },
  REJECTED: { icon: XCircle, tone: 'bg-danger-soft text-danger border-danger', label: 'Rejected' },
};

export default function MyReviewsClient() {
  const { authToken } = useStore();
  const [reviews, setReviews] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [writing, setWriting] = useState(null);

  const load = async () => {
    const [mine, reviewable] = await Promise.all([
      apiFetch('/reviews/mine', { token: authToken }),
      apiFetch('/reviews/reviewable', { token: authToken }),
    ]);
    setReviews(mine.data || []);
    setPending(reviewable.data || []);
    setLoading(false);
  };

  useEffect(() => { if (authToken) load(); }, [authToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-ink-subtle font-bold">
        <RefreshCw className="w-4 h-4 animate-spin" /> Loading reviews...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {pending.length > 0 && (
        <div className="bg-surface border border-line rounded-panel overflow-hidden">
          <div className="px-5 py-4 border-b border-line">
            <h2 className="font-black text-ink text-sm">Awaiting your review</h2>
            <p className="text-ink-subtle text-xs font-medium mt-0.5">
              You bought these and they were delivered — share what you thought.
            </p>
          </div>
          <div className="divide-y divide-line">
            {pending.map(p => (
              <div key={`${p.order_id}-${p.product_id}`} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-12 h-12 rounded-control bg-surface-sunken overflow-hidden shrink-0">
                  {p.product?.images?.[0] && <img src={p.product.images[0]} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-ink text-xs line-clamp-1">{p.product?.title}</p>
                  <p className="text-[11px] text-ink-subtle font-medium">Order {p.order_number}</p>
                </div>
                <button onClick={() => setWriting(p)}
                  className="flex items-center gap-1.5 bg-inverse text-ink-inverse px-3 py-2 rounded-control text-[11px] font-bold hover:bg-inverse shrink-0">
                  <PenLine className="w-3 h-3" /> Write review
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-surface border border-line rounded-panel overflow-hidden">
        <div className="px-5 py-4 border-b border-line">
          <h2 className="font-black text-ink text-sm">My Reviews ({reviews.length})</h2>
        </div>

        {reviews.length === 0 ? (
          <div className="p-10 text-center">
            <Star className="w-10 h-10 text-ink-subtle mx-auto mb-3" />
            <p className="text-ink-subtle font-bold text-sm">You haven't written any reviews yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {reviews.map(r => {
              const meta = STATUS_META[r.status] || STATUS_META.PENDING;
              const StatusIcon = meta.icon;
              return (
                <div key={r.id} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-control bg-surface-sunken overflow-hidden shrink-0">
                      {r.product?.images?.[0] && <img src={r.product.images[0]} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/product/${r.product_id}`} className="font-bold text-ink text-xs hover:underline line-clamp-1">
                        {r.product?.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'fill-rating text-warning' : 'text-ink-subtle'}`} />
                          ))}
                        </div>
                        <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-pill border ${meta.tone}`}>
                          <StatusIcon className="w-3 h-3" /> {meta.label}
                        </span>
                        <span className="text-[10px] text-ink-subtle font-medium">{formatDate(r.created_at)}</span>
                      </div>
                      {r.title && <p className="font-bold text-ink text-xs mt-2">{r.title}</p>}
                      {r.body && <p className="text-[11px] text-ink-muted font-medium mt-0.5 leading-relaxed">{r.body}</p>}
                      {r.helpful_count > 0 && (
                        <p className="text-[10px] text-ink-subtle font-bold mt-1.5">
                          {r.helpful_count} {r.helpful_count === 1 ? 'person' : 'people'} found this helpful
                        </p>
                      )}
                      {r.admin_reply && (
                        <div className="mt-2.5 bg-surface-muted border-l-2 border-line-strong rounded-r-control px-3 py-2">
                          <p className="text-[10px] font-black text-ink uppercase tracking-wide">BazaarX Response</p>
                          <p className="text-[11px] text-ink-muted font-medium mt-0.5">{r.admin_reply}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {writing && (
        <WriteReviewModal
          productId={writing.product_id}
          orderId={writing.order_id}
          product={writing.product}
          onClose={() => setWriting(null)}
          onSubmitted={() => { setWriting(null); load(); }}
        />
      )}
    </div>
  );
}
