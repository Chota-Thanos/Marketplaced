'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '../providers/StoreProvider';
import { User, Mail, KeyRound, Smartphone, RefreshCw, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function AuthPrompt() {
  const { login, register, loginWithGoogle } = useStore();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Load Google Identity Services GIS script on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const scriptId = 'google-gsi-client';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');

    try {
      // Check if Google Client ID is configured in client window
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

      if (window.google?.accounts?.id && clientId) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              if (response.credential) {
                await loginWithGoogle(response.credential);
              }
            } catch (err) {
              setError(err.message || 'Google Sign-In failed');
            } finally {
              setGoogleLoading(false);
            }
          },
        });
        window.google.accounts.id.prompt();
      } else {
        // Single-click Demo Google Sign-In (verifies through backend /auth/google)
        const mockEmail = email.trim() || 'shoppers.demo@gmail.com';
        const mockName = name.trim() || 'Demo Shopper';
        const demoIdToken = `demo_google_:${mockEmail}:${mockName}`;
        
        await loginWithGoogle(demoIdToken);
      }
    } catch (err) {
      setError(err.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

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
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-inverse rounded-card flex items-center justify-center mx-auto mb-4 shadow-subtle">
          <User className="w-7 h-7 text-ink-inverse" />
        </div>
        <h1 className="text-2xl font-black text-ink">Welcome to RentalMoney</h1>
        <p className="text-ink-subtle text-sm mt-1 font-medium">
          Sign in to view orders, wishlist, wallet and rewards.
        </p>
      </div>

      <div className="bg-surface border border-line rounded-panel p-6 shadow-panel space-y-5">
        
        {/* GOOGLE SIGN IN BUTTON */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full bg-surface hover:bg-surface-muted text-ink font-extrabold py-3 px-4 rounded-card border border-line flex items-center justify-center gap-3 transition-all duration-200 shadow-subtle hover:border-line-strong disabled:opacity-50"
        >
          {googleLoading ? (
            <RefreshCw className="w-5 h-5 animate-spin text-accent" />
          ) : (
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
          )}
          <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-line" />
          <span className="text-[11px] font-black text-ink-subtle uppercase tracking-widest">or email login</span>
          <div className="flex-1 h-px bg-line" />
        </div>

        {/* Tab Selector */}
        <div className="flex bg-surface-sunken rounded-card p-1">
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 rounded-control text-xs font-bold transition ${mode === 'login' ? 'bg-surface shadow-subtle text-ink' : 'text-ink-subtle'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-2 rounded-control text-xs font-bold transition ${mode === 'register' ? 'bg-surface shadow-subtle text-ink' : 'text-ink-subtle'}`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="bg-danger-soft border border-danger text-danger p-3 rounded-card text-xs font-bold">
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
          <button type="submit" disabled={loading || googleLoading}
            className="btn-primary w-full justify-center text-sm py-3.5 disabled:opacity-50">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {loading ? 'Please wait...' : (mode === 'login' ? 'Sign In with Email' : 'Create Account')}
          </button>
        </form>

        <div className="pt-2 border-t border-line text-center space-y-1">
          <p className="text-[11px] text-ink-subtle font-medium">
            Demo Customer Account: <span className="font-mono text-ink">priya.sharma@example.com</span> / <span className="font-mono text-ink">Password@123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
