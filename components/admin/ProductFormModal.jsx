'use client';

import React, { useState, useEffect } from 'react';
import {
  X, Plus, Trash2, Save, Package, Image, Tag, Layers,
  MapPin, Star, Zap, ShieldCheck, SlidersHorizontal, FileText, RefreshCw, Upload,
  RotateCcw, Eye, ArrowUp, ArrowDown
} from 'lucide-react';
import { apiFetch } from '../../lib/apiClient';
import ProductCard from '../ProductCard';
import Product360Viewer from '../storefront/Product360Viewer';
import { brand } from '@ds/brand';
import { Button } from '@ds/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

/** Uploads a File to the API and returns its public URL. */
async function uploadFile(file, token) {
  const data = new FormData();
  data.append('file', file);

  const res = await fetch(`${API_BASE}/uploads`, {
    method: 'POST',
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    body: data,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.message || 'Upload failed');
  }
  return json.data.url;
}

const EMPTY_HOTSPOT = {
  id: '',
  top: '50%',
  left: '50%',
  title: '',
  zoomRatio: '4.0x Macro',
  zoomedImage: '',
  detail: '',
  techSpecs: '',
};

const EMPTY_VARIANT = { color: '', size: '', sku: '', stock: '10', price: '', mrp: '' };

/** File-picker button that hands the chosen file(s) to `onFile`. */
function UploadButton({ busy, onFile, multiple = false, label = 'Upload' }) {
  const inputRef = React.useRef(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/mp4,video/webm"
        multiple={multiple}
        className="hidden"
        onChange={e => { onFile(multiple ? e.target.files : e.target.files?.[0]); e.target.value = ''; }}
      />
      <Button
        onClick={() => inputRef.current?.click()}
        title="Upload a file"
        variant="secondary"
        size="sm"
        loading={busy}
        className="shrink-0"
        leadingIcon={<Upload className="w-4 h-4" />}
      >
        {busy ? 'Uploading' : label}
      </Button>
    </>
  );
}

/**
 * Click-or-drag hotspot placement. Dragging a pin (or clicking the image
 * while a pin is selected) writes its top/left as percentages of the image
 * box — this is the actual authoring tool for the hotspots the PDP renders,
 * replacing blind "type a percentage and hope" inputs.
 */
function HotspotCanvas({ image, hotspots, activeIndex, onSetActive, onPositionChange }) {
  const containerRef = React.useRef(null);
  const draggingIndex = React.useRef(null);

  const posFromEvent = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return {
      left: `${Math.min(100, Math.max(0, x)).toFixed(1)}%`,
      top: `${Math.min(100, Math.max(0, y)).toFixed(1)}%`,
    };
  };

  const handlePointerDown = (idx) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    draggingIndex.current = idx;
    onSetActive(idx);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const handlePointerMove = (e) => {
    if (draggingIndex.current === null) return;
    onPositionChange(draggingIndex.current, posFromEvent(e));
  };
  const endDrag = () => { draggingIndex.current = null; };

  const handleCanvasClick = (e) => {
    if (activeIndex === null || activeIndex === undefined) return;
    onPositionChange(activeIndex, posFromEvent(e));
  };

  // Arrow keys nudge the focused marker by 1% (5% with Shift). Dragging is a
  // pointer-only gesture, so without this the hotspot editor is unusable
  // without a mouse — the marker could be focused but never moved.
  const handleMarkerKeyDown = (idx, hs) => (e) => {
    const step = e.shiftKey ? 5 : 1;
    const deltas = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const delta = deltas[e.key];
    if (!delta) return;

    e.preventDefault();
    const clamp = (n) => Math.min(100, Math.max(0, n));
    const current = { x: parseFloat(hs.left) || 0, y: parseFloat(hs.top) || 0 };
    onPositionChange(idx, {
      left: `${clamp(current.x + delta[0]).toFixed(1)}%`,
      top: `${clamp(current.y + delta[1]).toFixed(1)}%`,
    });
  };

  if (!image) {
    return (
      <div className="aspect-square w-full bg-surface-sunken rounded-card border border-dashed border-line flex items-center justify-center text-ink-subtle text-xs font-bold text-center p-6">
        Add a main product image first — hotspots are placed on top of it.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onClick={handleCanvasClick}
      // A custom pointer+keyboard editing surface: role="application" is the
      // honest description, and the markers below carry the keyboard path.
      role="application"
      aria-label="Hotspot placement canvas. Select a marker, then use the arrow keys to move it."
      className="relative aspect-square w-full bg-surface-sunken rounded-card overflow-hidden border border-line cursor-crosshair select-none touch-none"
    >
      <img src={image} alt="Hotspot placement reference" className="w-full h-full object-cover pointer-events-none" draggable={false} />
      {hotspots.map((hs, idx) => (
        <button
          type="button"
          key={hs.id || idx}
          onPointerDown={handlePointerDown(idx)}
          onClick={(e) => { e.stopPropagation(); onSetActive(idx); }}
          onKeyDown={handleMarkerKeyDown(idx, hs)}
          style={{ top: hs.top, left: hs.left }}
          title={hs.title || `Hotspot ${idx + 1}`}
          aria-label={`${hs.title || `Hotspot ${idx + 1}`} at ${hs.left} from left, ${hs.top} from top. Use arrow keys to move.`}
          aria-pressed={activeIndex === idx}
          className={`absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-pill flex items-center justify-center text-[11px] font-black text-ink-inverse shadow-card ring-2 cursor-grab active:cursor-grabbing transition-transform ${
            activeIndex === idx ? 'bg-accent ring-surface scale-125 z-10' : 'bg-inverse/80 ring-surface/70 hover:scale-110'
          }`}
        >
          {idx + 1}
        </button>
      ))}
    </div>
  );
}

const EMPTY_FORM = {
  title: '',
  slug: '',
  categoryId: '',
  brand: '',
  price: '',
  mrp: '',
  isNew: false,
  status: 'ACTIVE',
  authenticityGrade: '',
  image: '',
  rolloverImage: '',
  gallery: [],
  hotspots: [],
  spinImages: [],
  lifestyleBadges: [],
  variants: [{ ...EMPTY_VARIANT }],
  localStoreAvailable: true,
  localStoreName: '',
  expressPincodes: [],
  features: [],
  seoDescription: '',
  description: '',
  // Shoppertainment is entirely optional — left blank on every product by
  // default, and saving never requires either of these.
  reelVideoUrl: '',
  reelCaption: '',
};

export default function ProductFormModal({ isOpen, onClose, product, categories, onSaved, token }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basic');

  // Tag inputs
  const [badgeInput, setBadgeInput] = useState('');
  const [pincodeInput, setPincodeInput] = useState('');
  const [featureInput, setFeatureInput] = useState('');
  const [galleryInput, setGalleryInput] = useState('');
  const [uploading, setUploading] = useState('');
  const [uploadError, setUploadError] = useState('');

  const handleUpload = async (file, target) => {
    if (!file) return;
    setUploading(target);
    setUploadError('');
    try {
      const url = await uploadFile(file, token);
      if (target === 'main') setField('image', url);
      else if (target === 'rollover') setField('rolloverImage', url);
      else if (target === 'gallery') setForm(f => ({ ...f, gallery: [...f.gallery, url] }));
      else if (target.startsWith('hotspot-')) {
        const idx = parseInt(target.split('-')[1], 10);
        updateHotspot(idx, 'zoomedImage', url);
      }
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading('');
    }
  };

  useEffect(() => {
    if (product) {
      setForm({
        title: product.title || '',
        slug: product.slug || '',
        categoryId: product.categoryId || '',
        brand: product.brand || '',
        price: product.price?.toString() || '',
        mrp: product.mrp?.toString() || '',
        isNew: product.isNew ?? false,
        status: product.status || 'ACTIVE',
        authenticityGrade: product.authenticityGrade || '',
        image: product.image || (product.images ? product.images[0] : ''),
        rolloverImage: product.rolloverImage || '',
        gallery: product.images ? product.images.slice(1) : [],
        hotspots: JSON.parse(JSON.stringify(product.hotspots || [])),
        spinImages: [...(product.spinImages || [])],
        lifestyleBadges: product.lifestyleBadges || [],
        variants: product.variants?.length
          ? product.variants.map(v => ({
              id: v.id,
              color: v.color || '',
              size: v.size || '',
              sku: v.sku || '',
              stock: v.stock?.toString() ?? '0',
              price: v.price?.toString() ?? '',
              mrp: v.mrp?.toString() ?? '',
            }))
          : [{ ...EMPTY_VARIANT }],
        localStoreAvailable: product.localStoreAvailable ?? true,
        localStoreName: product.localStoreName || '',
        expressPincodes: [...(product.expressPincodes || [])],
        features: [...(product.features || [])],
        description: product.description || '',
        seoDescription: product.metaDescription || '',
        reelVideoUrl: product.reelVideoUrl || '',
        reelCaption: product.reelCaption || '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setActiveTab('basic');
    setActiveHotspotIdx(null);
    setError('');
  }, [product, isOpen]);

  const setField = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const autoSlug = (title) => title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  // Tag helpers
  const addTag = (key, value, setter) => {
    if (!value.trim()) return;
    setForm(f => ({ ...f, [key]: [...(f[key] || []), value.trim()] }));
    setter('');
  };
  const removeTag = (key, idx) => setForm(f => ({ ...f, [key]: f[key].filter((_, i) => i !== idx) }));

  // Gallery
  const addGallery = () => {
    if (!galleryInput.trim()) return;
    setField('gallery', [...form.gallery, galleryInput.trim()]);
    setGalleryInput('');
  };
  const removeGallery = (idx) => setField('gallery', form.gallery.filter((_, i) => i !== idx));

  // Hotspots
  const [activeHotspotIdx, setActiveHotspotIdx] = useState(null);

  const addHotspot = () => {
    const hs = { ...EMPTY_HOTSPOT, id: 'h' + Date.now() };
    setForm(f => {
      setActiveHotspotIdx(f.hotspots.length); // new pin is immediately draggable
      return { ...f, hotspots: [...f.hotspots, hs] };
    });
  };
  // Accepts either (idx, key, val) or (idx, {key: val, ...}) so the drag
  // handler can set top+left in one atomic update — two separate calls in
  // the same pointermove tick would each read the same pre-update `form`
  // from closure and the second would clobber the first.
  const updateHotspot = (idx, keyOrPatch, val) => {
    setForm(f => ({
      ...f,
      hotspots: f.hotspots.map((h, i) => {
        if (i !== idx) return h;
        return typeof keyOrPatch === 'object' ? { ...h, ...keyOrPatch } : { ...h, [keyOrPatch]: val };
      }),
    }));
  };
  const removeHotspot = (idx) => {
    setField('hotspots', form.hotspots.filter((_, i) => i !== idx));
    setActiveHotspotIdx(a => (a === idx ? null : a));
  };

  // 360° spin frames
  const handleSpinUpload = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setUploadError('');
    for (let i = 0; i < files.length; i++) {
      setUploading(`spin-${i + 1}/${files.length}`);
      try {
        const url = await uploadFile(files[i], token);
        setForm(f => ({ ...f, spinImages: [...f.spinImages, url] }));
      } catch (err) {
        setUploadError(`Frame ${i + 1} failed: ${err.message}`);
        break;
      }
    }
    setUploading('');
  };
  const moveSpinFrame = (idx, delta) => {
    setForm(f => {
      const target = idx + delta;
      if (target < 0 || target >= f.spinImages.length) return f;
      const next = [...f.spinImages];
      [next[idx], next[target]] = [next[target], next[idx]];
      return { ...f, spinImages: next };
    });
  };
  const removeSpinFrame = (idx) => setField('spinImages', form.spinImages.filter((_, i) => i !== idx));

  // Variants — real per-variant color/size/stock/price/mrp/sku
  const addVariant = () => setField('variants', [...form.variants, { ...EMPTY_VARIANT }]);
  const updateVariant = (idx, key, val) => {
    setField('variants', form.variants.map((v, i) => i === idx ? { ...v, [key]: val } : v));
  };
  const removeVariant = (idx) => setField('variants', form.variants.filter((_, i) => i !== idx));
  const totalStock = form.variants.reduce((acc, v) => acc + (parseInt(v.stock) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const priceNum = parseFloat(form.price);
    const mrpNum = parseFloat(form.mrp || priceNum * 2);

    const payload = {
      title: form.title,
      slug: form.slug || autoSlug(form.title),
      description: form.description,
      category_id: form.categoryId,
      brand: form.brand || null,
      price: priceNum,
      mrp: mrpNum,
      is_new: form.isNew,
      status: form.status,
      tags: form.lifestyleBadges,
      features: form.features,
      images: [form.image, ...form.gallery].filter(Boolean),
      rollover_image: form.rolloverImage || null,
      authenticity_grade: form.authenticityGrade || null,
      local_store_available: form.localStoreAvailable,
      local_store_name: form.localStoreName || null,
      express_pincodes: form.expressPincodes,
      hotspots: form.hotspots,
      spin_images: form.spinImages,
      meta_description: form.seoDescription || null,
      // Optional — omitted entirely (not even sent as empty strings) when
      // blank, so leaving them untouched never marks a product as "having a
      // reel" with a broken empty URL.
      reel_video_url: form.reelVideoUrl.trim() || null,
      reel_caption: form.reelCaption.trim() || null,
      variants: form.variants.map(v => ({
        color: v.color || null,
        size: v.size || null,
        sku: v.sku || null,
        stock: parseInt(v.stock) || 0,
        price: v.price ? parseFloat(v.price) : null,
        mrp: v.mrp ? parseFloat(v.mrp) : null,
      })),
    };

    try {
      const path = product ? `/products/${product.id}` : '/products';
      const data = await apiFetch(path, { method: product ? 'PUT' : 'POST', token, body: payload });
      onSaved(data.data, !!product);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: <Package className="w-3.5 h-3.5" /> },
    { id: 'images', label: 'Images & Gallery', icon: <Image className="w-3.5 h-3.5" /> },
    { id: 'hotspots', label: 'Hotspots', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'spin', label: '360° Spin', icon: <RotateCcw className="w-3.5 h-3.5" /> },
    { id: 'inventory', label: 'Inventory & Variants', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'badges', label: 'Badges & Features', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: 'delivery', label: 'Delivery & Store', icon: <MapPin className="w-3.5 h-3.5" /> },
    { id: 'seo', label: 'SEO & Reviews', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'preview', label: 'Live Preview', icon: <Eye className="w-3.5 h-3.5" /> },
  ];

  const previewProduct = {
    id: product?.id || 'preview',
    title: form.title || 'Untitled Product',
    image: form.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    images: [form.image, ...form.gallery].filter(Boolean),
    price: parseFloat(form.price) || 0,
    mrp: parseFloat(form.mrp) || parseFloat(form.price) || 0,
    discount: (() => {
      const price = parseFloat(form.price) || 0;
      const mrp = parseFloat(form.mrp) || price;
      return mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;
    })(),
    isNew: form.isNew,
    lifestyleBadges: form.lifestyleBadges,
    rating: product?.rating ?? 0,
    reviewsCount: product?.reviewsCount ?? 0,
    localStoreName: form.localStoreAvailable ? (form.localStoreName || 'Local Store Pickup') : 'Ships from warehouse',
  };

  return (
    <div className="fixed inset-0 z-50 bg-inverse/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface text-ink rounded-panel border border-line shadow-panel w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Modal Header */}
        <div className="bg-inverse text-ink-inverse px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-black text-lg text-ink-inverse">
              {product ? `Edit Product: ${product.title}` : 'Add New Product to Catalog'}
            </h2>
            <p className="text-xs text-ink-subtle font-medium mt-0.5">
              Connected to the Laravel API
            </p>
          </div>
          <button onClick={onClose} className="text-ink-subtle hover:text-ink-inverse p-2 rounded-pill hover:bg-inverse transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-1 px-4 pt-4 pb-0 overflow-x-auto scrollbar-none border-b border-line shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-chip-control text-xs font-bold border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-line-strong text-ink bg-surface-muted'
                  : 'border-transparent text-ink-subtle hover:text-ink hover:bg-surface-muted'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5 text-xs font-semibold">

            {/* ERROR */}
            {error && (
              <div className="bg-danger-soft border border-danger text-danger p-3 rounded-card font-bold">
                ⚠️ {error}
              </div>
            )}

            {/* TAB: BASIC INFO */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <h3 className="font-black text-sm text-ink border-b border-line pb-2">Basic Product Information</h3>

                <div>
                  <label className="block text-ink-muted mb-1.5 font-bold" htmlFor="productformmodal-f1">Product Title <span className="text-danger">*</span></label>
                  <input id="productformmodal-f1"
                    type="text"
                    required
                    value={form.title}
                    onChange={e => {
                      setField('title', e.target.value);
                      if (!product) setField('slug', autoSlug(e.target.value));
                    }}
                    placeholder="e.g. Hand-Embroidered Chanderi Silk Anarkali Set"
                    className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 font-semibold focus:outline-none focus:border-line-strong transition"
                  />
                </div>

                <div>
                  <label className="block text-ink-muted mb-1.5 font-bold" htmlFor="productformmodal-f2">URL Slug <span className="text-ink-subtle font-normal">(auto-generated)</span></label>
                  <input id="productformmodal-f2"
                    type="text"
                    value={form.slug}
                    onChange={e => setField('slug', e.target.value)}
                    placeholder="chanderi-silk-anarkali-set"
                    className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 font-mono focus:outline-none focus:border-line-strong transition"
                  />
                </div>

                <div>
                  <label className="block text-ink-muted mb-1.5 font-bold" htmlFor="productformmodal-f3">Category <span className="text-danger">*</span></label>
                  <select id="productformmodal-f3"
                    required
                    value={form.categoryId}
                    onChange={e => setField('categoryId', e.target.value)}
                    className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 font-semibold focus:outline-none focus:border-line-strong transition"
                  >
                    <option value="">— Select Category —</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-ink-muted mb-1.5 font-bold" htmlFor="productformmodal-f4">Brand</label>
                  <input id="productformmodal-f4"
                    type="text"
                    value={form.brand}
                    onChange={e => setField('brand', e.target.value)}
                    placeholder={`e.g. ${brand.nameDisplay} Heritage`}
                    className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 font-semibold focus:outline-none focus:border-line-strong transition"
                  />
                </div>

                {/* CATEGORY-LINKED FILTER ATTRIBUTES */}
                {(() => {
                  const selectedCat = categories.find(c => String(c.id) === String(form.categoryId) || c.slug === form.categoryId);
                  const filterConfig = selectedCat?.filterConfig || selectedCat?.filter_config;
                  const groups = filterConfig?.groups || [];

                  if (!groups.length) return null;

                  return (
                    <div className="bg-accent/5 border border-accent/20 rounded-card p-4 space-y-3 col-span-full">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-ink uppercase tracking-wider flex items-center gap-1.5">
                          <SlidersHorizontal className="w-3.5 h-3.5 text-accent" />
                          Category Filter Attributes ({selectedCat.name})
                        </h4>
                        <span className="text-[10px] text-ink-subtle font-medium">Click options to tag product for category sidebar filters</span>
                      </div>

                      <div className="space-y-3">
                        {groups.map(group => (
                          <div key={group.id} className="space-y-1.5">
                            <span className="text-[11px] font-bold text-ink-muted">{group.label}</span>
                            <div className="flex flex-wrap gap-1.5">
                              {(group.options || []).map(opt => {
                                const tagVal = opt.value || opt.label;
                                const isSelected = form.lifestyleBadges.includes(tagVal) || form.lifestyleBadges.includes(opt.label) || (group.id === 'brand' && form.brand === tagVal);

                                const toggleAttribute = () => {
                                  if (group.id === 'brand') {
                                    setField('brand', isSelected ? '' : tagVal);
                                  }
                                  if (isSelected) {
                                    setForm(f => ({
                                      ...f,
                                      lifestyleBadges: f.lifestyleBadges.filter(b => b !== tagVal && b !== opt.label)
                                    }));
                                  } else {
                                    setForm(f => ({
                                      ...f,
                                      lifestyleBadges: Array.from(new Set([...f.lifestyleBadges, tagVal, opt.label]))
                                    }));
                                    if ((group.id || '').toLowerCase().includes('size') || group.label.toLowerCase().includes('size')) {
                                      setForm(f => {
                                        const exists = f.variants.some(v => (v.size || '').toLowerCase() === tagVal.toLowerCase());
                                        if (!exists) {
                                          return {
                                            ...f,
                                            variants: [...f.variants, { color: '', size: tagVal, sku: '', stock: '10', price: f.price || '', mrp: f.mrp || '' }]
                                          };
                                        }
                                        return f;
                                      });
                                    }
                                  }
                                };

                                return (
                                  <button
                                    key={opt.value || opt.label}
                                    type="button"
                                    onClick={toggleAttribute}
                                    className={`px-3 py-1 rounded-pill text-xs font-bold border transition-all ${
                                      isSelected
                                        ? 'bg-accent text-white border-accent shadow-subtle'
                                        : 'bg-surface text-ink border-line hover:border-line-strong'
                                    }`}
                                  >
                                    {isSelected ? '✓ ' : '+ '}{opt.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-ink-muted mb-1.5 font-bold" htmlFor="productformmodal-f5">Offer Price (₹) <span className="text-danger">*</span></label>
                    <input id="productformmodal-f5"
                      type="number"
                      required
                      min="0"
                      value={form.price}
                      onChange={e => setField('price', e.target.value)}
                      placeholder="3499"
                      className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 font-semibold focus:outline-none focus:border-line-strong transition"
                    />
                  </div>
                  <div>
                    <label className="block text-ink-muted mb-1.5 font-bold" htmlFor="productformmodal-f6">MRP / Original Price (₹) <span className="text-danger">*</span></label>
                    <input id="productformmodal-f6"
                      type="number"
                      required
                      min="0"
                      value={form.mrp}
                      onChange={e => setField('mrp', e.target.value)}
                      placeholder="6999"
                      className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 font-semibold focus:outline-none focus:border-line-strong transition"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-ink-subtle">This is the default price. Individual variants (Inventory tab) can override it.</p>

                {form.price && form.mrp && parseFloat(form.mrp) > parseFloat(form.price) && (
                  <div className="bg-success-soft border border-success p-3 rounded-card text-success font-bold">
                    Computed Discount: {Math.round(((parseFloat(form.mrp) - parseFloat(form.price)) / parseFloat(form.mrp)) * 100)}% OFF
                  </div>
                )}

                <div>
                  <label className="block text-ink-muted mb-1.5 font-bold" htmlFor="productformmodal-f7">Authenticity Grade</label>
                  <select id="productformmodal-f7"
                    value={form.authenticityGrade}
                    onChange={e => setField('authenticityGrade', e.target.value)}
                    className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 font-semibold focus:outline-none focus:border-line-strong transition"
                  >
                    <option value="">— Select Grade —</option>
                    <option value="GI Heritage Certified">GI Heritage Certified</option>
                    <option value="HD Audio Certified">HD Audio Certified</option>
                    <option value="Ergonomic Performance Grade">Ergonomic Performance Grade</option>
                    <option value="GI Certified Tribal Craft">GI Certified Tribal Craft</option>
                    <option value="AYUSH Organic Certified">AYUSH Organic Certified</option>
                    <option value="BIS IS 19000 Verified">BIS IS 19000 Verified</option>
                  </select>
                </div>

                <div>
                  <label className="block text-ink-muted mb-1.5 font-bold" htmlFor="productformmodal-f8">
                    Product Description <span className="text-danger">*</span>
                    <span className="text-ink-subtle font-normal ml-1">(displayed on the product detail page below the title)</span>
                  </label>
                  <textarea id="productformmodal-f8"
                    required
                    rows={5}
                    value={form.description}
                    onChange={e => setField('description', e.target.value)}
                    placeholder="Write a rich, detailed description of the product. Include material quality, craftsmanship, use-cases, care instructions, and what makes this product unique..."
                    className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 font-semibold focus:outline-none focus:border-line-strong transition resize-none leading-relaxed"
                  />
                  <span className="text-[11px] text-ink-subtle">{form.description.length} characters</span>
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer" htmlFor="productformmodal-f9">
                    <input
                      type="checkbox"
                      checked={form.isNew}
                      onChange={e => setField('isNew', e.target.checked)}
                      className="w-4 h-4 accent-success"
                    />
                    <span className="font-bold text-ink">Show "NEW" Tag on Product Card</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="font-bold text-ink-muted">Status</span>
                    <select
                      value={form.status}
                      onChange={e => setField('status', e.target.value)}
                      className="bg-surface-muted border border-line rounded-control px-3 py-1.5 font-semibold focus:outline-none"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="ACTIVE">Active</option>
                      <option value="OUT_OF_STOCK">Out of Stock</option>
                      <option value="DISCONTINUED">Discontinued</option>
                    </select>
                  </label>
                </div>
              </div>
            )}

            {/* TAB: IMAGES & GALLERY */}
            {activeTab === 'images' && (
              <div className="space-y-4">
                <h3 className="font-black text-sm text-ink border-b border-line pb-2">Images, Gallery & Rollover</h3>

                {uploadError && (
                  <div className="bg-danger-soft border border-danger text-danger p-3 rounded-card font-bold">⚠️ {uploadError}</div>
                )}

                <div>
                  <label htmlFor="productformmodal-x473" className="block text-ink-muted mb-1.5 font-bold">Main Product Image <span className="text-danger">*</span></label>
                  <div className="flex gap-2">
                    <input id="productformmodal-x473"
                      type="url"
                      required
                      value={form.image}
                      onChange={e => setField('image', e.target.value)}
                      placeholder="Upload a file or paste an image URL"
                      className="flex-1 bg-surface-muted border border-line rounded-card px-4 py-3 font-mono text-xs focus:outline-none focus:border-line-strong transition"
                    />
                    <UploadButton
                      busy={uploading === 'main'}
                      onFile={f => handleUpload(f, 'main')}
                    />
                  </div>
                  {form.image && (
                    <img src={form.image} alt="Main preview" className="mt-2 w-32 h-32 object-cover rounded-card border border-line" />
                  )}
                </div>

                <div>
                  <label htmlFor="productformmodal-x494" className="block text-ink-muted mb-1.5 font-bold">Rollover / Hover Image <span className="text-ink-subtle font-normal">(shown when user hovers card)</span></label>
                  <div className="flex gap-2">
                    <input id="productformmodal-x494"
                      type="url"
                      value={form.rolloverImage}
                      onChange={e => setField('rolloverImage', e.target.value)}
                      placeholder="Upload a file or paste an image URL"
                      className="flex-1 bg-surface-muted border border-line rounded-card px-4 py-3 font-mono text-xs focus:outline-none focus:border-line-strong transition"
                    />
                    <UploadButton
                      busy={uploading === 'rollover'}
                      onFile={f => handleUpload(f, 'rollover')}
                    />
                  </div>
                  {form.rolloverImage && (
                    <img src={form.rolloverImage} alt="Rollover preview" className="mt-2 w-32 h-32 object-cover rounded-card border border-line" />
                  )}
                </div>

                <div className="rounded-card border border-dashed border-line p-4 space-y-3">
                  <div>
                    <p className="font-bold text-ink flex items-center gap-2">
                      Shoppertainment reel
                      <span className="text-2xs font-black uppercase tracking-wider text-ink-subtle bg-surface-sunken px-2 py-0.5 rounded-pill">
                        Optional
                      </span>
                    </p>
                    <p className="text-ink-subtle text-xs mt-0.5">
                      Leave this blank — most products won't have one. Only products
                      with a clip appear in the Reels feed; nothing else changes if
                      you skip it.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="productformmodal-reelvideo" className="block text-ink-muted mb-1.5 font-bold">
                      Video URL <span className="text-ink-subtle font-normal">(optional)</span>
                    </label>
                    <input
                      id="productformmodal-reelvideo"
                      type="url"
                      value={form.reelVideoUrl}
                      onChange={e => setField('reelVideoUrl', e.target.value)}
                      placeholder="https://…mp4"
                      className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 font-mono text-xs focus:outline-none focus:border-line-strong transition"
                    />
                  </div>

                  {form.reelVideoUrl && (
                    <div>
                      <label htmlFor="productformmodal-reelcaption" className="block text-ink-muted mb-1.5 font-bold">
                        Caption <span className="text-ink-subtle font-normal">(optional)</span>
                      </label>
                      <input
                        id="productformmodal-reelcaption"
                        type="text"
                        maxLength={160}
                        value={form.reelCaption}
                        onChange={e => setField('reelCaption', e.target.value)}
                        placeholder="A short line shown under the clip"
                        className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 text-xs focus:outline-none focus:border-line-strong transition"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="productformmodal-x514" className="block text-ink-muted mb-1.5 font-bold">Gallery Images <span className="text-ink-subtle font-normal">(shown in lightbox & image gallery viewer)</span></label>
                  <div className="flex gap-2">
                    <input id="productformmodal-x514"
                      type="url"
                      value={galleryInput}
                      onChange={e => setGalleryInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addGallery(); } }}
                      placeholder="Upload a file or paste an image URL"
                      className="flex-1 bg-surface-muted border border-line rounded-card px-4 py-3 font-mono text-xs focus:outline-none focus:border-line-strong transition"
                    />
                    <Button size="sm" onClick={addGallery} className="shrink-0" leadingIcon={<Plus className="w-4 h-4" />}>
                      Add
                    </Button>
                    <UploadButton
                      busy={uploading === 'gallery'}
                      onFile={f => handleUpload(f, 'gallery')}
                    />
                  </div>
                  {form.gallery.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-3">
                      {form.gallery.map((url, idx) => (
                        <div key={idx} className="relative">
                          <img src={url} alt={`gallery-${idx}`} className="w-20 h-20 object-cover rounded-control border border-line" />
                          <button
                            type="button"
                            onClick={() => removeGallery(idx)}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-danger text-ink-inverse rounded-pill flex items-center justify-center shadow-subtle"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: HOTSPOTS */}
            {activeTab === 'hotspots' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <div>
                    <h3 className="font-black text-sm text-ink">Futuristic HUD Image Hotspots</h3>
                    <p className="text-[11px] text-ink-subtle font-medium mt-0.5">
                      Hotspots appear as sonar reticles on the product image in the detail page. Each hotspot shows a macro zoom close-up.
                    </p>
                  </div>
                  <Button size="sm" onClick={addHotspot} className="shrink-0" leadingIcon={<Plus className="w-3.5 h-3.5" />}>
                    Add Hotspot
                  </Button>
                </div>

                {form.hotspots.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-[240px_1fr] gap-4 items-start">
                    <div>
                      <HotspotCanvas
                        image={form.image}
                        hotspots={form.hotspots}
                        activeIndex={activeHotspotIdx}
                        onSetActive={setActiveHotspotIdx}
                        onPositionChange={(idx, pos) => updateHotspot(idx, pos)}
                      />
                      <p className="text-[11px] text-ink-subtle mt-2 leading-relaxed">
                        Drag a pin to move it, or select a pin (click it) then click anywhere
                        on the image to jump it there.
                      </p>
                    </div>
                    <div className="text-xs text-ink-subtle font-medium leading-relaxed bg-accent-soft border border-accent rounded-card p-4">
                      <span className="font-black text-accent block mb-1">
                        {activeHotspotIdx !== null ? `Editing Hotspot #${activeHotspotIdx + 1}` : 'Select a pin to edit it'}
                      </span>
                      Position updates live as you drag — no need to type percentages by hand.
                      The numbered card below the canvas still lets you fine-tune the title,
                      zoomed close-up image and technical details for each pin.
                    </div>
                  </div>
                )}

                {form.hotspots.length === 0 && (
                  <div className="text-center py-8 text-ink-subtle font-medium text-xs">
                    No hotspots configured. Click "Add Hotspot" to define interactive zoom points on the product image.
                  </div>
                )}

                {form.hotspots.map((hs, idx) => (
                  <div
                    key={hs.id}
                    onFocus={() => setActiveHotspotIdx(idx)}
                    className={`bg-surface-muted border rounded-card p-4 space-y-3 transition ${
                      activeHotspotIdx === idx ? 'border-accent ring-2 ring-accent/20' : 'border-line'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <button type="button" onClick={() => setActiveHotspotIdx(idx)} className="font-black text-ink text-xs hover:text-accent">
                        Hotspot #{idx + 1}
                      </button>
                      <button type="button" onClick={() => removeHotspot(idx)} className="text-danger hover:bg-danger-soft p-1 rounded-pill">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor={`productformmodal-f9-hs-${idx}`} className="block text-ink-muted mb-1 font-bold">Title</label>
                        <input id={`productformmodal-f9-${idx}`} value={hs.title} onChange={e => updateHotspot(idx, 'title', e.target.value)} placeholder="24K Gold Zari Neckline" className="w-full bg-surface border border-line rounded-control px-3 py-2 focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-ink-muted mb-1 font-bold" htmlFor={`productformmodal-f10-${idx}`}>Zoom Ratio</label>
                        <select id={`productformmodal-f10-${idx}`} value={hs.zoomRatio} onChange={e => updateHotspot(idx, 'zoomRatio', e.target.value)} className="w-full bg-surface border border-line rounded-control px-3 py-2 focus:outline-none">
                          <option value="3.0x Macro">3.0x Macro</option>
                          <option value="3.5x Macro">3.5x Macro</option>
                          <option value="4.0x Macro">4.0x Macro</option>
                          <option value="4.5x Macro">4.5x Macro</option>
                          <option value="5.0x Macro">5.0x Macro</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-ink-muted mb-1 font-bold" htmlFor={`productformmodal-f11-${idx}`}>Position Top (% from top)</label>
                        <input id={`productformmodal-f11-${idx}`} value={hs.top} onChange={e => updateHotspot(idx, 'top', e.target.value)} placeholder="28%" className="w-full bg-surface border border-line rounded-control px-3 py-2 focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-ink-muted mb-1 font-bold" htmlFor={`productformmodal-f12-${idx}`}>Position Left (% from left)</label>
                        <input id={`productformmodal-f12-${idx}`} value={hs.left} onChange={e => updateHotspot(idx, 'left', e.target.value)} placeholder="48%" className="w-full bg-surface border border-line rounded-control px-3 py-2 focus:outline-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-ink-muted mb-1 font-bold" htmlFor={`productformmodal-f13-${idx}`}>Macro Zoomed Close-Up Image</label>
                      <div className="flex gap-2">
                        <input id={`productformmodal-f13-${idx}`} value={hs.zoomedImage} onChange={e => updateHotspot(idx, 'zoomedImage', e.target.value)} placeholder="Upload or paste image URL..." className="flex-1 bg-surface border border-line rounded-control px-3 py-2 font-mono text-[11px] focus:outline-none" />
                        <UploadButton
                          busy={uploading === `hotspot-${idx}`}
                          onFile={f => handleUpload(f, `hotspot-${idx}`)}
                        />
                      </div>
                      {hs.zoomedImage && <img src={hs.zoomedImage} alt="Hotspot Zoom" className="mt-2 w-16 h-16 object-cover rounded-control border border-line" />}
                    </div>

                    <div>
                      <label className="block text-ink-muted mb-1 font-bold" htmlFor={`productformmodal-f14-${idx}`}>Detail Description</label>
                      <textarea id={`productformmodal-f14-${idx}`} value={hs.detail} onChange={e => updateHotspot(idx, 'detail', e.target.value)} rows={2} placeholder="Hand-embroidered 24K tested Zari threading..." className="w-full bg-surface border border-line rounded-control px-3 py-2 focus:outline-none resize-none" />
                    </div>

                    <div>
                      <label className="block text-ink-muted mb-1 font-bold" htmlFor={`productformmodal-f15-${idx}`}>Technical Specifications</label>
                      <input id={`productformmodal-f15-${idx}`} value={hs.techSpecs} onChange={e => updateHotspot(idx, 'techSpecs', e.target.value)} placeholder="Thread Density: 120 TPI • Zari Grade: Premium" className="w-full bg-surface border border-line rounded-control px-3 py-2 focus:outline-none" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB: 360° SPIN */}
            {activeTab === 'spin' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <div>
                    <h3 className="font-black text-sm text-ink">360° Spin Frames</h3>
                    <p className="text-[11px] text-ink-subtle font-medium mt-0.5">
                      Upload a turntable sequence (typically 24–36 photos, shot at even angle
                      intervals). Customers drag or use arrow keys to rotate through them.
                    </p>
                  </div>
                  <UploadButton
                    busy={uploading.startsWith('spin')}
                    onFile={handleSpinUpload}
                    multiple
                    label={uploading.startsWith('spin') ? uploading.replace('spin-', '') : 'Upload Frames'}
                  />
                </div>

                {uploadError && (
                  <div className="bg-danger-soft border border-danger text-danger p-3 rounded-card font-bold">⚠️ {uploadError}</div>
                )}

                {form.spinImages.length === 0 ? (
                  <div className="text-center py-8 text-ink-subtle font-medium text-xs border border-dashed border-line rounded-card">
                    No spin frames yet. Upload multiple images at once — order matters, so upload
                    them in rotation sequence (you can still reorder afterwards).
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-[11px] font-black text-ink-subtle uppercase tracking-wide">{form.spinImages.length} Frames</p>
                      <div className="grid grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1">
                        {form.spinImages.map((url, idx) => (
                          <div key={idx} className="relative group">
                            <img src={url} alt={`Frame ${idx + 1}`} className="w-full aspect-square object-cover rounded-control border border-line" />
                            <span className="absolute top-1 left-1 bg-inverse/80 text-ink-inverse text-[9px] font-black px-1.5 py-0.5 rounded-pill">{idx + 1}</span>
                            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-0.5 p-1 bg-gradient-to-t from-inverse/70 to-transparent opacity-0 group-hover:opacity-100 transition">
                              <button type="button" onClick={() => moveSpinFrame(idx, -1)} disabled={idx === 0} className="p-1 text-ink-inverse disabled:opacity-30" title="Move earlier">
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button type="button" onClick={() => moveSpinFrame(idx, 1)} disabled={idx === form.spinImages.length - 1} className="p-1 text-ink-inverse disabled:opacity-30" title="Move later">
                                <ArrowDown className="w-3 h-3" />
                              </button>
                              <button type="button" onClick={() => removeSpinFrame(idx)} className="p-1 text-danger hover:text-danger" title="Remove">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-ink-subtle uppercase tracking-wide mb-2">Live Preview</p>
                      <div className="max-w-xs">
                        <Product360Viewer images={form.spinImages} alt={form.title || 'Product'} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: INVENTORY & VARIANTS */}
            {activeTab === 'inventory' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <div>
                    <h3 className="font-black text-sm text-ink">Variants — each has its own price, stock & SKU</h3>
                    <p className="text-[11px] text-ink-subtle font-medium mt-0.5">
                      e.g. a 30ml size can cost more than a 15ml trial size — leave Price/MRP blank to fall back to the product's base price above.
                    </p>
                  </div>
                  <Button size="sm" onClick={addVariant} className="shrink-0" leadingIcon={<Plus className="w-3.5 h-3.5" />}>
                    Add Variant
                  </Button>
                </div>

                <div className="bg-accent-soft border border-accent rounded-card px-4 py-2.5 text-accent font-bold">
                  Total Stock Across Variants: {totalStock}
                </div>

                {form.variants.map((v, idx) => (
                  <div key={idx} className="bg-surface-muted border border-line rounded-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-ink text-xs">Variant #{idx + 1}</span>
                      {form.variants.length > 1 && (
                        <button type="button" onClick={() => removeVariant(idx)} className="text-danger hover:bg-danger-soft p-1 rounded-pill">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-ink-muted mb-1 font-bold" htmlFor={`productformmodal-f16-${idx}`}>Color</label>
                        <input id={`productformmodal-f16-${idx}`} value={v.color} onChange={e => updateVariant(idx, 'color', e.target.value)} placeholder="e.g. Matte Black" className="w-full bg-surface border border-line rounded-control px-3 py-2 focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-ink-muted mb-1 font-bold" htmlFor={`productformmodal-f17-${idx}`}>Size</label>
                        <input id={`productformmodal-f17-${idx}`} value={v.size} onChange={e => updateVariant(idx, 'size', e.target.value)} placeholder="e.g. M or 30ml" className="w-full bg-surface border border-line rounded-control px-3 py-2 focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-ink-muted mb-1 font-bold" htmlFor={`productformmodal-f18-${idx}`}>SKU</label>
                        <input id={`productformmodal-f18-${idx}`} value={v.sku} onChange={e => updateVariant(idx, 'sku', e.target.value)} placeholder="Optional" className="w-full bg-surface border border-line rounded-control px-3 py-2 font-mono focus:outline-none" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-ink-muted mb-1 font-bold" htmlFor={`productformmodal-f19-${idx}`}>Stock <span className="text-danger">*</span></label>
                        <input id={`productformmodal-f19-${idx}`} type="number" min="0" required value={v.stock} onChange={e => updateVariant(idx, 'stock', e.target.value)} className="w-full bg-surface border border-line rounded-control px-3 py-2 focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-ink-muted mb-1 font-bold" htmlFor={`productformmodal-f20-${idx}`}>Price Override (₹)</label>
                        <input id={`productformmodal-f20-${idx}`} type="number" min="0" value={v.price} onChange={e => updateVariant(idx, 'price', e.target.value)} placeholder="Uses base price" className="w-full bg-surface border border-line rounded-control px-3 py-2 focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-ink-muted mb-1 font-bold" htmlFor={`productformmodal-f21-${idx}`}>MRP Override (₹)</label>
                        <input id={`productformmodal-f21-${idx}`} type="number" min="0" value={v.mrp} onChange={e => updateVariant(idx, 'mrp', e.target.value)} placeholder="Uses base MRP" className="w-full bg-surface border border-line rounded-control px-3 py-2 focus:outline-none" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB: BADGES & FEATURES */}
            {activeTab === 'badges' && (
              <div className="space-y-4">
                <h3 className="font-black text-sm text-ink border-b border-line pb-2">Lifestyle Badges & Feature Highlights</h3>

                <div>
                  <label htmlFor="productformmodal-x701" className="block text-ink-muted mb-1.5 font-bold">Lifestyle Badges <span className="text-ink-subtle font-normal">(shown as chips on product card)</span></label>
                  <p className="text-[11px] text-ink-subtle mb-2">e.g. "GI Tagged", "ANC 30dB Noise Cancel", "100% Organic", "Carbon Cushion Sole"</p>
                  <div className="flex gap-2">
                    <input id="productformmodal-x701"
                      value={badgeInput}
                      onChange={e => setBadgeInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag('lifestyleBadges', badgeInput, setBadgeInput); } }}
                      placeholder="e.g. GI Tagged — press Enter to add"
                      className="flex-1 bg-surface-muted border border-line rounded-card px-4 py-3 focus:outline-none focus:border-line-strong"
                    />
                    <Button size="sm" onClick={() => addTag('lifestyleBadges', badgeInput, setBadgeInput)} className="shrink-0" leadingIcon={<Plus className="w-4 h-4" />}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.lifestyleBadges.map((b, idx) => (
                      <span key={idx} className="bg-warning-soft border border-warning text-warning px-3 py-1.5 rounded-pill text-xs font-bold flex items-center gap-1.5">
                        {b}
                        <button type="button" onClick={() => removeTag('lifestyleBadges', idx)} className="text-warning hover:text-danger">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="productformmodal-x728" className="block text-ink-muted mb-1.5 font-bold">Key Product Features / Bullet Points <span className="text-ink-subtle font-normal">(shown in product detail page tabs)</span></label>
                  <div className="flex gap-2">
                    <input id="productformmodal-x728"
                      value={featureInput}
                      onChange={e => setFeatureInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag('features', featureInput, setFeatureInput); } }}
                      placeholder="e.g. Active Noise Cancellation (ANC) up to 30dB"
                      className="flex-1 bg-surface-muted border border-line rounded-card px-4 py-3 focus:outline-none focus:border-line-strong"
                    />
                    <Button size="sm" onClick={() => addTag('features', featureInput, setFeatureInput)} className="shrink-0" leadingIcon={<Plus className="w-4 h-4" />}>
                      Add
                    </Button>
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {form.features.map((f, idx) => (
                      <li key={idx} className="flex items-center justify-between bg-surface-muted border border-line px-4 py-2 rounded-control">
                        <span className="text-ink font-medium">• {f}</span>
                        <button type="button" onClick={() => removeTag('features', idx)} className="text-ink-subtle hover:text-danger">
                          <X className="w-3 h-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* TAB: DELIVERY & STORE */}
            {activeTab === 'delivery' && (
              <div className="space-y-4">
                <h3 className="font-black text-sm text-ink border-b border-line pb-2">Local Store Pickup & Express Delivery</h3>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={form.localStoreAvailable}
                      onChange={e => setField('localStoreAvailable', e.target.checked)}
                      className="w-4 h-4 accent-success"
                    />
                    <span className="font-bold text-ink">Local Store Pickup Available</span>
                  </label>

                  {form.localStoreAvailable && (
                    <div>
                      <label htmlFor="productformmodal-x773" className="block text-ink-muted mb-1.5 font-bold">Store Name & Location</label>
                      <input id="productformmodal-x773"
                        value={form.localStoreName}
                        onChange={e => setField('localStoreName', e.target.value)}
                        placeholder="e.g. Bengaluru Indiranagar Store (In Stock)"
                        className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 focus:outline-none focus:border-line-strong"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="productformmodal-x785" className="block text-ink-muted mb-1.5 font-bold">Express Delivery Eligible PIN Codes</label>
                  <p className="text-[11px] text-ink-subtle mb-2">Add PIN codes where same-day or next-day Shiprocket delivery is available.</p>
                  <div className="flex gap-2">
                    <input id="productformmodal-x785"
                      value={pincodeInput}
                      onChange={e => setPincodeInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag('expressPincodes', pincodeInput, setPincodeInput); } }}
                      maxLength={6}
                      placeholder="e.g. 560001"
                      className="flex-1 bg-surface-muted border border-line rounded-card px-4 py-3 font-mono focus:outline-none focus:border-line-strong"
                    />
                    <Button size="sm" onClick={() => addTag('expressPincodes', pincodeInput, setPincodeInput)} className="shrink-0" leadingIcon={<Plus className="w-4 h-4" />}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.expressPincodes.map((pin, idx) => (
                      <span key={idx} className="bg-accent-soft border border-accent text-accent px-3 py-1.5 rounded-pill text-xs font-mono font-bold flex items-center gap-1.5">
                        📍 {pin}
                        <button type="button" onClick={() => removeTag('expressPincodes', idx)} className="text-accent hover:text-danger">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SEO & REVIEWS */}
            {activeTab === 'seo' && (
              <div className="space-y-4">
                <h3 className="font-black text-sm text-ink border-b border-line pb-2">SEO Metadata</h3>

                <div>
                  <label htmlFor="productformmodal-x820" className="block text-ink-muted mb-1.5 font-bold">
                    SEO Meta Description <span className="text-ink-subtle font-normal">(used in Google search results — keep 150-160 chars)</span>
                  </label>
                  <textarea id="productformmodal-x820"
                    rows={4}
                    value={form.seoDescription}
                    onChange={e => setField('seoDescription', e.target.value)}
                    placeholder="Buy royal Hand-Embroidered Chanderi Silk Anarkali Set online at best price in India..."
                    className="w-full bg-surface-muted border border-line rounded-card px-4 py-3 focus:outline-none focus:border-line-strong resize-none"
                  />
                  <span className="text-[11px] text-ink-subtle">{form.seoDescription.length} / 160 characters</span>
                </div>

                <div className="bg-warning-soft border border-warning p-4 rounded-card space-y-1 text-[11px]">
                  <span className="font-black text-warning block">Google Search Preview:</span>
                  <span className="text-accent font-bold block">{form.title || 'Product Title Here'} — BazaarX</span>
                  <span className="text-ink-muted">{form.seoDescription || 'Your meta description will appear here...'}</span>
                </div>

                <div className="border-t border-line pt-4">
                  <h3 className="font-black text-sm text-ink mb-2">Rating & Reviews</h3>
                  <div className="bg-surface-muted border border-line rounded-card p-4 flex items-center gap-4">
                    <div className="flex items-center gap-1 text-warning font-black text-lg">
                      <Star className="w-5 h-5 fill-rating text-warning" /> {product?.rating ?? '—'}
                    </div>
                    <span className="text-ink-subtle font-bold">{product?.reviewsCount ?? 0} verified review(s)</span>
                  </div>
                  <p className="text-[11px] text-ink-subtle mt-1.5">
                    Computed automatically from real, approved customer reviews — not editable here.
                  </p>
                </div>
              </div>
            )}

            {/* TAB: LIVE PREVIEW */}
            {activeTab === 'preview' && (
              <div className="space-y-5">
                <h3 className="font-black text-sm text-ink border-b border-line pb-2">
                  Exactly what shoppers will see — updates as you type
                </h3>

                {!form.title || !form.image ? (
                  <div className="text-center py-10 text-ink-subtle font-medium text-xs border border-dashed border-line rounded-card">
                    Add a title and main image on the Basic Info tab to see the live preview.
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-[11px] font-black text-ink-subtle uppercase tracking-wide mb-2">Storefront Product Card</p>
                      {/* Clicks are swallowed at the capture phase — this is a
                          visual preview, not a live storefront, so "Add to
                          cart" / wishlist / navigation must not actually fire. */}
                      <div className="max-w-[280px]" onClickCapture={e => { e.preventDefault(); e.stopPropagation(); }}>
                        <ProductCard product={previewProduct} onAddToCart={() => {}} onQuickView={() => {}} />
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] font-black text-ink-subtle uppercase tracking-wide mb-2">Product Detail Page Hero</p>
                      <div className="bg-canvas border border-line rounded-panel p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="aspect-square rounded-card overflow-hidden bg-surface border border-line relative">
                          <img src={form.image} alt={form.title} className="w-full h-full object-cover" />
                          {form.isNew && (
                            <span className="absolute top-3 left-3 bg-success text-ink-inverse text-[10px] font-black px-2.5 py-1 rounded-pill uppercase">New Arrival</span>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1.5">
                            {form.lifestyleBadges.map((b, i) => (
                              <span key={i} className="text-[10px] font-extrabold text-ink bg-surface border border-line px-2 py-0.5 rounded-pill">{b}</span>
                            ))}
                          </div>
                          <h2 className="text-xl font-black text-ink leading-tight">{form.title}</h2>
                          <div className="flex items-end gap-2">
                            <span className="text-2xl font-black text-ink">₹{(parseFloat(form.price) || 0).toLocaleString('en-IN')}</span>
                            {parseFloat(form.mrp) > parseFloat(form.price) && (
                              <span className="text-sm text-ink-subtle line-through font-semibold">MRP ₹{parseFloat(form.mrp).toLocaleString('en-IN')}</span>
                            )}
                            {previewProduct.discount > 0 && (
                              <span className="bg-danger text-ink-inverse text-[10px] font-black px-2 py-0.5 rounded-control">{previewProduct.discount}% OFF</span>
                            )}
                          </div>
                          {form.variants.some(v => v.color || v.size) && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {form.variants.filter(v => v.color || v.size).map((v, i) => (
                                <span key={i} className="text-[11px] font-semibold border border-line rounded-control px-2.5 py-1 bg-surface">
                                  {[v.color, v.size].filter(Boolean).join(' · ')}
                                </span>
                              ))}
                            </div>
                          )}
                          {form.hotspots.length > 0 && (
                            <p className="text-[11px] text-accent font-bold flex items-center gap-1 pt-1">
                              <Zap className="w-3.5 h-3.5" /> {form.hotspots.length} interactive hotspot{form.hotspots.length === 1 ? '' : 's'} configured
                            </p>
                          )}
                          {form.spinImages.length > 0 && (
                            <p className="text-[11px] text-accent font-bold flex items-center gap-1">
                              <RotateCcw className="w-3.5 h-3.5" /> {form.spinImages.length}-frame 360° spin view
                            </p>
                          )}
                          {form.features.length > 0 && (
                            <ul className="pt-2 space-y-1">
                              {form.features.slice(0, 4).map((f, i) => (
                                <li key={i} className="text-[11px] text-ink-muted font-medium flex items-start gap-1.5">
                                  <span className="text-success mt-0.5">✓</span> {f}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

          </div>

          {/* Sticky Footer Buttons */}
          <div className="sticky bottom-0 bg-surface border-t border-line px-6 py-4 flex items-center justify-between gap-4">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={saving}
              leadingIcon={<Save className="w-4 h-4" />}
            >
              {saving ? 'Saving to Database...' : (product ? 'Update Product in Database' : 'Save Product to Database')}
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}
