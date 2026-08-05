'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useStore } from './providers/StoreProvider';
import { apiFetch, formatDate } from '../lib/apiClient';
import { Bell, CheckCheck } from 'lucide-react';

export default function NotificationBell() {
  const { authToken } = useStore();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const load = () => {
    if (!authToken) return;
    apiFetch('/notifications', { token: authToken })
      .then(res => {
        setNotifications((res.data || []).slice(0, 6));
        setUnread(res.unread_count || 0);
      })
      .catch(() => {});
  };

  useEffect(() => { load(); }, [authToken]);

  // Close on outside click.
  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const markAllRead = async () => {
    await apiFetch('/notifications/read-all', { method: 'PUT', token: authToken });
    load();
  };

  if (!authToken) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(o => !o); if (!open) load(); }}
        className="relative p-2 rounded-pill text-ink-muted hover:text-ink hover:bg-surface-sunken transition"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 bg-danger text-ink-inverse text-[9px] font-black rounded-pill flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-surface border border-line rounded-card shadow-panel z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <span className="font-black text-ink text-xs">Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1 text-[11px] font-bold text-ink-subtle hover:text-ink">
                <CheckCheck className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-line">
            {notifications.length === 0 && (
              <p className="px-4 py-8 text-center text-ink-subtle font-bold text-xs">No notifications yet.</p>
            )}
            {notifications.map(n => (
              <div key={n.id} className={`px-4 py-3 ${n.is_read ? '' : 'bg-accent-soft/50'}`}>
                <p className="font-bold text-ink text-[11px]">{n.title}</p>
                {n.body && <p className="text-[11px] text-ink-subtle font-medium mt-0.5 line-clamp-2">{n.body}</p>}
                <p className="text-[10px] text-ink-subtle font-medium mt-1">{formatDate(n.created_at)}</p>
              </div>
            ))}
          </div>

          <Link
            href="/account/notifications"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-center text-[11px] font-bold text-accent hover:bg-surface-muted border-t border-line"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
