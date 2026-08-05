'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '../providers/StoreProvider';
import { apiFetch } from '../../lib/apiClient';
import { MapPin, Plus, Pencil, Trash2, Check, X, RefreshCw } from 'lucide-react';

const EMPTY = {
  tag: 'Home', name: '', phone: '', line1: '', line2: '',
  city: '', state: '', pincode: '', is_default: false,
};

export default function AddressesClient() {
  const { authToken } = useStore();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => apiFetch('/addresses', { token: authToken })
    .then(res => setAddresses(res.data || []))
    .finally(() => setLoading(false));

  useEffect(() => { if (authToken) load(); }, [authToken]);

  const openNew = () => { setForm(EMPTY); setEditing('new'); setError(''); };
  const openEdit = (a) => {
    setForm({
      tag: a.tag || 'Home', name: a.name, phone: a.phone, line1: a.line1,
      line2: a.line2 || '', city: a.city, state: a.state, pincode: a.pincode,
      is_default: a.is_default,
    });
    setEditing(a.id);
    setError('');
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing === 'new') {
        await apiFetch('/addresses', { method: 'POST', token: authToken, body: form });
      } else {
        await apiFetch(`/addresses/${editing}`, { method: 'PUT', token: authToken, body: form });
      }
      setEditing(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    await apiFetch(`/addresses/${id}`, { method: 'DELETE', token: authToken });
    load();
  };

  const makeDefault = async (id) => {
    await apiFetch(`/addresses/${id}`, { method: 'PUT', token: authToken, body: { is_default: true } });
    load();
  };

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-ink-subtle text-sm font-bold">{addresses.length} saved address{addresses.length === 1 ? '' : 'es'}</p>
        <button onClick={openNew} className="flex items-center gap-2 bg-inverse text-ink-inverse px-4 py-2.5 rounded-card text-sm font-bold hover:bg-inverse">
          <Plus className="w-4 h-4" /> Add Address
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-ink-subtle font-bold">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading addresses...
        </div>
      )}

      {!loading && addresses.length === 0 && !editing && (
        <div className="bg-surface-muted border border-line rounded-panel p-12 text-center">
          <div className="w-14 h-14 bg-surface-sunken rounded-pill flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-7 h-7 text-ink-subtle" />
          </div>
          <h3 className="font-black text-ink">No saved addresses</h3>
          <p className="text-ink-subtle text-sm mt-1 font-medium">Add one to speed up checkout.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map(a => (
          <div key={a.id} className="bg-surface border border-line rounded-card p-4 relative">
            {a.is_default && (
              <span className="absolute top-3 right-3 bg-success-soft text-success border border-success text-[10px] font-black px-2 py-0.5 rounded-pill">
                DEFAULT
              </span>
            )}
            <span className="inline-block bg-surface-sunken text-ink-muted text-[10px] font-black px-2 py-0.5 rounded-pill mb-2">
              {a.tag}
            </span>
            <p className="font-bold text-ink text-sm">{a.name}</p>
            <p className="text-xs text-ink-subtle font-medium">{a.phone}</p>
            <p className="text-xs text-ink-muted font-medium mt-1.5 leading-relaxed">
              {a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />
              {a.city}, {a.state} – {a.pincode}
            </p>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-line">
              <button onClick={() => openEdit(a)} className="flex items-center gap-1 text-[11px] font-bold text-accent bg-accent-soft px-2.5 py-1.5 rounded-control hover:bg-accent-soft">
                <Pencil className="w-3 h-3" /> Edit
              </button>
              {!a.is_default && (
                <button onClick={() => makeDefault(a.id)} className="flex items-center gap-1 text-[11px] font-bold text-success bg-success-soft px-2.5 py-1.5 rounded-control hover:bg-success-soft">
                  <Check className="w-3 h-3" /> Set default
                </button>
              )}
              <button onClick={() => remove(a.id)} className="flex items-center gap-1 text-[11px] font-bold text-danger bg-danger-soft px-2.5 py-1.5 rounded-control hover:bg-danger-soft ml-auto">
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-inverse/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-panel w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">
            <div className="bg-inverse text-ink-inverse px-6 py-4 flex items-center justify-between">
              <h2 className="font-black">{editing === 'new' ? 'Add Address' : 'Edit Address'}</h2>
              <button onClick={() => setEditing(null)} className="text-ink-subtle hover:text-ink-inverse p-2 rounded-pill hover:bg-inverse">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={save} className="flex-1 overflow-y-auto p-6 space-y-3 text-xs">
              {error && <div className="bg-danger-soft border border-danger text-danger p-3 rounded-card font-bold">{error}</div>}

              <div>
                <label className="block font-bold text-ink-muted mb-1.5" htmlFor="addressesclient-f1">Label</label>
                <div className="flex gap-2">
                  {['Home', 'Work', 'Other'].map(t => (
                    <button key={t} type="button" onClick={() => setField('tag', t)}
                      className={`px-4 py-2 rounded-control font-bold border transition ${form.tag === t ? 'bg-inverse text-ink-inverse border-line-strong' : 'bg-surface border-line text-ink-muted'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Full name" required value={form.name} onChange={v => setField('name', v)} />
              <Field label="Phone" required value={form.phone} onChange={v => setField('phone', v)} />
              <Field label="Address line 1" required value={form.line1} onChange={v => setField('line1', v)} />
              <Field label="Address line 2" value={form.line2} onChange={v => setField('line2', v)} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="City" required value={form.city} onChange={v => setField('city', v)} />
                <Field label="State" required value={form.state} onChange={v => setField('state', v)} />
              </div>
              <Field label="Pincode" required maxLength={6} value={form.pincode} onChange={v => setField('pincode', v)} />

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input type="checkbox" checked={form.is_default} onChange={e => setField('is_default', e.target.checked)}
                  className="w-4 h-4 accent-primary" />
                <span className="font-bold text-ink-muted">Set as default delivery address</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditing(null)} className="flex-1 bg-surface-sunken text-ink-muted py-3 rounded-card font-bold hover:bg-surface-sunken">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-inverse text-ink-inverse py-3 rounded-card font-bold hover:bg-inverse disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, required, maxLength }) {
  return (
    <div>
      <label className="block font-bold text-ink-muted mb-1.5">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <input id="addressesclient-f1"
        type="text"
        required={required}
        maxLength={maxLength}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 font-semibold focus:outline-none focus:border-line-strong"
      />
    </div>
  );
}
