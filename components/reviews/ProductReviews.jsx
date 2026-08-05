'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '../providers/StoreProvider';
import { apiFetch, formatDate } from '../../lib/apiClient';
import AIReviewSummary from '../storefront/AIReviewSummary';
import { Star, ThumbsUp, ThumbsDown, ShieldCheck, RefreshCw, MessageSquare } from 'lucide-react';

const ATTRIBUTE_LABELS = {
  quality: 'Quality', value: 'Value for Money', packaging: 'Packaging', delivery: 'Delivery Speed',
};

const SORTS = [
  { id: 'helpful', label: 'Most helpful' },
  { id: 'recent', label: 'Most recent' },
  { id: 'highest', label: 'Highest rated' },
  { id: 'critical', label: 'Most critical' },
];

export default function ProductReviews({ productId }) {
  const { authToken } = useStore();
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [myVotes, setMyVotes] = useState({});
  const [sort, setSort] = useState('helpful');
  const [ratingFilter, setRatingFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(null);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams({ sort });
    if (ratingFilter) params.set('rating', ratingFilter);
    const res = await apiFetch(`/products/${productId}/reviews?${params}`, { token: authToken || undefined });
    setReviews(res.data || []);
    setSummary(res.summary);
    setMyVotes(res.my_votes || {});
    setLoading(false);
  };

  useEffect(() => { load(); }, [productId, sort, ratingFilter, authToken]);

  const vote = async (reviewId, isHelpful) => {
    if (!authToken) return;
    setVoting(reviewId);
    try {
      await apiFetch(`/reviews/${reviewId}/vote`, {
        method: 'POST', token: authToken, body: { is_helpful: isHelpful },
      });
      await load();
    } catch (e) {
      // Voting on your own review is rejected server-side; ignore silently.
    } finally {
      setVoting(null);
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-ink-subtle font-bold">
        <RefreshCw className="w-4 h-4 animate-spin" /> Loading reviews...
      </div>
    );
  }

  const total = summary?.total || 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-ink">Verified Customer Reviews</h2>

      {total === 0 ? (
        <div className="bg-surface-muted border border-line rounded-panel p-10 text-center">
          <Star className="w-10 h-10 text-ink-subtle mx-auto mb-3" />
          <p className="font-black text-ink">No reviews yet</p>
          <p className="text-ink-subtle text-sm font-medium mt-1">
            Only customers who bought and received this product can review it.
          </p>
        </div>
      ) : (
        <>
          <AIReviewSummary
            summary={summary.narrative}
            isAiGenerated={summary.is_ai_generated}
            total={total}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-surface-muted border border-line rounded-panel p-6">
            {/* Average */}
            <div className="text-center md:border-r border-line">
              <p className="text-5xl font-black text-ink">{summary.average}</p>
              <div className="flex items-center justify-center gap-0.5 mt-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={`w-4 h-4 ${s <= Math.round(summary.average) ? 'fill-rating text-warning' : 'text-ink-subtle'}`} />
                ))}
              </div>
              <p className="text-xs text-ink-subtle font-bold mt-1.5">{total} verified review{total === 1 ? '' : 's'}</p>
            </div>

            {/* Histogram */}
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map(star => {
                const count = summary.histogram[star] || 0;
                const pct = total ? (count / total) * 100 : 0;
                const active = ratingFilter === star;
                return (
                  <button key={star}
                    onClick={() => setRatingFilter(active ? null : star)}
                    className={`w-full flex items-center gap-2 group ${active ? 'font-black' : ''}`}>
                    <span className="text-[11px] font-bold text-ink-muted w-6 shrink-0">{star}★</span>
                    <div className="flex-1 h-2 bg-surface-sunken rounded-pill overflow-hidden">
                      <div className={`h-full rounded-pill transition-all ${active ? 'bg-inverse' : 'bg-warning group-hover:bg-warning'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[11px] font-bold text-ink-subtle w-6 text-right shrink-0">{count}</span>
                  </button>
                );
              })}
              {ratingFilter && (
                <button onClick={() => setRatingFilter(null)} className="text-[11px] font-bold text-accent hover:underline">
                  Clear {ratingFilter}★ filter
                </button>
              )}
            </div>

            {/* Attribute averages */}
            <div className="space-y-2">
              {Object.entries(summary.attribute_averages || {}).map(([key, value]) => (
                value !== null && (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-ink-muted">{ATTRIBUTE_LABELS[key] || key}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 h-1.5 bg-surface-sunken rounded-pill overflow-hidden">
                        <div className="h-full bg-success rounded-pill" style={{ width: `${(value / 5) * 100}%` }} />
                      </div>
                      <span className="text-[11px] font-black text-ink w-6">{value}</span>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 flex-wrap">
            {SORTS.map(s => (
              <button key={s.id} onClick={() => setSort(s.id)}
                className={`px-3.5 py-1.5 rounded-pill text-[11px] font-bold border transition ${
                  sort === s.id ? 'bg-inverse text-ink-inverse border-line-strong' : 'bg-surface text-ink-muted border-line hover:border-line-strong'
                }`}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Review list */}
          <div className="space-y-4">
            {reviews.length === 0 && (
              <p className="text-ink-subtle font-bold text-sm text-center py-8">No reviews match this filter.</p>
            )}
            {reviews.map(r => (
              <div key={r.id} className="bg-surface border border-line rounded-card p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-ink text-sm">{r.user?.name || 'BazaarX Customer'}</span>
                      {r.verified_purchase && (
                        <span className="flex items-center gap-1 text-[10px] font-black text-success bg-success-soft border border-success px-2 py-0.5 rounded-pill">
                          <ShieldCheck className="w-3 h-3" /> Verified Purchase
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'fill-rating text-warning' : 'text-ink-subtle'}`} />
                        ))}
                      </div>
                      <span className="text-[11px] text-ink-subtle font-medium">{formatDate(r.created_at)}</span>
                    </div>
                  </div>
                </div>

                {r.title && <p className="font-black text-ink text-sm mt-3">{r.title}</p>}
                {r.body && <p className="text-xs text-ink-muted font-medium mt-1 leading-relaxed">{r.body}</p>}

                {r.media?.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {r.media.map((url, i) => (
                      <img key={i} src={url} alt="" className="w-16 h-16 object-cover rounded-control border border-line" />
                    ))}
                  </div>
                )}

                {r.attribute_ratings && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {Object.entries(r.attribute_ratings).map(([key, value]) => (
                      <span key={key} className="text-[10px] font-bold text-ink-muted bg-surface-sunken px-2 py-1 rounded-pill">
                        {ATTRIBUTE_LABELS[key] || key}: {value}★
                      </span>
                    ))}
                  </div>
                )}

                {r.admin_reply && (
                  <div className="mt-3 bg-surface-muted border-l-2 border-line-strong rounded-r-control px-4 py-3">
                    <p className="text-[10px] font-black text-ink uppercase tracking-wide flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> BazaarX Response
                    </p>
                    <p className="text-[11px] text-ink-muted font-medium mt-1">{r.admin_reply}</p>
                  </div>
                )}

                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-line">
                  <span className="text-[11px] text-ink-subtle font-bold">Helpful?</span>
                  <button onClick={() => vote(r.id, true)} disabled={!authToken || voting === r.id}
                    className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-control transition disabled:opacity-40 ${
                      myVotes[r.id] === true ? 'bg-success-soft text-success border border-success' : 'bg-surface-sunken text-ink-muted hover:bg-surface-sunken'
                    }`}>
                    <ThumbsUp className="w-3 h-3" /> {r.helpful_count || 0}
                  </button>
                  <button onClick={() => vote(r.id, false)} disabled={!authToken || voting === r.id}
                    className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-control transition disabled:opacity-40 ${
                      myVotes[r.id] === false ? 'bg-danger-soft text-danger border border-danger' : 'bg-surface-sunken text-ink-muted hover:bg-surface-sunken'
                    }`}>
                    <ThumbsDown className="w-3 h-3" /> {r.not_helpful_count || 0}
                  </button>
                  {!authToken && <span className="text-[10px] text-ink-subtle font-medium">Sign in to vote</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
