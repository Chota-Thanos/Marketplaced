'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch, formatDate } from '../../lib/apiClient';
import { Star, Check, X, MessageSquare, RefreshCw, ShieldCheck } from 'lucide-react';

export default function ReviewsSection({ token }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [replyFor, setReplyFor] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [toast, setToast] = useState('');

  const load = () => apiFetch('/admin/reviews/pending', { token })
    .then(res => setReviews(res.data || []))
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const moderate = async (id, status) => {
    setBusy(id);
    try {
      await apiFetch(`/admin/reviews/${id}/moderate`, { method: 'PUT', token, body: { status } });
      showToast(status === 'APPROVED' ? '✅ Review approved and published.' : '🚫 Review rejected.');
      await load();
    } finally {
      setBusy(null);
    }
  };

  const submitReply = async (id) => {
    if (!replyText.trim()) return;
    setBusy(id);
    try {
      await apiFetch(`/admin/reviews/${id}/reply`, { method: 'PUT', token, body: { admin_reply: replyText } });
      showToast('💬 Brand response posted.');
      setReplyFor(null);
      setReplyText('');
      await load();
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-ink-subtle font-bold">
        <RefreshCw className="w-4 h-4 animate-spin" /> Loading moderation queue...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-inverse text-ink-inverse px-6 py-3 rounded-pill shadow-panel z-50 font-bold text-sm">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-ink-subtle text-sm font-bold">
          {reviews.length} review{reviews.length === 1 ? '' : 's'} awaiting moderation
        </p>
        <button onClick={load} className="p-2.5 bg-surface border border-line rounded-card text-ink-muted hover:border-line-strong">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {reviews.length === 0 && (
        <div className="bg-surface border border-line rounded-panel p-12 text-center">
          <Star className="w-10 h-10 text-ink-subtle mx-auto mb-3" />
          <p className="font-black text-ink">Queue is clear</p>
          <p className="text-ink-subtle text-sm font-medium mt-1">No reviews are waiting for moderation.</p>
        </div>
      )}

      {reviews.map(r => (
        <div key={r.id} className="bg-surface border border-line rounded-card p-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-control bg-surface-sunken overflow-hidden shrink-0">
              {r.product?.images?.[0] && <img src={r.product.images[0]} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-ink text-xs line-clamp-1">{r.product?.title}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'fill-rating text-warning' : 'text-ink-subtle'}`} />
                  ))}
                </div>
                <span className="text-[11px] font-bold text-ink-muted">{r.user?.name}</span>
                {r.verified_purchase && (
                  <span className="flex items-center gap-1 text-[10px] font-black text-success bg-success-soft border border-success px-2 py-0.5 rounded-pill">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </span>
                )}
                <span className="text-[10px] text-ink-subtle font-medium">{formatDate(r.created_at)}</span>
              </div>
              {r.title && <p className="font-black text-ink text-xs mt-2">{r.title}</p>}
              {r.body && <p className="text-[11px] text-ink-muted font-medium mt-1 leading-relaxed">{r.body}</p>}

              {r.media?.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {r.media.map((url, i) => (
                    <img key={i} src={url} alt="" className="w-14 h-14 object-cover rounded-control border border-line" />
                  ))}
                </div>
              )}

              {r.attribute_ratings && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {Object.entries(r.attribute_ratings).map(([k, v]) => (
                    <span key={k} className="text-[10px] font-bold text-ink-muted bg-surface-sunken px-2 py-0.5 rounded-pill capitalize">
                      {k}: {v}★
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {replyFor === r.id ? (
            <div className="mt-4 space-y-2">
              <textarea
                autoFocus
                rows={3}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Write a public brand response..."
                className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 text-xs font-semibold focus:outline-none focus:border-line-strong resize-none"
              />
              <div className="flex gap-2">
                <button onClick={() => submitReply(r.id)} disabled={busy === r.id}
                  className="bg-inverse text-ink-inverse px-4 py-2 rounded-control text-xs font-bold disabled:opacity-50">
                  Post response
                </button>
                <button onClick={() => { setReplyFor(null); setReplyText(''); }}
                  className="bg-surface-sunken text-ink-muted px-4 py-2 rounded-control text-xs font-bold">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-line">
              <button onClick={() => moderate(r.id, 'APPROVED')} disabled={busy === r.id}
                className="flex items-center gap-1.5 bg-success text-ink-inverse px-3 py-2 rounded-control text-xs font-bold hover:bg-success disabled:opacity-50">
                <Check className="w-3.5 h-3.5" /> Approve
              </button>
              <button onClick={() => moderate(r.id, 'REJECTED')} disabled={busy === r.id}
                className="flex items-center gap-1.5 bg-danger-soft text-danger border border-danger px-3 py-2 rounded-control text-xs font-bold hover:bg-danger-soft disabled:opacity-50">
                <X className="w-3.5 h-3.5" /> Reject
              </button>
              <button onClick={() => { setReplyFor(r.id); setReplyText(r.admin_reply || ''); }}
                className="flex items-center gap-1.5 bg-surface-sunken text-ink-muted px-3 py-2 rounded-control text-xs font-bold hover:bg-surface-sunken ml-auto">
                <MessageSquare className="w-3.5 h-3.5" /> Reply
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
