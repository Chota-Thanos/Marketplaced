'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '../providers/StoreProvider';
import { apiFetch } from '../../lib/apiClient';
import { User, KeyRound, Save, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function ProfileClient() {
  const { authToken, updateAuthUser } = useStore();
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [pw, setPw] = useState({ current_password: '', new_password: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    if (!authToken) return;
    apiFetch('/profile', { token: authToken })
      .then(res => setForm({
        name: res.data.name || '',
        email: res.data.email || '',
        phone: res.data.phone || '',
      }))
      .finally(() => setLoading(false));
  }, [authToken]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg(''); setError('');
    try {
      const res = await apiFetch('/profile', { method: 'PUT', token: authToken, body: form });
      setMsg('Profile updated.');
      updateAuthUser(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setSavingPw(true); setPwMsg(''); setPwError('');
    try {
      await apiFetch('/profile/password', { method: 'PUT', token: authToken, body: pw });
      setPwMsg('Password changed.');
      setPw({ current_password: '', new_password: '' });
    } catch (err) {
      setPwError(err.message);
    } finally {
      setSavingPw(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-ink-subtle font-bold">
        <RefreshCw className="w-4 h-4 animate-spin" /> Loading profile...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <form onSubmit={saveProfile} className="bg-surface border border-line rounded-panel p-6 space-y-4">
        <h2 className="font-black text-ink flex items-center gap-2 text-sm">
          <User className="w-4 h-4" /> Profile Details
        </h2>

        {msg && <Banner tone="success">{msg}</Banner>}
        {error && <Banner tone="error">{error}</Banner>}

        <Field label="Full name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
        <Field label="Email" type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} />
        <Field label="Phone" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />

        <button type="submit" disabled={saving}
          className="flex items-center gap-2 bg-inverse text-ink-inverse px-5 py-3 rounded-card text-xs font-bold hover:bg-inverse disabled:opacity-50">
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>

      <form onSubmit={savePassword} className="bg-surface border border-line rounded-panel p-6 space-y-4">
        <h2 className="font-black text-ink flex items-center gap-2 text-sm">
          <KeyRound className="w-4 h-4" /> Change Password
        </h2>

        {pwMsg && <Banner tone="success">{pwMsg}</Banner>}
        {pwError && <Banner tone="error">{pwError}</Banner>}

        <Field label="Current password" type="password" required
          value={pw.current_password} onChange={v => setPw(p => ({ ...p, current_password: v }))} />
        <Field label="New password" type="password" required minLength={8}
          value={pw.new_password} onChange={v => setPw(p => ({ ...p, new_password: v }))} />

        <button type="submit" disabled={savingPw}
          className="flex items-center gap-2 bg-inverse text-ink-inverse px-5 py-3 rounded-card text-xs font-bold hover:bg-inverse disabled:opacity-50">
          {savingPw ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
          {savingPw ? 'Updating...' : 'Update password'}
        </button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required, minLength }) {
  return (
    <div>
      <label className="block text-xs font-bold text-ink-muted mb-1.5">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <input
        type={type}
        required={required}
        minLength={minLength}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 text-xs font-semibold focus:outline-none focus:border-line-strong"
      />
    </div>
  );
}

function Banner({ tone, children }) {
  const styles = tone === 'success'
    ? 'bg-success-soft border-success text-success'
    : 'bg-danger-soft border-danger text-danger';
  return (
    <div className={`flex items-center gap-2 border p-3 rounded-card text-xs font-bold ${styles}`}>
      {tone === 'success' && <CheckCircle2 className="w-4 h-4" />}
      {children}
    </div>
  );
}
