'use client';

import React, { useState } from 'react';
import { Shield, AlertTriangle, Mail, Lock, RefreshCw, ArrowUpRight } from 'lucide-react';
import { apiFetch } from '../../lib/apiClient';
import { useAdminAuth } from './AdminAuthContext';

/**
 * Sanctum login for the admin portal. Rendered by app/admin/layout.js whenever
 * there is no valid session, so it covers every /admin/* route rather than
 * just the dashboard.
 */
export default function AdminLoginGate() {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      const res = await apiFetch('/auth/login', { method: 'POST', body: { email, password } });
      const { token, user } = res.data;
      if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        setErr('This account does not have admin access.');
        setLoading(false);
        return;
      }
      login(token, user);
    } catch (error) {
      setErr(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-inverse via-inverse to-accent flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-surface/10 backdrop-blur-sm rounded-panel border border-surface/20 mb-4">
            <Shield className="w-8 h-8 text-warning" />
          </div>
          <h1 className="text-2xl font-black text-ink-inverse">BazaarX Admin Portal</h1>
          <p className="text-ink-subtle text-sm mt-1">Sign in with your admin credentials</p>
        </div>

        <div className="bg-surface/5 backdrop-blur-sm border border-surface/10 rounded-panel p-8">
          {err && (
            <div role="alert" className="bg-danger/20 border border-danger/40 text-danger p-3 rounded-card text-sm font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {err}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="text-ink-subtle text-xs font-bold block mb-1.5">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
                <input id="admin-email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="admin@bazaarx.com"
                  className="w-full bg-surface/10 border border-surface/20 rounded-card pl-11 pr-4 py-3 text-ink-inverse placeholder-ink-subtle text-sm font-semibold focus:outline-none focus:border-warning transition"
                />
              </div>
            </div>
            <div>
              <label htmlFor="admin-password" className="text-ink-subtle text-xs font-bold block mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
                <input id="admin-password" type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-surface/10 border border-surface/20 rounded-card pl-11 pr-4 py-3 text-ink-inverse placeholder-ink-subtle text-sm font-semibold focus:outline-none focus:border-warning transition"
                />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-warning hover:bg-warning text-ink font-black py-3 rounded-card flex items-center justify-center gap-2 text-sm transition disabled:opacity-50">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
              {loading ? 'Verifying...' : 'Sign In'}
            </button>
            <p className="text-center text-ink-subtle text-[11px] font-medium">Default: admin@bazaarx.com / BazaarX@2026!</p>
          </form>
        </div>
      </div>
    </div>
  );
}
