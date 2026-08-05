'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '../providers/StoreProvider';
import { apiFetch, formatINR, formatDate, RETURN_STATUS_LABELS } from '../../lib/apiClient';
import { RotateCcw, RefreshCw, CheckCircle2, Clock, XCircle, Truck } from 'lucide-react';

const REFUND_STEPS = ['REQUESTED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'REFUNDED'];

const STATUS_COLORS = {
  REQUESTED: 'bg-warning-soft text-warning border-warning',
  PICKUP_SCHEDULED: 'bg-accent-soft text-accent border-accent',
  PICKED_UP: 'bg-accent-soft text-accent border-accent',
  REFUNDED: 'bg-success-soft text-success border-success',
  REJECTED: 'bg-danger-soft text-danger border-danger',
};

export default function ReturnsClient() {
  const { authToken } = useStore();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authToken) return;
    apiFetch('/returns/mine', { token: authToken })
      .then(res => setReturns(res.data || []))
      .finally(() => setLoading(false));
  }, [authToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-ink-subtle font-bold">
        <RefreshCw className="w-4 h-4 animate-spin" /> Loading returns...
      </div>
    );
  }

  if (returns.length === 0) {
    return (
      <div className="bg-surface-muted border border-line rounded-panel p-12 text-center">
        <div className="w-14 h-14 bg-surface-sunken rounded-pill flex items-center justify-center mx-auto mb-4">
          <RotateCcw className="w-7 h-7 text-ink-subtle" />
        </div>
        <h3 className="font-black text-ink">No returns yet</h3>
        <p className="text-ink-subtle text-sm mt-1 font-medium">
          You can raise a return from any delivered order within 7 days.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {returns.map(r => {
        const rejected = r.status === 'REJECTED';
        const currentIdx = REFUND_STEPS.indexOf(r.status);
        return (
          <div key={r.id} className="bg-surface border border-line rounded-panel overflow-hidden">
            <div className="p-5 flex items-start gap-4 border-b border-line">
              <div className="w-14 h-14 rounded-control bg-surface-sunken overflow-hidden shrink-0">
                {r.order_item?.product?.images?.[0] && (
                  <img src={r.order_item.product.images[0]} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-ink text-sm">{r.rma_number}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-pill border ${STATUS_COLORS[r.status]}`}>
                    {RETURN_STATUS_LABELS[r.status] || r.status}
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-pill bg-surface-sunken text-ink-muted">
                    {r.kind}
                  </span>
                </div>
                <p className="text-xs font-semibold text-ink-muted mt-1 line-clamp-1">
                  {r.order_item?.product?.title}
                </p>
                <p className="text-[11px] text-ink-subtle font-medium mt-0.5">
                  {r.reason} · Raised {formatDate(r.created_at)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-black text-ink">{formatINR(r.refund_amount)}</p>
                <p className="text-[10px] text-ink-subtle font-bold">
                  {r.refund_mode === 'WALLET' ? 'To wallet' : 'To source'}
                </p>
              </div>
            </div>

            <div className="p-5">
              {rejected ? (
                <div className="flex items-start gap-3 bg-danger-soft border border-danger rounded-card p-4">
                  <XCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black text-danger text-xs">Return rejected</p>
                    {r.admin_note && <p className="text-danger text-[11px] font-medium mt-0.5">{r.admin_note}</p>}
                  </div>
                </div>
              ) : (
                <>
                  <h4 className="font-black text-[11px] text-ink-subtle uppercase tracking-wide mb-3">Refund Progress</h4>
                  <div className="flex items-center gap-1">
                    {REFUND_STEPS.map((step, idx) => {
                      const done = idx <= currentIdx;
                      return (
                        <React.Fragment key={step}>
                          <div className="flex flex-col items-center gap-1.5 shrink-0">
                            <div className={`w-7 h-7 rounded-pill flex items-center justify-center ${done ? 'bg-success text-ink-inverse' : 'bg-surface-sunken text-ink-subtle'}`}>
                              {done ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-3.5 h-3.5" />}
                            </div>
                            <span className={`text-[9px] font-bold text-center leading-tight ${done ? 'text-ink' : 'text-ink-subtle'}`}>
                              {RETURN_STATUS_LABELS[step]}
                            </span>
                          </div>
                          {idx < REFUND_STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 -mt-4 ${idx < currentIdx ? 'bg-success' : 'bg-surface-sunken'}`} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {r.pickup_tracking_no && (
                    <p className="flex items-center gap-1.5 text-[11px] text-ink-muted font-medium mt-4 bg-surface-muted border border-line rounded-control p-2.5">
                      <Truck className="w-3.5 h-3.5 text-accent" />
                      Reverse pickup tracking: <span className="font-mono font-bold text-ink">{r.pickup_tracking_no}</span>
                    </p>
                  )}

                  {r.status === 'REFUNDED' && (
                    <p className="text-[11px] text-success bg-success-soft border border-success rounded-control p-2.5 mt-3 font-bold">
                      {formatINR(r.refund_amount)} refunded
                      {r.refund_mode === 'WALLET'
                        ? ' to your BazaarX wallet.'
                        : ' to your original payment method — expect it within 5–7 business days.'}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
