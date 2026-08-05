'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, RefreshCw, Tag } from 'lucide-react';
import { apiFetch } from '../../lib/apiClient';
import { Button } from '@ds/ui';

const ICON_OPTIONS = [
  'Sparkles', 'Headphones', 'Zap', 'Award', 'Leaf', 'Star', 'ShoppingBag',
  'Shirt', 'Watch', 'Camera', 'Music', 'Home', 'Heart', 'Gift', 'Flame',
  'Globe', 'Laptop', 'Gem', 'Palette', 'Scissors',
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

export default function CategoryFormModal({ isOpen, onClose, category, categories, onSaved, token }) {
  const [form, setForm] = useState(EMPTY_FORM);
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
    } else {
      setForm(EMPTY_FORM);
    }
    setError('');
  }, [category, isOpen]);

  const setField = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const autoSlug = (name) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      name: form.name,
      slug: form.slug || autoSlug(form.name),
      parent_id: form.parentId || null,
      icon_url: form.iconUrl,
      banner_url: form.bannerUrl || null,
      sort_order: parseInt(form.sortOrder) || 0,
      is_featured: form.isFeatured,
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

  return (
    <div className="fixed inset-0 z-50 bg-inverse/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface text-ink rounded-panel border border-line shadow-panel w-full max-w-xl">

        {/* Header */}
        <div className="bg-inverse text-ink-inverse px-6 py-4 flex items-center justify-between rounded-t-chip-panel">
          <div>
            <h2 className="font-black text-lg text-ink-inverse flex items-center gap-2">
              <Tag className="w-5 h-5 text-warning" />
              {category ? `Edit Category: ${category.name}` : 'Add New Category'}
            </h2>
            <p className="text-xs text-ink-subtle font-medium mt-0.5">Connected to the Laravel API</p>
          </div>
          <button onClick={onClose} className="text-ink-subtle hover:text-ink-inverse p-2 rounded-pill hover:bg-inverse transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-semibold">
          {error && (
            <div className="bg-danger-soft border border-danger text-danger p-3 rounded-card font-bold">
              ⚠️ {error}
            </div>
          )}

          <div>
            <label className="block text-ink-muted mb-1.5 font-bold" htmlFor="categoryformmodal-f1">Category Name <span className="text-danger">*</span></label>
            <input id="categoryformmodal-f1"
              type="text"
              required
              value={form.name}
              onChange={e => {
                setField('name', e.target.value);
                if (!category) setField('slug', autoSlug(e.target.value));
              }}
              placeholder="e.g. Ethnic & Festive"
              className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 font-semibold focus:outline-none focus:border-line-strong transition"
            />
          </div>

          <div>
            <label className="block text-ink-muted mb-1.5 font-bold" htmlFor="categoryformmodal-f2">URL Slug</label>
            <input id="categoryformmodal-f2"
              type="text"
              value={form.slug}
              onChange={e => setField('slug', e.target.value)}
              placeholder="ethnic-wear"
              className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 font-mono focus:outline-none focus:border-line-strong transition"
            />
          </div>

          <div>
            <label className="block text-ink-muted mb-1.5 font-bold" htmlFor="categoryformmodal-f3">
              Parent Category <span className="text-ink-subtle font-normal">(optional — makes this a subcategory)</span>
            </label>
            <select id="categoryformmodal-f3"
              value={form.parentId}
              onChange={e => setField('parentId', e.target.value)}
              className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 font-semibold focus:outline-none focus:border-line-strong transition"
            >
              <option value="">— Top-Level Category —</option>
              {parentOptions.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-ink-muted mb-1.5 font-bold" htmlFor="categoryformmodal-f4">Icon Name <span className="text-ink-subtle font-normal">(Lucide React)</span></label>
              <select id="categoryformmodal-f4"
                value={form.iconUrl}
                onChange={e => setField('iconUrl', e.target.value)}
                className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 font-semibold focus:outline-none focus:border-line-strong transition"
              >
                {ICON_OPTIONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-ink-muted mb-1.5 font-bold" htmlFor="categoryformmodal-f5">Sort Order</label>
              <input id="categoryformmodal-f5"
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={e => setField('sortOrder', e.target.value)}
                placeholder="0"
                className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 font-semibold focus:outline-none focus:border-line-strong transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-ink-muted mb-1.5 font-bold" htmlFor="categoryformmodal-f6">Category Banner Image URL</label>
            <input id="categoryformmodal-f6"
              type="url"
              value={form.bannerUrl}
              onChange={e => setField('bannerUrl', e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 font-mono text-[11px] focus:outline-none focus:border-line-strong transition"
            />
            {form.bannerUrl && (
              <img src={form.bannerUrl} alt="Category preview" className="mt-2 w-full h-24 object-cover rounded-card border border-line" />
            )}
          </div>

          <div className="flex items-center gap-3 bg-surface-muted p-4 rounded-card border border-line mt-2">
            <input
              type="checkbox"
              id="isFeatured"
              checked={form.isFeatured}
              onChange={e => setField('isFeatured', e.target.checked)}
              className="w-5 h-5 accent-primary rounded focus:ring-line-strong cursor-pointer"
            />
            <label htmlFor="isFeatured" className="text-ink-muted font-bold cursor-pointer">
              Mark as Featured Category
              <span className="block text-ink-subtle font-normal mt-0.5">Featured categories appear on the homepage</span>
            </label>
          </div>

          <div className="flex items-center justify-between gap-4 pt-2 border-t border-line">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={saving}
              leadingIcon={<Save className="w-4 h-4" />}
            >
              {saving ? 'Saving...' : (category ? 'Update Category' : 'Create Category')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
