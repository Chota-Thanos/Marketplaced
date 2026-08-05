'use client';

import React, { useState } from 'react';
import { useStore } from '../providers/StoreProvider';
import { apiFetch, formatINR } from '../../lib/apiClient';
import { X, RotateCcw, RefreshCw } from 'lucide-react';

const REASONS = [
  'Size / fit issue',
  'Damaged or defective',
  'Wrong item delivered',
  'Not as described',
  'Quality not as expected',
  'No longer needed',
];

export default function ReturnRequestModal({ item, onClose, onCreated }) {
  const { authToken } = useStore();
  const [kind, setKind] = useState('RETURN');
  const [reason, setReason] = useState(REASONS[0]);
  const [comments, setComments] = useState('');
  const [refundMode, setRefundMode] = useState('SOURCE');
  const [exchangeVariantId, setExchangeVariantId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const variants = item.product?.variants || [];

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiFetch('/returns', {
        method: 'POST',
        token: authToken,
        body: {
          order_item_id: item.id,
          kind,
          reason,
          comments: comments || null,
          refund_mode: kind === 'RETURN' ? refundMode : null,
          exchange_variant_id: kind === 'EXCHANGE' ? exchangeVariantId : null,
        },
      });
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-inverse/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface rounded-panel w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">
        <div className="bg-inverse text-ink-inverse px-6 py-4 flex items-center justify-between">
          <h2 className="font-black flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-warning" /> Return or Exchange
          </h2>
          <button onClick={onClose} className="text-ink-subtle hover:text-ink-inverse p-2 rounded-pill hover:bg-inverse">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {error && <div className="bg-danger-soft border border-danger text-danger p-3 rounded-card font-bold">{error}</div>}

          <div className="flex items-center gap-3 bg-surface-muted border border-line rounded-card p-3">
            <div className="w-12 h-12 rounded-control bg-surface overflow-hidden shrink-0">
              {item.product?.images?.[0] && <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-ink line-clamp-1">{item.product?.title}</p>
              <p className="text-ink-subtle font-medium">Qty {item.quantity} · {formatINR(item.price)}</p>
            </div>
          </div>

          <div className="flex bg-surface-sunken rounded-card p-1">
            {['RETURN', 'EXCHANGE'].map(k => (
              <button key={k} type="button" onClick={() => setKind(k)}
                className={`flex-1 py-2 rounded-control font-bold transition ${kind === k ? 'bg-surface shadow-subtle text-ink' : 'text-ink-subtle'}`}>
                {k === 'RETURN' ? 'Return & Refund' : 'Exchange'}
              </button>
            ))}
          </div>

          <div>
            <label className="block font-bold text-ink-muted mb-1.5" htmlFor="returnrequestmodal-f1">Reason</label>
            <select id="returnrequestmodal-f1" value={reason} onChange={e => setReason(e.target.value)}
              className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 font-semibold focus:outline-none focus:border-line-strong">
              {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {kind === 'EXCHANGE' && (
            <div>
              <label className="block font-bold text-ink-muted mb-1.5" htmlFor="returnrequestmodal-f2">Exchange for</label>
              <select id="returnrequestmodal-f2" required value={exchangeVariantId} onChange={e => setExchangeVariantId(e.target.value)}
                className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 font-semibold focus:outline-none focus:border-line-strong">
                <option value="">— Select a variant —</option>
                {variants.map(v => (
                  <option key={v.id} value={v.id} disabled={v.stock === 0}>
                    {[v.color, v.size].filter(Boolean).join(' - ')} {v.stock === 0 ? '(out of stock)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {kind === 'RETURN' && (
            <div>
              <label className="block font-bold text-ink-muted mb-1.5" htmlFor="returnrequestmodal-f3">Refund to</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'SOURCE', label: 'Original payment', note: '5–7 business days' },
                  { id: 'WALLET', label: 'BazaarX Wallet', note: 'Instant' },
                ].map(m => (
                  <button key={m.id} type="button" onClick={() => setRefundMode(m.id)}
                    className={`p-3 rounded-card border text-left transition ${refundMode === m.id ? 'bg-inverse text-ink-inverse border-line-strong' : 'bg-surface border-line hover:border-line'}`}>
                    <p className="font-bold">{m.label}</p>
                    <p className={`text-[10px] font-medium mt-0.5 ${refundMode === m.id ? 'text-ink-subtle' : 'text-ink-subtle'}`}>{m.note}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="returnrequestmodal-f3" className="block font-bold text-ink-muted mb-1.5">Additional comments <span className="text-ink-subtle font-normal">(optional)</span></label>
            <textarea id="returnrequestmodal-f3" rows={3} value={comments} onChange={e => setComments(e.target.value)}
              placeholder="Tell us more so we can resolve this faster..."
              className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 font-semibold focus:outline-none focus:border-line-strong resize-none" />
          </div>

          <p className="text-[11px] text-ink-subtle bg-surface-muted border border-line rounded-control p-3 font-medium">
            Returns are accepted within 7 days of delivery. Once approved, a free reverse pickup will be scheduled.
          </p>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-surface-sunken text-ink-muted py-3 rounded-card font-bold hover:bg-surface-sunken">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-inverse text-ink-inverse py-3 rounded-card font-bold hover:bg-inverse disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
              {saving ? 'Submitting...' : 'Submit request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
