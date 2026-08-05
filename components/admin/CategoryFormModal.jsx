'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Tag, Plus, Trash2, GripVertical, SlidersHorizontal } from 'lucide-react';
import { apiFetch } from '../../lib/apiClient';
import { Button } from '@ds/ui';
import * as Icons from 'lucide-react';

const ICON_OPTIONS = [
  'Sparkles', 'Headphones', 'Zap', 'Award', 'Leaf', 'Star', 'ShoppingBag',
  'Shirt', 'Watch', 'Camera', 'Music', 'Home', 'Heart', 'Gift', 'Flame',
  'Globe', 'Laptop', 'Gem', 'Palette', 'Scissors',
];

const FILTER_TYPES = [
  { value: 'checkbox', label: 'Checkbox list' },
  { value: 'radio',    label: 'Radio (single select)' },
  { value: 'chip',     label: 'Chip buttons' },
  { value: 'range',    label: 'Price / number range' },
];

const EMPTY_FORM = {
  name: '',
  slug: '',
  parentId: '',
  iconUrl: 'Sparkles',
  bannerUrl: '',
  sortOrder: '0',
  isFeatured: false,
};

const EMPTY_GROUP = () => ({
  id: `group_${Date.now()}`,
  label: '',
  type: 'checkbox',
  options: [],
  min: 0,
  max: 10000,
  step: 100,
});

const EMPTY_OPTION = () => ({ label: '', value: '' });

export default function CategoryFormModal({ isOpen, onClose, category, categories, onSaved, token }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState('details');
  const [filterGroups, setFilterGroups] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (category) {
      setForm({
        name: category.name || '',
        slug: category.slug || '',
        parentId: category.parentId || '',
        iconUrl: category.iconUrl || 'Sparkles',
        bannerUrl: category.bannerUrl || '',
        sortOrder: category.sortOrder?.toString() || '0',
        isFeatured: category.isFeatured || false,
      });
      // Load existing filter config
      const config = category.filterConfig || category.filter_config;
      setFilterGroups(config?.groups || []);
    } else {
      setForm(EMPTY_FORM);
      setFilterGroups([]);
    }
    setError('');
    setActiveTab('details');
  }, [category, isOpen]);

  const setField = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const autoSlug = (name) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  // Filter group helpers
  const addGroup = () => setFilterGroups(g => [...g, EMPTY_GROUP()]);

  const updateGroup = (idx, key, val) =>
    setFilterGroups(g => g.map((grp, i) => i === idx ? { ...grp, [key]: val } : grp));

  const removeGroup = (idx) =>
    setFilterGroups(g => g.filter((_, i) => i !== idx));

  const addOption = (gIdx) =>
    setFilterGroups(g => g.map((grp, i) => i === gIdx
      ? { ...grp, options: [...(grp.options || []), EMPTY_OPTION()] }
      : grp
    ));

  const updateOption = (gIdx, oIdx, key, val) =>
    setFilterGroups(g => g.map((grp, i) => i !== gIdx ? grp : {
      ...grp,
      options: grp.options.map((opt, j) => j !== oIdx ? opt : { ...opt, [key]: val }),
    }));

  const removeOption = (gIdx, oIdx) =>
    setFilterGroups(g => g.map((grp, i) => i !== gIdx ? grp : {
      ...grp,
      options: grp.options.filter((_, j) => j !== oIdx),
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const filterConfig = filterGroups.length > 0 ? { groups: filterGroups } : null;

    const payload = {
      name: form.name,
      slug: form.slug || autoSlug(form.name),
      parent_id: form.parentId || null,
      icon_url: form.iconUrl,
      banner_url: form.bannerUrl || null,
      sort_order: parseInt(form.sortOrder) || 0,
      is_featured: form.isFeatured,
      filter_config: filterConfig,
    };

    try {
      const path = category ? `/categories/${category.id}` : '/categories';
      const data = await apiFetch(path, { method: category ? 'PUT' : 'POST', token, body: payload });
      onSaved(data.data, !!category);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const parentOptions = (categories || []).filter(c => c.id !== category?.id);
  const IconPreview = Icons[form.iconUrl] || Icons.Sparkles;

  return (
    <div className="fixed inset-0 z-50 bg-inverse/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface text-ink rounded-panel border border-line shadow-panel w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="bg-inverse text-ink-inverse px-6 py-4 flex items-center justify-between rounded-t-chip-panel flex-none">
          <div>
            <h2 className="font-black text-lg text-ink-inverse flex items-center gap-2">
              <Tag className="w-5 h-5 text-warning" />
              {category ? `Edit: ${category.name}` : 'Add New Category'}
            </h2>
            <p className="text-xs text-ink-subtle font-medium mt-0.5">Connected to Laravel API</p>
          </div>
          <button onClick={onClose} className="text-ink-subtle hover:text-ink-inverse p-2 rounded-pill hover:bg-inverse transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-line bg-surface-muted flex-none">
          {[
            { id: 'details', label: 'Category Details', icon: <Tag className="w-3.5 h-3.5" /> },
            { id: 'filters', label: 'Filter Builder', icon: <SlidersHorizontal className="w-3.5 h-3.5" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-5 py-3 text-xs font-black border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-accent text-accent bg-surface'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'filters' && filterGroups.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-accent text-white rounded-full text-[9px] font-black">
                  {filterGroups.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          {error && (
            <div className="mx-6 mt-4 bg-danger-soft border border-danger text-danger p-3 rounded-card font-bold text-xs">
              ⚠️ {error}
            </div>
          )}

          {/* ── DETAILS TAB ── */}
          {activeTab === 'details' && (
            <div className="p-6 space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-ink-muted mb-1.5 font-bold" htmlFor="catf-name">
                  Category Name <span className="text-danger">*</span>
                </label>
                <input id="catf-name" type="text" required value={form.name}
                  onChange={e => { setField('name', e.target.value); if (!category) setField('slug', autoSlug(e.target.value)); }}
                  placeholder="e.g. Ethnic & Festive"
                  className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 font-semibold focus:outline-none focus:border-line-strong transition"
                />
              </div>

              <div>
                <label className="block text-ink-muted mb-1.5 font-bold" htmlFor="catf-slug">URL Slug</label>
                <input id="catf-slug" type="text" value={form.slug}
                  onChange={e => setField('slug', e.target.value)} placeholder="ethnic-wear"
                  className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 font-mono focus:outline-none focus:border-line-strong transition"
                />
              </div>

              <div>
                <label className="block text-ink-muted mb-1.5 font-bold" htmlFor="catf-parent">
                  Parent Category <span className="text-ink-subtle font-normal">(optional)</span>
                </label>
                <select id="catf-parent" value={form.parentId} onChange={e => setField('parentId', e.target.value)}
                  className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 font-semibold focus:outline-none focus:border-line-strong transition"
                >
                  <option value="">— Top-Level Category —</option>
                  {parentOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-ink-muted mb-1.5 font-bold" htmlFor="catf-icon">Icon <span className="text-ink-subtle font-normal">(Lucide)</span></label>
                  <div className="flex gap-2">
                    <select id="catf-icon" value={form.iconUrl} onChange={e => setField('iconUrl', e.target.value)}
                      className="flex-1 bg-surface-muted border border-line rounded-card px-3 py-3 font-semibold focus:outline-none focus:border-line-strong transition"
                    >
                      {ICON_OPTIONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                    </select>
                    <div className="w-12 h-12 rounded-card bg-surface-muted border border-line flex items-center justify-center">
                      <IconPreview className="w-5 h-5 text-accent" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-ink-muted mb-1.5 font-bold" htmlFor="catf-order">Sort Order</label>
                  <input id="catf-order" type="number" min="0" value={form.sortOrder}
                    onChange={e => setField('sortOrder', e.target.value)} placeholder="0"
                    className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 font-semibold focus:outline-none focus:border-line-strong transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-ink-muted mb-1.5 font-bold" htmlFor="catf-banner">Banner Image URL</label>
                <input id="catf-banner" type="url" value={form.bannerUrl}
                  onChange={e => setField('bannerUrl', e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 font-mono text-[11px] focus:outline-none focus:border-line-strong transition"
                />
                {form.bannerUrl && (
                  <img src={form.bannerUrl} alt="preview" className="mt-2 w-full h-24 object-cover rounded-card border border-line" />
                )}
              </div>

              <div className="flex items-center gap-3 bg-surface-muted p-4 rounded-card border border-line">
                <input type="checkbox" id="catf-featured" checked={form.isFeatured}
                  onChange={e => setField('isFeatured', e.target.checked)}
                  className="w-5 h-5 accent-primary rounded cursor-pointer"
                />
                <label htmlFor="catf-featured" className="text-ink-muted font-bold cursor-pointer">
                  Featured Category
                  <span className="block text-ink-subtle font-normal mt-0.5">Featured categories appear on the homepage</span>
                </label>
              </div>
            </div>
          )}

          {/* ── FILTER BUILDER TAB ── */}
          {activeTab === 'filters' && (
            <div className="p-6 space-y-4 text-xs">
              <div className="bg-accent/5 border border-accent/20 rounded-card p-3 text-accent font-semibold">
                💡 Filters you define here will appear as the left sidebar on the <strong>{form.name || 'category'}</strong> page for shoppers to narrow down products.
              </div>

              {filterGroups.map((group, gIdx) => (
                <div key={group.id} className="border border-line rounded-card overflow-hidden">
                  {/* Group header */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-surface-muted border-b border-line">
                    <GripVertical className="w-4 h-4 text-ink-subtle flex-none" />
                    <input
                      value={group.label}
                      onChange={e => updateGroup(gIdx, 'label', e.target.value)}
                      placeholder="Filter group name (e.g. Gender, Size, Brand)"
                      className="flex-1 bg-transparent font-black text-ink placeholder:text-ink-subtle focus:outline-none"
                    />
                    <select
                      value={group.type}
                      onChange={e => updateGroup(gIdx, 'type', e.target.value)}
                      className="bg-surface border border-line rounded-control px-2 py-1 text-[11px] font-bold focus:outline-none"
                    >
                      {FILTER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <button type="button" onClick={() => removeGroup(gIdx)} className="text-danger hover:text-danger/70 transition p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Group body */}
                  <div className="p-4 space-y-2">
                    {group.type === 'range' ? (
                      <div className="grid grid-cols-3 gap-3">
                        {[['min', 'Min Value'], ['max', 'Max Value'], ['step', 'Step']].map(([key, lbl]) => (
                          <div key={key}>
                            <label className="block text-ink-subtle font-bold mb-1">{lbl}</label>
                            <input type="number" value={group[key] ?? ''} onChange={e => updateGroup(gIdx, key, Number(e.target.value))}
                              className="w-full bg-surface-muted border border-line rounded-control px-3 py-2 font-semibold focus:outline-none focus:border-line-strong"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        {(group.options || []).map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <input value={opt.label} onChange={e => updateOption(gIdx, oIdx, 'label', e.target.value)}
                              placeholder="Label (e.g. Men)"
                              className="flex-1 bg-surface-muted border border-line rounded-control px-3 py-2 font-semibold focus:outline-none focus:border-line-strong"
                            />
                            <input value={opt.value} onChange={e => updateOption(gIdx, oIdx, 'value', e.target.value)}
                              placeholder="Value (e.g. men)"
                              className="flex-1 bg-surface-muted border border-line rounded-control px-3 py-2 font-mono focus:outline-none focus:border-line-strong"
                            />
                            <button type="button" onClick={() => removeOption(gIdx, oIdx)} className="text-danger hover:text-danger/70 p-1">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        <button type="button" onClick={() => addOption(gIdx)}
                          className="flex items-center gap-1.5 text-accent font-bold hover:underline mt-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Option
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}

              <button type="button" onClick={addGroup}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-line rounded-card text-ink-muted font-bold hover:border-accent hover:text-accent transition"
              >
                <Plus className="w-4 h-4" /> Add Filter Group
              </button>

              {filterGroups.length === 0 && (
                <div className="text-center py-6 text-ink-subtle font-medium">
                  No filters yet. Click "Add Filter Group" to create your first filter (e.g., Gender, Size, Brand).
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between gap-4 p-6 border-t border-line bg-surface-muted flex-none">
            <Button variant="secondary" size="sm" onClick={onClose} type="button">Cancel</Button>
            <Button type="submit" size="sm" loading={saving} leadingIcon={<Save className="w-4 h-4" />}>
              {saving ? 'Saving...' : (category ? 'Update Category' : 'Create Category')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
