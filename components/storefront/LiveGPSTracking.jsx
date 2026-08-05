"use client";

import { useState, useEffect, useCallback } from 'react';
import { MapPin, Truck, RefreshCw, FlaskConical } from 'lucide-react';
import { apiFetch } from '../../lib/apiClient';

/**
 * Courier position for an out-for-delivery order. Everything shown comes from
 * GET /orders/{id}/track — nothing is invented client-side. When the API
 * reports sandbox data (is_mock) that is stated plainly rather than badged
 * "LIVE", so nobody mistakes simulated movement for a real courier feed.
 */
export default function LiveGPSTracking({ orderId, status, token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!orderId || !token) return;
    try {
      const res = await apiFetch(`/orders/${orderId}/track`, { token });
      setData(res.data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orderId, token]);

  useEffect(() => {
    if (status !== 'OUT_FOR_DELIVERY') return;
    load();
    const id = setInterval(load, 30000); // re-poll the courier every 30s
    return () => clearInterval(id);
  }, [status, load]);

  if (status !== 'OUT_FOR_DELIVERY') return null;
  if (loading) {
    return (
      <div className="mt-8 p-6 border border-line rounded-card text-center text-ink-subtle font-bold text-sm">
        Fetching courier location…
      </div>
    );
  }
  if (error || !data?.position) {
    return (
      <div className="mt-8 p-6 border border-line rounded-card text-center text-ink-subtle text-sm">
        {error || 'Courier location is not available for this shipment yet.'}
      </div>
    );
  }

  const { position, destination, stops_away: stopsAway, eta_minutes: etaMinutes, is_mock: isMock } = data;

  // Map the interpolated lat/lng onto the plotted box.
  const pct = Math.min(Math.max(position.progress ?? 0, 0), 1);

  return (
    <div className="bg-surface border border-line rounded-card overflow-hidden mt-8">
      <div className="p-4 border-b border-line flex justify-between items-center gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-success-soft text-success rounded-pill flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-ink">Out for delivery</h3>
            <p className="text-xs text-ink-subtle truncate">Tracking #{data.tracking_no}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-black text-success">{etaMinutes} min</p>
          <p className="text-xs text-ink-subtle">{stopsAway} stops away</p>
        </div>
      </div>

      <div className="relative w-full h-56 bg-surface-sunken overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '20px 20px' }}
          aria-hidden="true"
        />

        {/* Route line */}
        <div className="absolute top-1/2 left-[12%] right-[18%] h-0.5 bg-success/30" aria-hidden="true" />

        {/* Courier marker, positioned by reported progress */}
        <div
          className="absolute top-1/2 w-5 h-5 -mt-2.5 -ml-2.5 bg-surface rounded-pill border-4 border-success shadow-card transition-[left] duration-1000 ease-linear"
          style={{ left: `calc(12% + ${pct * 70}%)` }}
          role="img"
          aria-label={`Courier at ${position.lat}, ${position.lng}`}
        />

        <div className="absolute top-1/2 right-[14%] -mt-8 flex flex-col items-center">
          <MapPin className="text-danger w-7 h-7" fill="currentColor" />
          <span className="text-[10px] font-bold bg-surface/90 px-2 py-0.5 rounded mt-0.5">
            Delivery address
          </span>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3 text-[11px]">
          <span className="font-mono text-ink-muted bg-surface/85 px-2 py-1 rounded">
            {position.lat}, {position.lng}
          </span>
          <button
            onClick={load}
            className="flex items-center gap-1.5 font-bold text-ink-muted bg-surface/85 px-2 py-1 rounded hover:text-ink"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {isMock && (
        <p className="px-4 py-2.5 text-[11px] font-bold text-warning bg-warning-soft border-t border-warning flex items-center gap-1.5">
          <FlaskConical className="w-3.5 h-3.5 shrink-0" />
          Sandbox courier feed — simulated position, not a live vehicle.
        </p>
      )}
    </div>
  );
}
