'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch, formatINR, formatDate, RETURN_STATUS_LABELS } from '../../lib/apiClient';
import { RotateCcw, Check, X, Truck, Wallet, RefreshCw, PackageCheck } from 'lucide-react';

const STATUS_COLORS = {
  REQUESTED: 'bg-warning-soft text-warning border-warning',
  PICKUP_SCHEDULED: 'bg-accent-soft text-accent border-accent',
  PICKED_UP: 'bg-accent-soft text-accent border-accent',
  REFUNDED: 'bg-success-soft text-success border-success',
  REJECTED: 'bg-danger-soft text-danger border-danger',
};

const FILTERS = ['All', 'REQUESTED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'REFUNDED', 'REJECTED'];

export default function ReturnsSection({ token }) {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [busy, setBusy] = useState(null);
  const [rejectFor, setRejectFor] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [toast, setToast] = useState('');

  const load = () => apiFetch('/admin/returns', { token })
    .then(res => setReturns(res.data || []))
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3500); };

  const act = async (id, path, body, message) => {
    setBusy(id);
    try {
      await apiFetch(`/admin/returns/${id}/${path}`, { method: 'POST', token, body });
      showToast(message);
      await load();
    } catch (e) {
      showToast(`⚠️ ${e.message}`);
    } finally {
      setBusy(null);
    }
  };

  const doReject = async (id) => {
    if (!rejectNote.trim()) return;
    await act(id, 'reject', { admin_note: rejectNote }, '🚫 Return rejected.');
    setRejectFor(null);
    setRejectNote('');
  };

  const visible = filter === 'All' ? returns : returns.filter(r => r.status === filter);
  const counts = FILTERS.slice(1).reduce((acc, s) => {
    acc[s] = returns.filter(r => r.status === s).length;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-ink-subtle font-bold">
        <RefreshCw className="w-4 h-4 animate-spin" /> Loading returns...
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

      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-pill text-xs font-bold border transition ${
              filter === f ? 'bg-inverse text-ink-inverse border-line-strong' : 'bg-surface text-ink-muted border-line hover:border-line-strong'
            }`}>
            {f === 'All' ? 'All' : RETURN_STATUS_LABELS[f]}
            {f !== 'All' && <span className="ml-1.5 bg-surface-sunken text-ink-muted px-1.5 py-0.5 rounded-pill">{counts[f] || 0}</span>}
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="bg-surface border border-line rounded-panel p-12 text-center">
          <RotateCcw className="w-10 h-10 text-ink-subtle mx-auto mb-3" />
          <p className="font-black text-ink">No returns here</p>
          <p className="text-ink-subtle text-sm font-medium mt-1">Nothing matches this filter.</p>
        </div>
      )}

      {visible.map(r => (
        <div key={r.id} className="bg-surface border border-line rounded-card p-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-control bg-surface-sunken overflow-hidden shrink-0">
              {r.order_item?.product?.images?.[0] && (
                <img src={r.order_item.product.images[0]} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-ink text-sm">{r.rma_number}</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-pill border ${STATUS_COLORS[r.status]}`}>
                  {RETURN_STATUS_LABELS[r.status]}
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-pill bg-surface-sunken text-ink-muted">{r.kind}</span>
              </div>
              <p className="text-xs font-semibold text-ink-muted mt-1 line-clamp-1">{r.order_item?.product?.title}</p>
              <p className="text-[11px] text-ink-subtle font-medium mt-0.5">
                {r.user?.name} · Order {r.order?.order_number} · {r.reason}
              </p>
              {r.comments && <p className="text-[11px] text-ink-subtle font-medium italic mt-1">"{r.comments}"</p>}
              <p className="text-[10px] text-ink-subtle font-medium mt-1">Raised {formatDate(r.created_at)}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-black text-ink">{formatINR(r.refund_amount)}</p>
              <p className="text-[10px] text-ink-subtle font-bold">
                {r.refund_mode === 'WALLET' ? 'To wallet' : 'To source'}
              </p>
            </div>
          </div>

          {rejectFor === r.id ? (
            <div className="mt-4 space-y-2">
              <textarea autoFocus rows={2} value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                placeholder="Reason for rejection (shown to the customer)"
                className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 text-xs font-semibold focus:outline-none focus:border-line-strong resize-none" />
              <div className="flex gap-2">
                <button onClick={() => doReject(r.id)} disabled={!rejectNote.trim()}
                  className="bg-danger text-ink-inverse px-4 py-2 rounded-control text-xs font-bold disabled:opacity-50">
                  Confirm rejection
                </button>
                <button onClick={() => { setRejectFor(null); setRejectNote(''); }}
                  className="bg-surface-sunken text-ink-muted px-4 py-2 rounded-control text-xs font-bold">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-line flex-wrap">
              {r.status === 'REQUESTED' && (
                <>
                  <button onClick={() => act(r.id, 'approve', {}, '✅ Approved — reverse pickup scheduled.')} disabled={busy === r.id}
                    className="flex items-center gap-1.5 bg-success text-ink-inverse px-3 py-2 rounded-control text-xs font-bold hover:bg-success disabled:opacity-50">
                    <Check className="w-3.5 h-3.5" /> Approve & schedule pickup
                  </button>
                  <button onClick={() => setRejectFor(r.id)}
                    className="flex items-center gap-1.5 bg-danger-soft text-danger border border-danger px-3 py-2 rounded-control text-xs font-bold hover:bg-danger-soft">
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </>
              )}

              {r.status === 'PICKUP_SCHEDULED' && (
                <button onClick={() => act(r.id, 'picked-up', {}, '📦 Marked as picked up.')} disabled={busy === r.id}
                  className="flex items-center gap-1.5 bg-accent text-ink-inverse px-3 py-2 rounded-control text-xs font-bold hover:bg-accent disabled:opacity-50">
                  <PackageCheck className="w-3.5 h-3.5" /> Mark picked up
                </button>
              )}

              {r.status === 'PICKED_UP' && (
                <>
                  <button onClick={() => act(r.id, 'refund', { refund_mode: 'WALLET' }, '💰 Refunded to wallet.')} disabled={busy === r.id}
                    className="flex items-center gap-1.5 bg-inverse text-ink-inverse px-3 py-2 rounded-control text-xs font-bold hover:bg-inverse disabled:opacity-50">
                    <Wallet className="w-3.5 h-3.5" /> Refund to wallet
                  </button>
                  <button onClick={() => act(r.id, 'refund', { refund_mode: 'SOURCE' }, '💳 Refund issued to source.')} disabled={busy === r.id}
                    className="flex items-center gap-1.5 bg-surface border border-line text-ink-muted px-3 py-2 rounded-control text-xs font-bold hover:border-line-strong disabled:opacity-50">
                    Refund to source
                  </button>
                </>
              )}

              {r.pickup_tracking_no && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-ink-subtle ml-auto">
                  <Truck className="w-3.5 h-3.5" /> {r.pickup_tracking_no}
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
