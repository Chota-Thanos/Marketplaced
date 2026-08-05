'use client';

import React, { useState } from 'react';
import { useStore } from '../providers/StoreProvider';
import { User, Mail, KeyRound, Smartphone, RefreshCw, ArrowRight } from 'lucide-react';

/** Shown in place of account pages when nobody is signed in. */
export default function AuthPrompt() {
  const { login, register } = useStore();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') await login(email, password);
      else await register(name, email, phone, password);
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-inverse rounded-card flex items-center justify-center mx-auto mb-4">
          <User className="w-7 h-7 text-ink-inverse" />
        </div>
        <h1 className="text-2xl font-black text-ink">Sign in to your account</h1>
        <p className="text-ink-subtle text-sm mt-1 font-medium">
          View orders, wishlist, wallet and more.
        </p>
      </div>

      <div className="bg-surface border border-line rounded-panel p-6 shadow-subtle">
        <div className="flex bg-surface-sunken rounded-card p-1 mb-5">
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 rounded-control text-xs font-bold transition ${mode === 'login' ? 'bg-surface shadow-subtle text-ink' : 'text-ink-subtle'}`}
          >
            Login
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-2 rounded-control text-xs font-bold transition ${mode === 'register' ? 'bg-surface shadow-subtle text-ink' : 'text-ink-subtle'}`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="bg-danger-soft border border-danger text-danger p-3 rounded-card text-xs font-bold mb-4">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          {mode === 'register' && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
              <input type="text" required value={name} onChange={e => setName(e.target.value)}
                placeholder="Full name"
                className="w-full bg-surface-muted border border-line rounded-card pl-11 pr-4 py-3 text-sm font-semibold focus:outline-none focus:border-line-strong" />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full bg-surface-muted border border-line rounded-card pl-11 pr-4 py-3 text-sm font-semibold focus:outline-none focus:border-line-strong" />
          </div>
          {mode === 'register' && (
            <div className="relative">
              <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="Phone (optional)"
                className="w-full bg-surface-muted border border-line rounded-card pl-11 pr-4 py-3 text-sm font-semibold focus:outline-none focus:border-line-strong" />
            </div>
          )}
          <div className="relative">
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
            <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-surface-muted border border-line rounded-card pl-11 pr-4 py-3 text-sm font-semibold focus:outline-none focus:border-line-strong" />
          </div>
          <button type="submit" disabled={loading}
            className="btn-primary w-full justify-center text-sm py-3.5 disabled:opacity-50">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {loading ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <p className="text-[11px] text-ink-subtle text-center mt-4">
          Demo account: priya.sharma@example.com / Password@123
        </p>
      </div>
    </div>
  );
}
