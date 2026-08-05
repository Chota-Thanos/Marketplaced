'use client';

import React, { useState } from 'react';
import { apiFetch } from '../../lib/apiClient';
import { Send, RefreshCw, MessageSquare } from 'lucide-react';

export default function BroadcastSection({ token }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('PROMO');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const send = async (e) => {
    e.preventDefault();
    setSending(true); setResult(''); setError('');
    try {
      const res = await apiFetch('/admin/notifications/broadcast', {
        method: 'POST', token, body: { title, body: body || null, type },
      });
      setResult(`${res.message}${res.skipped ? ` ${res.skipped} customer(s) opted out of this category.` : ''}`);
      setTitle(''); setBody('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      <form onSubmit={send} className="bg-surface border border-line rounded-panel p-6 space-y-4">
        <div>
          <h2 className="font-black text-ink flex items-center gap-2 text-sm">
            <MessageSquare className="w-4 h-4" /> Broadcast Notification
          </h2>
          <p className="text-ink-subtle text-xs font-medium mt-1">
            Sends an in-app notification to every active customer. Customers who opted out of
            this category are skipped automatically.
          </p>
        </div>

        {result && <div className="bg-success-soft border border-success text-success p-3 rounded-card text-xs font-bold">{result}</div>}
        {error && <div className="bg-danger-soft border border-danger text-danger p-3 rounded-card text-xs font-bold">⚠️ {error}</div>}

        <div>
          <label className="block text-xs font-bold text-ink-muted mb-1.5" htmlFor="broadcastsection-f1">Category</label>
          <select id="broadcastsection-f1" value={type} onChange={e => setType(e.target.value)}
            className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 text-xs font-semibold focus:outline-none focus:border-line-strong">
            <option value="PROMO">Deals & promotions</option>
            <option value="ORDER_UPDATE">Order updates</option>
            <option value="PRICE_DROP">Price drops</option>
            <option value="BACK_IN_STOCK">Back in stock</option>
            <option value="REVIEW_REQUEST">Review requests</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-ink-muted mb-1.5" htmlFor="broadcastsection-f2">Title <span className="text-danger">*</span></label>
          <input id="broadcastsection-f2" required value={title} onChange={e => setTitle(e.target.value)} maxLength={255}
            placeholder="e.g. Festive Sale is live — up to 60% off"
            className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 text-xs font-semibold focus:outline-none focus:border-line-strong" />
        </div>

        <div>
          <label className="block text-xs font-bold text-ink-muted mb-1.5" htmlFor="broadcastsection-f3">Message</label>
          <textarea id="broadcastsection-f3" rows={4} value={body} onChange={e => setBody(e.target.value)}
            placeholder="Add more detail for the notification body..."
            className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 text-xs font-semibold focus:outline-none focus:border-line-strong resize-none" />
        </div>

        <div className="bg-warning-soft border border-warning rounded-card p-3">
          <p className="text-[11px] font-bold text-warning">
            Email and SMS delivery is running in sandbox mode — messages are written to the Laravel
            log instead of being sent. In-app notifications are real.
          </p>
        </div>

        <button type="submit" disabled={sending || !title.trim()}
          className="flex items-center gap-2 bg-inverse text-ink-inverse px-5 py-3 rounded-card text-xs font-bold hover:bg-inverse disabled:opacity-50">
          {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {sending ? 'Sending...' : 'Send broadcast'}
        </button>
      </form>
    </div>
  );
}
