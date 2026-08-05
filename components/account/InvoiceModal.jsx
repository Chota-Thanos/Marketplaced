'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '../providers/StoreProvider';
import { apiFetch, formatINR, formatDate } from '../../lib/apiClient';
import { X, Printer, RefreshCw } from 'lucide-react';
import { brand } from '@ds/brand';

/**
 * Renders the invoice and hands it to the browser's print dialog, which is
 * where "Save as PDF" lives — no server-side PDF toolchain required.
 */
export default function InvoiceModal({ orderId, onClose }) {
  const { authToken } = useStore();
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch(`/orders/${orderId}/invoice`, { token: authToken })
      .then(res => setInvoice(res.data))
      .catch(e => setError(e.message));
  }, [orderId, authToken]);

  return (
    <div className="fixed inset-0 z-50 bg-inverse/70 backdrop-blur-sm flex items-center justify-center p-4 print:bg-surface print:p-0">
      <div className="bg-surface rounded-panel w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden print:max-h-none print:rounded-none print:shadow-none">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line print:hidden">
          <h2 className="font-black text-ink">Tax Invoice</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-inverse text-ink-inverse px-3 py-2 rounded-control text-xs font-bold hover:bg-inverse">
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
            <button onClick={onClose} className="text-ink-subtle hover:text-ink p-2 rounded-pill hover:bg-surface-sunken">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 text-ink">
          {error && <div className="bg-danger-soft border border-danger text-danger p-3 rounded-card text-xs font-bold">{error}</div>}

          {!invoice && !error && (
            <div className="flex items-center justify-center gap-2 py-12 text-ink-subtle font-bold">
              <RefreshCw className="w-4 h-4 animate-spin" /> Generating invoice...
            </div>
          )}

          {invoice && (
            <div className="space-y-6 text-xs">
              <div className="flex justify-between items-start gap-6">
                <div>
                  <p className="text-2xl font-black">{brand.nameDisplay}<span className="text-accent">{brand.nameAccent}</span></p>
                  <p className="text-ink-muted font-medium mt-1 leading-relaxed">
                    {invoice.seller.name}<br />
                    {invoice.seller.address}<br />
                    GSTIN: {invoice.seller.gstin}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-base">TAX INVOICE</p>
                  <p className="text-ink-muted font-medium mt-1">
                    {invoice.invoice_number}<br />
                    {formatDate(invoice.issued_at)}
                  </p>
                </div>
              </div>

              <div className="border-t border-line pt-4">
                <p className="font-black text-ink-subtle uppercase text-[10px] tracking-wide mb-1">Billed To</p>
                <p className="font-medium text-ink-muted leading-relaxed">
                  <span className="font-bold text-ink">{invoice.order.shipping_address?.name}</span><br />
                  {invoice.order.shipping_address?.line1}<br />
                  {invoice.order.shipping_address?.city}, {invoice.order.shipping_address?.state} – {invoice.order.shipping_address?.pincode}<br />
                  {invoice.order.shipping_address?.phone}
                </p>
              </div>

              <table className="w-full border-t border-line pt-4">
                <thead>
                  <tr className="border-b border-line">
                    <th className="text-left py-2 font-black text-ink-subtle uppercase text-[10px]">Item</th>
                    <th className="text-center py-2 font-black text-ink-subtle uppercase text-[10px]">Qty</th>
                    <th className="text-right py-2 font-black text-ink-subtle uppercase text-[10px]">Rate</th>
                    <th className="text-right py-2 font-black text-ink-subtle uppercase text-[10px]">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.order.items || []).map(item => (
                    <tr key={item.id} className="border-b border-line">
                      <td className="py-2.5 font-semibold">{item.product?.title}</td>
                      <td className="py-2.5 text-center font-medium">{item.quantity}</td>
                      <td className="py-2.5 text-right font-medium">{formatINR(item.price)}</td>
                      <td className="py-2.5 text-right font-bold">{formatINR(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="w-64 space-y-1.5">
                  <TotalRow label="Taxable Value" value={formatINR(invoice.totals.taxable_value)} />
                  <TotalRow label={`GST (${invoice.totals.gst_rate})`} value={formatINR(invoice.totals.gst)} />
                  <TotalRow label="Subtotal" value={formatINR(invoice.totals.subtotal)} />
                  {invoice.totals.discount > 0 && <TotalRow label="Discount" value={`− ${formatINR(invoice.totals.discount)}`} />}
                  <TotalRow label="Shipping" value={invoice.totals.shipping === 0 ? 'FREE' : formatINR(invoice.totals.shipping)} />
                  {invoice.totals.wallet_applied > 0 && <TotalRow label="Wallet Applied" value={`− ${formatINR(invoice.totals.wallet_applied)}`} />}
                  <div className="flex justify-between border-t border-line pt-2 mt-1 font-black text-sm">
                    <span>Grand Total</span>
                    <span>{formatINR(invoice.totals.grand_total)}</span>
                  </div>
                </div>
              </div>

              <p className="text-center text-ink-subtle font-medium pt-4 border-t border-line">
                This is a computer-generated invoice and does not require a signature.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TotalRow({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-muted font-medium">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
