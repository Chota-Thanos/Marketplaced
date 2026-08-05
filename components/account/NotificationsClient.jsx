'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '../providers/StoreProvider';
import { apiFetch, formatDate } from '../../lib/apiClient';
import { Bell, CheckCheck, RefreshCw, Package, Tag, RotateCcw, Star, TrendingDown } from 'lucide-react';

const TYPE_META = {
  ORDER_UPDATE: { icon: Package, tone: 'bg-accent-soft text-accent', label: 'Order updates' },
  REFUND: { icon: RotateCcw, tone: 'bg-success-soft text-success', label: 'Refunds' },
  PRICE_DROP: { icon: TrendingDown, tone: 'bg-warning-soft text-warning', label: 'Price drops' },
  BACK_IN_STOCK: { icon: Package, tone: 'bg-accent-soft text-accent', label: 'Back in stock' },
  REVIEW_REQUEST: { icon: Star, tone: 'bg-accent-soft text-accent', label: 'Review requests' },
  PROMO: { icon: Tag, tone: 'bg-danger-soft text-danger', label: 'Deals & promotions' },
};

export default function NotificationsClient() {
  const { authToken } = useStore();
  const [notifications, setNotifications] = useState([]);
  const [prefs, setPrefs] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const load = () => apiFetch('/notifications', { token: authToken })
    .then(res => setNotifications(res.data || []))
    .finally(() => setLoading(false));

  useEffect(() => {
    if (!authToken) return;
    load();
    apiFetch('/profile', { token: authToken })
      .then(res => setPrefs(res.data.notification_preferences || {}));
  }, [authToken]);

  const markAllRead = async () => {
    await apiFetch('/notifications/read-all', { method: 'PUT', token: authToken });
    load();
  };

  const markRead = async (id) => {
    await apiFetch(`/notifications/${id}/read`, { method: 'PUT', token: authToken });
    load();
  };

  const togglePref = async (type) => {
    const next = { ...prefs, [type]: prefs[type] === false };
    setPrefs(next);
    setSavingPrefs(true);
    try {
      await apiFetch('/profile/notifications', { method: 'PUT', token: authToken, body: { preferences: next } });
    } finally {
      setSavingPrefs(false);
    }
  };

  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-5">
      <div className="bg-surface border border-line rounded-panel overflow-hidden">
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <h2 className="font-black text-ink text-sm flex items-center gap-2">
            <Bell className="w-4 h-4" /> Notifications
            {unread > 0 && (
              <span className="bg-danger text-ink-inverse text-[10px] font-black px-2 py-0.5 rounded-pill">{unread} new</span>
            )}
          </h2>
          {unread > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1.5 text-xs font-bold text-ink-muted hover:text-ink">
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-12 text-ink-subtle font-bold">
            <RefreshCw className="w-4 h-4 animate-spin" /> Loading...
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="p-10 text-center text-ink-subtle font-bold text-sm">
            No notifications yet.
          </div>
        )}

        <div className="divide-y divide-line">
          {notifications.map(n => {
            const meta = TYPE_META[n.type] || { icon: Bell, tone: 'bg-surface-sunken text-ink-muted' };
            const Icon = meta.icon;
            return (
              <button
                key={n.id}
                onClick={() => !n.is_read && markRead(n.id)}
                className={`w-full text-left flex items-start gap-3 px-5 py-4 transition hover:bg-surface-muted ${n.is_read ? '' : 'bg-accent-soft/40'}`}
              >
                <div className={`w-9 h-9 rounded-control flex items-center justify-center shrink-0 ${meta.tone}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-ink text-xs">{n.title}</p>
                  {n.body && <p className="text-[11px] text-ink-muted font-medium mt-0.5">{n.body}</p>}
                  <p className="text-[10px] text-ink-subtle font-medium mt-1">{formatDate(n.created_at)}</p>
                </div>
                {!n.is_read && <span className="w-2 h-2 bg-accent rounded-pill shrink-0 mt-2" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-surface border border-line rounded-panel p-5">
        <h2 className="font-black text-ink text-sm mb-1">Notification Preferences</h2>
        <p className="text-ink-subtle text-xs font-medium mb-4">
          Turn off any category you don't want to hear about. Order updates are recommended.
        </p>
        <div className="space-y-2">
          {Object.entries(TYPE_META).map(([type, meta]) => {
            const enabled = prefs[type] !== false;
            return (
              <label key={type} className="flex items-center justify-between gap-3 bg-surface-muted border border-line rounded-card px-4 py-3 cursor-pointer">
                <span className="font-bold text-ink text-xs">{meta.label}</span>
                <input
                  type="checkbox"
                  checked={enabled}
                  disabled={savingPrefs}
                  onChange={() => togglePref(type)}
                  className="w-5 h-5 accent-primary cursor-pointer"
                />
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
