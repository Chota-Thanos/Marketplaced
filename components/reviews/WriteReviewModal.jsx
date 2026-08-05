'use client';

import React, { useState } from 'react';
import { useStore } from '../providers/StoreProvider';
import { apiFetch } from '../../lib/apiClient';
import { X, Star, RefreshCw, ShieldCheck } from 'lucide-react';

const ATTRIBUTES = [
  { key: 'quality', label: 'Quality' },
  { key: 'value', label: 'Value for Money' },
  { key: 'packaging', label: 'Packaging' },
  { key: 'delivery', label: 'Delivery Speed' },
];

export default function WriteReviewModal({ productId, orderId, product, onClose, onSubmitted }) {
  const { authToken } = useStore();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [attributes, setAttributes] = useState({});
  const [mediaInput, setMediaInput] = useState('');
  const [media, setMedia] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (rating === 0) { setError('Please select a star rating.'); return; }
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/products/${productId}/reviews`, {
        method: 'POST',
        token: authToken,
        body: {
          order_id: orderId,
          rating,
          title: title || null,
          body: body || null,
          media: media.length ? media : null,
          attribute_ratings: Object.keys(attributes).length ? attributes : null,
        },
      });
      onSubmitted();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addMedia = () => {
    if (!mediaInput.trim() || media.length >= 5) return;
    setMedia([...media, mediaInput.trim()]);
    setMediaInput('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-inverse/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface rounded-panel w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">
        <div className="bg-inverse text-ink-inverse px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-black">Write a Review</h2>
            <p className="text-ink-subtle text-[11px] font-medium mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-success" /> Verified purchase
            </p>
          </div>
          <button onClick={onClose} className="text-ink-subtle hover:text-ink-inverse p-2 rounded-pill hover:bg-inverse">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {error && <div className="bg-danger-soft border border-danger text-danger p-3 rounded-card font-bold">{error}</div>}

          {product && (
            <div className="flex items-center gap-3 bg-surface-muted border border-line rounded-card p-3">
              <div className="w-12 h-12 rounded-control bg-surface overflow-hidden shrink-0">
                {product.images?.[0] && <img src={product.images[0]} alt="" className="w-full h-full object-cover" />}
              </div>
              <p className="font-bold text-ink line-clamp-2">{product.title}</p>
            </div>
          )}

          <div>
            <label className="block font-bold text-ink-muted mb-2" htmlFor="writereviewmodal-f1">Overall rating <span className="text-danger">*</span></label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} type="button"
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover(0)}
                  className="p-1">
                  <Star className={`w-7 h-7 transition ${s <= (hover || rating) ? 'fill-rating text-warning' : 'text-ink-subtle'}`} />
                </button>
              ))}
              {rating > 0 && <span className="ml-2 font-black text-ink">{rating}.0</span>}
            </div>
          </div>

          <div>
            <label htmlFor="writereviewmodal-f1" className="block font-bold text-ink-muted mb-1.5">Review title</label>
            <input id="writereviewmodal-f1" value={title} onChange={e => setTitle(e.target.value)} maxLength={255}
              placeholder="Sum up your experience in a line"
              className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 font-semibold focus:outline-none focus:border-line-strong" />
          </div>

          <div>
            <label className="block font-bold text-ink-muted mb-1.5" htmlFor="writereviewmodal-f2">Your review</label>
            <textarea id="writereviewmodal-f2" rows={4} value={body} onChange={e => setBody(e.target.value)}
              placeholder="What did you like or dislike? How was the quality, fit, and delivery?"
              className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 font-semibold focus:outline-none focus:border-line-strong resize-none leading-relaxed" />
          </div>

          <div>
            {/* Labels a group of rating buttons, not a single form control,
                so it's a group label rather than a <label htmlFor>. */}
            <span id="attr-ratings-label" className="block font-bold text-ink-muted mb-2">
              Rate specific aspects <span className="text-ink-subtle font-normal">(optional)</span>
            </span>
            <div className="space-y-2" role="group" aria-labelledby="attr-ratings-label">
              {ATTRIBUTES.map(attr => (
                <div key={attr.key} className="flex items-center justify-between bg-surface-muted border border-line rounded-control px-3 py-2">
                  <span className="font-bold text-ink-muted">{attr.label}</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button key={s} type="button"
                        onClick={() => setAttributes(a => ({ ...a, [attr.key]: s }))}
                        className="p-0.5">
                        <Star className={`w-4 h-4 ${s <= (attributes[attr.key] || 0) ? 'fill-rating text-warning' : 'text-ink-subtle'}`} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="writereviewmodal-x137" className="block font-bold text-ink-muted mb-1.5">
              Photos or video <span className="text-ink-subtle font-normal">(up to 5 URLs)</span>
            </label>
            <div className="flex gap-2">
              <input id="writereviewmodal-x137" value={mediaInput} onChange={e => setMediaInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMedia(); } }}
                placeholder="Paste an image URL"
                className="flex-1 bg-surface-muted border border-line rounded-card px-4 py-3 font-mono text-[11px] focus:outline-none focus:border-line-strong" />
              <button type="button" onClick={addMedia} disabled={media.length >= 5}
                className="bg-inverse text-ink-inverse px-4 rounded-card font-bold disabled:opacity-40">Add</button>
            </div>
            {media.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {media.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt="" className="w-16 h-16 object-cover rounded-control border border-line" />
                    <button type="button" onClick={() => setMedia(media.filter((_, x) => x !== i))}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-danger text-ink-inverse rounded-pill flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-[11px] text-ink-subtle bg-surface-muted border border-line rounded-control p-3 font-medium">
            Your review will be published after a quick moderation check.
          </p>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 bg-surface-sunken text-ink-muted py-3 rounded-card font-bold hover:bg-surface-sunken">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-inverse text-ink-inverse py-3 rounded-card font-bold hover:bg-inverse disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
              {saving ? 'Submitting...' : 'Submit review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
