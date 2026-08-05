'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '../providers/StoreProvider';
import { apiFetch, formatINR, formatDate } from '../../lib/apiClient';
import { Wallet, ArrowDownLeft, ArrowUpRight, RefreshCw, Gift } from 'lucide-react';

export default function WalletClient() {
  const { authToken } = useStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authToken) return;
    apiFetch('/wallet', { token: authToken })
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, [authToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-ink-subtle font-bold">
        <RefreshCw className="w-4 h-4 animate-spin" /> Loading wallet...
      </div>
    );
  }

  const transactions = data?.transactions || [];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-inverse to-accent text-ink-inverse rounded-panel p-6">
          <Wallet className="w-6 h-6 opacity-80 mb-3" />
          <p className="text-3xl font-black">{formatINR(data?.balance)}</p>
          <p className="text-sm font-bold opacity-80 mt-0.5">Wallet Balance</p>
          <p className="text-[11px] opacity-60 mt-2 font-medium">Usable on your next order at checkout.</p>
        </div>
        <div className="bg-gradient-to-br from-warning to-warning text-ink-inverse rounded-panel p-6">
          <Gift className="w-6 h-6 opacity-80 mb-3" />
          <p className="text-3xl font-black">{data?.loyalty_points ?? 0}</p>
          <p className="text-sm font-bold opacity-80 mt-0.5">Loyalty Points</p>
          <p className="text-[11px] opacity-60 mt-2 font-medium">Earned on every completed order.</p>
        </div>
      </div>

      <div className="bg-surface border border-line rounded-panel overflow-hidden">
        <div className="px-5 py-4 border-b border-line">
          <h2 className="font-black text-ink text-sm">Transaction History</h2>
        </div>

        {transactions.length === 0 ? (
          <div className="p-10 text-center text-ink-subtle font-bold text-sm">No wallet transactions yet.</div>
        ) : (
          <div className="divide-y divide-line">
            {transactions.map(t => {
              const credit = t.type === 'CREDIT';
              return (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className={`w-9 h-9 rounded-control flex items-center justify-center shrink-0 ${credit ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>
                    {credit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-ink text-xs">{t.reason}</p>
                    <p className="text-[11px] text-ink-subtle font-medium">{formatDate(t.created_at)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-black text-sm ${credit ? 'text-success' : 'text-danger'}`}>
                      {credit ? '+' : '−'} {formatINR(t.amount)}
                    </p>
                    <p className="text-[10px] text-ink-subtle font-medium">Bal: {formatINR(t.balance_after)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
