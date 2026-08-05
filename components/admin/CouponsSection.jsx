'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch, formatINR, formatDate } from '../../lib/apiClient';
import { Tag, Plus, Pencil, Trash2, RefreshCw, X, Save } from 'lucide-react';

const EMPTY = {
  code: '', description: '', type: 'PERCENT', value: '', min_order: '0',
  max_discount: '', usage_limit: '', per_user_limit: '', target_type: 'ALL',
  expires_at: '', is_active: true,
};

export default function CouponsSection({ token }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const load = () => apiFetch('/admin/coupons', { token })
    .then(res => setCoupons(res.data || []))
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3000); };
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openNew = () => { setForm(EMPTY); setEditing('new'); setError(''); };
  const openEdit = (c) => {
    setForm({
      code: c.code, description: c.description || '', type: c.type,
      value: String(c.value), min_order: String(c.min_order ?? '0'),
      max_discount: c.max_discount != null ? String(c.max_discount) : '',
      usage_limit: c.usage_limit != null ? String(c.usage_limit) : '',
      per_user_limit: c.per_user_limit != null ? String(c.per_user_limit) : '',
      target_type: c.target_type || 'ALL',
      expires_at: c.expires_at ? c.expires_at.slice(0, 10) : '',
      is_active: c.is_active,
    });
    setEditing(c.id);
    setError('');
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      code: form.code,
      description: form.description || null,
      type: form.type,
      value: parseFloat(form.value),
      min_order: parseFloat(form.min_order) || 0,
      max_discount: form.max_discount ? parseFloat(form.max_discount) : null,
      usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
      per_user_limit: form.per_user_limit ? parseInt(form.per_user_limit) : null,
      target_type: form.target_type,
      expires_at: form.expires_at || null,
      is_active: form.is_active,
    };
    try {
      if (editing === 'new') await apiFetch('/admin/coupons', { method: 'POST', token, body: payload });
      else await apiFetch(`/admin/coupons/${editing}`, { method: 'PUT', token, body: payload });
      showToast(editing === 'new' ? '✅ Coupon created.' : '✅ Coupon updated.');
      setEditing(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    await apiFetch(`/admin/coupons/${id}`, { method: 'DELETE', token });
    showToast('🗑️ Coupon deleted.');
    load();
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-inverse text-ink-inverse px-6 py-3 rounded-pill shadow-panel z-50 font-bold text-sm">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-ink-subtle text-sm font-bold">{coupons.length} coupons configured</p>
        <div className="flex items-center gap-3">
          <button onClick={load} className="p-2.5 bg-surface border border-line rounded-card text-ink-muted hover:border-line-strong">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={openNew} className="flex items-center gap-2 bg-inverse text-ink-inverse px-4 py-2.5 rounded-card text-sm font-bold hover:bg-inverse">
            <Plus className="w-4 h-4" /> Add Coupon
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-ink-subtle font-bold">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading coupons...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {coupons.map(c => (
          <div key={c.id} className="bg-surface border border-line rounded-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-ink font-mono">{c.code}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-pill border ${
                    c.is_active ? 'bg-success-soft text-success border-success' : 'bg-surface-sunken text-ink-subtle border-line'
                  }`}>
                    {c.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                <p className="text-xs text-ink-subtle font-medium mt-0.5">{c.description}</p>
              </div>
              <span className="font-black text-ink text-lg shrink-0">
                {c.type === 'PERCENT' ? `${parseFloat(c.value)}%` : formatINR(c.value)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] font-medium text-ink-muted">
              <span>Min order: <b className="text-ink">{formatINR(c.min_order)}</b></span>
              {c.max_discount && <span>Max off: <b className="text-ink">{formatINR(c.max_discount)}</b></span>}
              <span>Used: <b className="text-ink">{c.used_count}{c.usage_limit ? ` / ${c.usage_limit}` : ''}</b></span>
              {c.expires_at && <span>Expires: <b className="text-ink">{formatDate(c.expires_at)}</b></span>}
              <span>Scope: <b className="text-ink">{c.target_type}</b></span>
            </div>

            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-line">
              <button onClick={() => openEdit(c)} className="flex items-center gap-1 text-[11px] font-bold text-accent bg-accent-soft px-2.5 py-1.5 rounded-control hover:bg-accent-soft">
                <Pencil className="w-3 h-3" /> Edit
              </button>
              <button onClick={() => remove(c.id)} className="flex items-center gap-1 text-[11px] font-bold text-danger bg-danger-soft px-2.5 py-1.5 rounded-control hover:bg-danger-soft">
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-inverse/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-panel w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="bg-inverse text-ink-inverse px-6 py-4 flex items-center justify-between">
              <h2 className="font-black flex items-center gap-2">
                <Tag className="w-5 h-5 text-warning" />
                {editing === 'new' ? 'Create Coupon' : 'Edit Coupon'}
              </h2>
              <button onClick={() => setEditing(null)} className="text-ink-subtle hover:text-ink-inverse p-2 rounded-pill hover:bg-inverse">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={save} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {error && <div className="bg-danger-soft border border-danger text-danger p-3 rounded-card font-bold">⚠️ {error}</div>}

              <div className="grid grid-cols-2 gap-3">
                <Field label="Coupon Code" required value={form.code} onChange={v => setField('code', v.toUpperCase())} mono />
                <div>
                  <label className="block font-bold text-ink-muted mb-1.5" htmlFor="couponssection-f1">Discount Type <span className="text-danger">*</span></label>
                  <select id="couponssection-f1" value={form.type} onChange={e => setField('type', e.target.value)}
                    className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 font-semibold focus:outline-none focus:border-line-strong">
                    <option value="PERCENT">Percentage (%)</option>
                    <option value="FLAT">Flat amount (₹)</option>
                  </select>
                </div>
              </div>

              <Field label="Description" value={form.description} onChange={v => setField('description', v)} />

              <div className="grid grid-cols-2 gap-3">
                <Field label={form.type === 'PERCENT' ? 'Percent off' : 'Amount off (₹)'} required type="number" value={form.value} onChange={v => setField('value', v)} />
                <Field label="Minimum order (₹)" type="number" value={form.min_order} onChange={v => setField('min_order', v)} />
              </div>

              {form.type === 'PERCENT' && (
                <Field label="Maximum discount cap (₹)" type="number" value={form.max_discount} onChange={v => setField('max_discount', v)} />
              )}

              <div className="grid grid-cols-2 gap-3">
                <Field label="Total usage limit" type="number" value={form.usage_limit} onChange={v => setField('usage_limit', v)} placeholder="Unlimited" />
                <Field label="Per-customer limit" type="number" value={form.per_user_limit} onChange={v => setField('per_user_limit', v)} placeholder="Unlimited" />
              </div>

              <Field label="Expires on" type="date" value={form.expires_at} onChange={v => setField('expires_at', v)} />

              <label className="flex items-center gap-2 cursor-pointer" htmlFor="couponssection-f2">
                <input type="checkbox" checked={form.is_active} onChange={e => setField('is_active', e.target.checked)}
                  className="w-4 h-4 accent-primary" />
                <span className="font-bold text-ink">Coupon is active</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditing(null)} className="flex-1 bg-surface-sunken text-ink-muted py-3 rounded-card font-bold hover:bg-surface-sunken">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-inverse text-ink-inverse py-3 rounded-card font-bold hover:bg-inverse disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Save coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, required, type = 'text', mono, placeholder }) {
  return (
    <div>
      <label className="block font-bold text-ink-muted mb-1.5">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <input id="couponssection-f2"
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className={`w-full bg-surface-muted border border-line rounded-card px-4 py-3 font-semibold focus:outline-none focus:border-line-strong ${mono ? 'font-mono uppercase' : ''}`}
      />
    </div>
  );
}
