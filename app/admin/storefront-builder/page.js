"use client";

import { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, Eye, EyeOff, Trash2, Plus, Save, RefreshCw, AlertTriangle, GripVertical } from 'lucide-react';
import { apiFetch } from '../../../lib/apiClient';
import { useAdminAuth } from '../../../components/admin/AdminAuthContext';

const SECTION_TYPES = [
  { id: 'HERO', label: 'Hero Banner' },
  { id: 'CATEGORY_GRID', label: 'Category Grid' },
  { id: 'PRODUCT_ROW', label: 'Product Row' },
  { id: 'BANNER', label: 'Promo Banner' },
  { id: 'REELS', label: 'Video Reels' },
  { id: 'TRUST', label: 'Trust / Reviews Strip' },
];

const SOURCES = [
  { id: 'trending', label: 'Trending Now' },
  { id: 'new', label: 'New Arrivals' },
  { id: 'personalized', label: 'Picked For You' },
  { id: 'deals', label: 'Deals' },
  { id: 'category', label: 'Specific Category' },
];

export default function StorefrontBuilder() {
  const { token } = useAdminAuth();
  const [sections, setSections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [secRes, catRes] = await Promise.all([
        apiFetch('/storefront/sections?all=1', { token }),
        apiFetch('/categories'),
      ]);
      setSections(secRes.data || []);
      setCategories(catRes.data || []);
      setDirty(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) load(); }, [token]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const move = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next);
    setDirty(true);
  };

  const saveOrder = async () => {
    setSaving(true);
    try {
      await apiFetch('/admin/storefront/reorder', {
        method: 'PUT', token, body: { order: sections.map(s => s.id) },
      });
      setDirty(false);
      showToast('✅ Layout saved — the homepage now uses this order.');
    } catch (err) {
      showToast(`⚠️ ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const patchSection = async (id, patch) => {
    try {
      const res = await apiFetch(`/admin/storefront/sections/${id}`, { method: 'PUT', token, body: patch });
      setSections(prev => prev.map(s => s.id === id ? res.data : s));
    } catch (err) {
      showToast(`⚠️ ${err.message}`);
    }
  };

  const removeSection = async (id) => {
    try {
      await apiFetch(`/admin/storefront/sections/${id}`, { method: 'DELETE', token });
      setSections(prev => prev.filter(s => s.id !== id));
      showToast('🗑️ Section removed.');
    } catch (err) {
      showToast(`⚠️ ${err.message}`);
    }
  };

  const addSection = async (type) => {
    setAdding(false);
    try {
      const res = await apiFetch('/admin/storefront/sections', {
        method: 'POST', token,
        body: { type, title: SECTION_TYPES.find(t => t.id === type)?.label, is_visible: true, source: type === 'PRODUCT_ROW' ? 'trending' : null },
      });
      setSections(prev => [...prev, res.data]);
      showToast('➕ Section added.');
    } catch (err) {
      showToast(`⚠️ ${err.message}`);
    }
  };

  if (loading) return <div className="p-8 text-center text-ink-subtle font-bold">Loading layout…</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {toast && (
        <div role="status" className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-inverse text-ink-inverse px-6 py-3 rounded-pill shadow-panel z-50 font-bold text-sm">
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-ink">Storefront Builder</h1>
          <p className="text-sm text-ink-subtle mt-0.5">Reorder, show/hide and configure the homepage sections.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} aria-label="Reload layout" className="p-2.5 bg-surface border border-line rounded-control">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={saveOrder}
            disabled={!dirty || saving}
            className="flex items-center gap-2 bg-inverse text-ink-inverse px-5 py-2.5 rounded-control text-sm font-bold disabled:opacity-40"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {dirty ? 'Save Layout' : 'Saved'}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="bg-danger-soft border border-danger text-danger p-4 rounded-card font-bold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> {error}
        </div>
      )}

      {dirty && (
        <p className="text-xs font-bold text-warning bg-warning-soft border border-warning rounded-control px-4 py-2.5">
          Order changed — click “Save Layout” to publish it to the storefront.
        </p>
      )}

      <div className="space-y-3">
        {sections.length === 0 && (
          <div className="text-center p-12 border border-dashed border-line rounded-card text-ink-subtle">
            No sections yet. Add one below to start building the homepage.
          </div>
        )}

        {sections.map((section, index) => (
          <div
            key={section.id}
            className={`bg-surface border rounded-card p-5 ${
              section.is_visible ? 'border-line' : 'border-dashed border-line opacity-60'
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <GripVertical className="w-4 h-4 text-ink-subtle shrink-0" aria-hidden="true" />
                <span className="px-2 py-1 bg-surface-sunken rounded text-[10px] font-black uppercase text-ink-subtle shrink-0">
                  {section.type.replace(/_/g, ' ')}
                </span>
                <input
                  value={section.title || ''}
                  onChange={e => setSections(prev => prev.map(s => s.id === section.id ? { ...s, title: e.target.value } : s))}
                  onBlur={e => patchSection(section.id, { title: e.target.value })}
                  aria-label={`Title for ${section.type} section`}
                  className="font-bold text-ink bg-transparent border-b border-transparent hover:border-line focus:border-line-strong focus:outline-none min-w-0 flex-1"
                />
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up"
                  className="p-2 rounded-control hover:bg-surface-sunken disabled:opacity-30">
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button onClick={() => move(index, 1)} disabled={index === sections.length - 1} aria-label="Move down"
                  className="p-2 rounded-control hover:bg-surface-sunken disabled:opacity-30">
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => patchSection(section.id, { is_visible: !section.is_visible })}
                  aria-label={section.is_visible ? 'Hide section' : 'Show section'}
                  className="p-2 rounded-control hover:bg-surface-sunken"
                >
                  {section.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-ink-subtle" />}
                </button>
                <button onClick={() => removeSection(section.id)} aria-label="Delete section"
                  className="p-2 rounded-control text-danger hover:bg-danger-soft">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {section.type === 'PRODUCT_ROW' && (
              <div className="flex flex-wrap gap-3 mt-4 pl-7">
                <label className="text-xs font-bold text-ink-subtle flex items-center gap-2">
                  Source
                  <select
                    value={section.source || 'trending'}
                    onChange={e => patchSection(section.id, { source: e.target.value })}
                    className="bg-surface-muted border border-line rounded-control px-3 py-1.5 font-semibold"
                  >
                    {SOURCES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </label>

                {section.source === 'category' && (
                  <label className="text-xs font-bold text-ink-subtle flex items-center gap-2">
                    Category
                    <select
                      value={section.category_id || ''}
                      onChange={e => patchSection(section.id, { category_id: e.target.value || null })}
                      className="bg-surface-muted border border-line rounded-control px-3 py-1.5 font-semibold"
                    >
                      <option value="">— Select —</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </label>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {adding ? (
        <div className="border border-line rounded-card p-4 space-y-2">
          <p className="text-xs font-bold text-ink-subtle">Choose a section type</p>
          <div className="flex flex-wrap gap-2">
            {SECTION_TYPES.map(t => (
              <button key={t.id} onClick={() => addSection(t.id)}
                className="px-4 py-2 bg-surface-sunken rounded-control text-xs font-bold hover:bg-surface-sunken">
                {t.label}
              </button>
            ))}
            <button onClick={() => setAdding(false)} className="px-4 py-2 text-xs font-bold text-ink-subtle">Cancel</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full py-4 border-2 border-dashed border-line text-ink-subtle rounded-card hover:border-line-strong font-bold text-sm flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add New Section
        </button>
      )}
    </div>
  );
}
