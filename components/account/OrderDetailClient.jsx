'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStore } from '../providers/StoreProvider';
import { apiFetch, formatINR, formatDate, ORDER_STAGES, STAGE_LABELS } from '../../lib/apiClient';
import ReturnRequestModal from './ReturnRequestModal';
import InvoiceModal from './InvoiceModal';
import LiveGPSTracking from '../storefront/LiveGPSTracking';
import {
  ArrowLeft, CheckCircle2, Clock, XCircle, Truck, FileText, RotateCcw,
  RefreshCw, MapPin, Ban,
} from 'lucide-react';

export default function OrderDetailClient({ orderId }) {
  const { authToken } = useStore();
  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [returnItem, setReturnItem] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);

  const load = async () => {
    try {
      const res = await apiFetch(`/orders/${orderId}`, { token: authToken });
      setOrder(res.data);
      if (res.data.tracking_no) {
        const t = await apiFetch(`/orders/${orderId}/track`, { token: authToken });
        setTracking(t.data);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authToken) load();
  }, [authToken, orderId]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await apiFetch(`/orders/${orderId}/cancel`, {
        method: 'POST', token: authToken, body: { reason: cancelReason },
      });
      setOrder(res.data);
      setShowCancel(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-ink-subtle font-bold">
        <RefreshCw className="w-4 h-4 animate-spin" /> Loading order...
      </div>
    );
  }

  if (error && !order) {
    return <div className="bg-danger-soft border border-danger text-danger p-4 rounded-card font-bold">{error}</div>;
  }

  const cancelled = order.status === 'CANCELLED';
  const currentIdx = ORDER_STAGES.indexOf(order.status);
  const canCancel = ['PENDING', 'CONFIRMED', 'PACKED'].includes(order.status);
  const canReturn = order.status === 'DELIVERED';

  return (
    <div className="space-y-6">
      <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-subtle hover:text-ink">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to orders
      </Link>

      {error && (
        <div className="bg-danger-soft border border-danger text-danger p-3 rounded-card text-xs font-bold">{error}</div>
      )}

      <div className="bg-surface border border-line rounded-panel overflow-hidden">
        <div className="bg-inverse text-ink-inverse p-5 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-black text-lg">{order.order_number}</h2>
            <p className="text-ink-subtle text-xs font-medium mt-0.5">Placed {formatDate(order.created_at)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowInvoice(true)}
              className="flex items-center gap-1.5 bg-surface/10 hover:bg-surface/20 text-ink-inverse px-3 py-2 rounded-control text-xs font-bold transition">
              <FileText className="w-3.5 h-3.5" /> Invoice
            </button>
            {canCancel && (
              <button onClick={() => setShowCancel(true)}
                className="flex items-center gap-1.5 bg-danger/20 hover:bg-danger/30 text-danger px-3 py-2 rounded-control text-xs font-bold transition">
                <Ban className="w-3.5 h-3.5" /> Cancel
              </button>
            )}
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Timeline */}
          <div>
            <h3 className="font-black text-xs text-ink-muted mb-3 uppercase tracking-wide">Order Status</h3>
            {cancelled ? (
              <div className="flex items-center gap-3 bg-danger-soft border border-danger rounded-card p-4">
                <XCircle className="w-6 h-6 text-danger shrink-0" />
                <div>
                  <p className="font-black text-danger text-sm">Order cancelled</p>
                  {order.cancellation_reason && (
                    <p className="text-danger text-xs font-medium mt-0.5">{order.cancellation_reason}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {ORDER_STAGES.map((stage, idx) => {
                  const done = idx <= currentIdx;
                  const current = idx === currentIdx;
                  return (
                    <div key={stage} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-pill flex items-center justify-center shrink-0 ${done ? (current ? 'bg-warning' : 'bg-success') : 'bg-surface-sunken'}`}>
                        {done && !current && <CheckCircle2 className="w-4 h-4 text-ink-inverse" />}
                        {current && <Clock className="w-3.5 h-3.5 text-ink" />}
                        {!done && <div className="w-2 h-2 bg-surface-sunken rounded-pill" />}
                      </div>
                      <div className={`flex-1 py-2 px-3 rounded-control text-xs font-bold ${current ? 'bg-warning-soft border border-warning text-warning' : done ? 'bg-success-soft text-success' : 'text-ink-subtle'}`}>
                        {STAGE_LABELS[stage]}
                        {current && <span className="ml-2 text-[10px] font-black bg-warning text-ink px-1.5 py-0.5 rounded-pill">CURRENT</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Live courier position while the parcel is out for delivery */}
          <LiveGPSTracking orderId={orderId} status={order.status} token={authToken} />

          {/* Tracking */}
          {tracking?.scans && (
            <div>
              <h3 className="font-black text-xs text-ink-muted mb-3 uppercase tracking-wide flex items-center gap-2">
                <Truck className="w-4 h-4" /> Courier Tracking
                <span className="font-mono text-[10px] text-ink-subtle normal-case">{order.tracking_no}</span>
              </h3>
              <div className="bg-surface-muted border border-line rounded-card p-4 space-y-3">
                {tracking.scans.map((scan, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-ink">{scan.status}</p>
                      <p className="text-ink-subtle font-medium">{scan.location} · {formatDate(scan.at)}</p>
                    </div>
                  </div>
                ))}
                {tracking.is_mock && (
                  <p className="text-[10px] text-warning bg-warning-soft border border-warning rounded-control px-2 py-1 font-bold">
                    Sandbox tracking data — not a live courier feed.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Items */}
          <div>
            <h3 className="font-black text-xs text-ink-muted mb-3 uppercase tracking-wide">Items</h3>
            <div className="space-y-3">
              {(order.items || []).map(item => (
                <div key={item.id} className="flex items-center gap-3 py-2 border-b border-line last:border-0">
                  <div className="w-12 h-12 rounded-control bg-surface-sunken overflow-hidden shrink-0">
                    {item.product?.images?.[0] && <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/product/${item.product_id}`} className="font-bold text-ink text-xs hover:underline line-clamp-1">
                      {item.product?.title}
                    </Link>
                    <p className="text-[11px] text-ink-subtle font-medium">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-black text-ink text-sm shrink-0">{formatINR(item.price * item.quantity)}</span>
                  {canReturn && (
                    <button onClick={() => setReturnItem(item)}
                      className="flex items-center gap-1 text-[11px] font-bold text-accent bg-accent-soft border border-accent px-2.5 py-1.5 rounded-control hover:bg-accent-soft transition shrink-0">
                      <RotateCcw className="w-3 h-3" /> Return
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-surface-muted border border-line rounded-card p-4 space-y-1.5 text-xs font-medium">
            <Row label="Subtotal" value={formatINR(order.subtotal)} />
            {Number(order.discount) > 0 && (
              <Row label={`Discount${order.coupon_code ? ` (${order.coupon_code})` : ''}`} value={`− ${formatINR(order.discount)}`} accent="text-success" />
            )}
            <Row label="Delivery" value={Number(order.shipping_charge) === 0 ? 'FREE' : formatINR(order.shipping_charge)} />
            {Number(order.wallet_applied) > 0 && (
              <Row label="Wallet applied" value={`− ${formatINR(order.wallet_applied)}`} accent="text-success" />
            )}
            <div className="flex justify-between pt-2 mt-1 border-t border-line text-sm font-black text-ink">
              <span>Total Paid</span>
              <span>{formatINR(order.total_amount)}</span>
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="font-black text-xs text-ink-muted mb-2 uppercase tracking-wide">Delivery Address</h3>
            <p className="text-xs text-ink-muted font-medium leading-relaxed">
              <span className="font-bold text-ink">{order.shipping_address?.name}</span> ({order.shipping_address?.phone})<br />
              {order.shipping_address?.line1}
              {order.shipping_address?.line2 ? `, ${order.shipping_address.line2}` : ''}<br />
              {order.shipping_address?.city}, {order.shipping_address?.state} – {order.shipping_address?.pincode}
            </p>
          </div>
        </div>
      </div>

      {/* Cancel confirm */}
      {showCancel && (
        <div className="fixed inset-0 z-50 bg-inverse/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-panel p-6 w-full max-w-sm border border-line shadow-panel">
            <h3 className="font-black text-ink text-base">Cancel this order?</h3>
            <p className="text-ink-subtle text-sm mt-1 font-medium">
              Stock will be released and any wallet amount used will be refunded.
            </p>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              rows={3}
              placeholder="Reason (optional)"
              className="w-full mt-4 bg-surface-muted border border-line rounded-card px-4 py-3 text-xs font-semibold focus:outline-none focus:border-line-strong resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowCancel(false)} className="flex-1 bg-surface-sunken text-ink-muted py-2.5 rounded-card font-bold text-sm hover:bg-surface-sunken">
                Keep order
              </button>
              <button onClick={handleCancel} disabled={cancelling}
                className="flex-1 bg-danger text-ink-inverse py-2.5 rounded-card font-bold text-sm hover:bg-danger disabled:opacity-50">
                {cancelling ? 'Cancelling...' : 'Cancel order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {returnItem && (
        <ReturnRequestModal
          item={returnItem}
          onClose={() => setReturnItem(null)}
          onCreated={() => { setReturnItem(null); load(); }}
        />
      )}

      {showInvoice && <InvoiceModal orderId={orderId} onClose={() => setShowInvoice(false)} />}
    </div>
  );
}

function Row({ label, value, accent }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-muted">{label}</span>
      <span className={`font-bold ${accent || 'text-ink'}`}>{value}</span>
    </div>
  );
}
