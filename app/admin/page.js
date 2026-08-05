'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, Package, Tag, ShoppingCart, Star, MessageSquare,
  Settings,
  Palette,
  Shapes,
  LogOut, ChevronRight, Search, Bell, RefreshCw, Plus, Pencil, Trash2,
  ArrowUpRight, Users, TrendingUp, AlertTriangle, CheckCircle2, Clock,
  Eye, ChevronDown, Filter, X, Store, Shield, Lock, Mail, KeyRound,
  Menu, XCircle, BarChart3, Zap, Package2, Inbox, Truck, Flag
} from 'lucide-react';
import ProductFormModal from '../../components/admin/ProductFormModal';
import CategoryFormModal from '../../components/admin/CategoryFormModal';
import ReviewsSection from '../../components/admin/ReviewsSection';
import CouponsSection from '../../components/admin/CouponsSection';
import ReturnsSection from '../../components/admin/ReturnsSection';
import BroadcastSection from '../../components/admin/BroadcastSection';
import { apiFetch, mapProduct, mapCategory, mapOrder, ORDER_STAGES } from '../../lib/apiClient';
import { useAdminAuth } from '../../components/admin/AdminAuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR NAV
// ─────────────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'categories', label: 'Categories', icon: Tag },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'returns', label: 'Returns', icon: Inbox },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'qna', label: 'Q&A', icon: MessageSquare, href: '/admin/qna' },
  { id: 'coupons', label: 'Coupons', icon: Flag },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/admin/analytics' },
  { id: 'storefront', label: 'Storefront', icon: Store, href: '/admin/storefront-builder' },
  { id: 'appearance', label: 'Colours', icon: Palette, href: '/admin/appearance' },
  { id: 'design', label: 'Design', icon: Shapes, href: '/admin/design' },
  { id: 'messages', label: 'Broadcast', icon: MessageSquare },
  // Full admins only. A sub-admin who navigates here anyway gets a 403 from the
  // API and an explanation — the server is the gate, this only hides the door.
  { id: 'users', label: 'Users & staff', icon: Users, href: '/admin/users', adminOnly: true },
  { id: 'settings', label: 'Settings', icon: Settings },
];

/** Nav filtered for who is looking at it. */
function navFor(user) {
  const canManageUsers = ['ADMIN', 'SUPER_ADMIN'].includes(user?.role);
  return NAV_ITEMS.filter((item) => !item.adminOnly || canManageUsers);
}

function Sidebar({ current, onNavigate, onLogout, collapsed, setCollapsed, user }) {
  return (
    <aside className={`fixed left-0 top-0 h-screen bg-inverse border-r border-line-strong flex flex-col z-40 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      
      <div className="p-4 flex items-center justify-between border-b border-line-strong">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-warning rounded-control flex items-center justify-center">
              <Store className="w-4 h-4 text-ink" />
            </div>
            <span className="font-black text-ink-inverse text-sm">BazaarX Admin</span>
          </div>
        )}
        {collapsed && <div className="w-8 h-8 bg-warning rounded-control flex items-center justify-center mx-auto"><Store className="w-4 h-4 text-ink" /></div>}
        <button onClick={() => setCollapsed(c => !c)} className={`text-ink-subtle hover:text-ink-inverse transition ${collapsed ? 'mx-auto mt-2' : ''}`}>
          {collapsed ? <Menu className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navFor(user).map(item => {
          const Icon = item.icon;
          const active = current === item.id;
          const classes = `w-full flex items-center gap-3 px-3 py-2.5 rounded-card text-sm font-bold transition ${
            active ? 'bg-warning text-ink' : 'text-ink-subtle hover:bg-inverse hover:text-ink-inverse'
          } ${collapsed ? 'justify-center' : ''}`;

          // Sections living on their own route navigate; the rest swap panels in place.
          return item.href ? (
            <Link key={item.id} href={item.href} title={collapsed ? item.label : ''} className={classes}>
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && item.label}
            </Link>
          ) : (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : ''}
              className={classes}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-line-strong">
        <button onClick={onLogout} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-card text-sm font-bold text-ink-subtle hover:bg-danger/30 hover:text-danger transition ${collapsed ? 'justify-center' : ''}`}>
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && 'Sign Out'}
        </button>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOP BAR
// ─────────────────────────────────────────────────────────────────────────────
function TopBar({ section, collapsed, adminEmail }) {
  const titles = {
    overview: 'Dashboard Overview',
    products: 'Product Catalog Management',
    categories: 'Category Management',
    orders: 'Order Fulfillment',
    returns: 'Returns & Refunds',
    reviews: 'Review Moderation',
    coupons: 'Coupons & Promotions',
    messages: 'Notifications Broadcast',
    settings: 'Admin Settings',
  };

  return (
    <header className={`fixed top-0 right-0 h-16 bg-surface border-b border-line z-30 flex items-center justify-between px-6 transition-all duration-300 ${collapsed ? 'left-20' : 'left-64'}`}>
      <div>
        <h1 className="font-black text-ink text-base">{titles[section] || 'Admin Panel'}</h1>
        <p className="text-xs text-ink-subtle font-medium">BazaarX Admin Portal — Logged in as {adminEmail}</p>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative text-ink-subtle hover:text-ink p-2 rounded-pill hover:bg-surface-sunken transition">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-pill" />
        </button>
        <div className="w-8 h-8 bg-inverse rounded-pill flex items-center justify-center">
          <span className="text-ink-inverse text-xs font-black">BX</span>
        </div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTS SECTION
// ─────────────────────────────────────────────────────────────────────────────
function ProductsSection({ token }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterCat !== 'all') params.set('category', filterCat);
    if (search) params.set('search', search);
    const data = await apiFetch(`/products?${params}`);
    setProducts((data.data || []).map(mapProduct));
    setLoading(false);
  };

  const fetchCategories = async () => {
    const data = await apiFetch('/categories');
    setCategories((data.data || []).map(mapCategory));
  };

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { fetchProducts(); }, [filterCat, search]);

  const handleSaved = (savedProduct, isEdit) => {
    const mapped = mapProduct(savedProduct);
    if (isEdit) {
      setProducts(prev => prev.map(p => p.id === mapped.id ? mapped : p));
      showToast('✅ Product updated in database successfully!');
    } else {
      setProducts(prev => [mapped, ...prev]);
      showToast('✅ Product added to catalog!');
    }
    setModalOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = async (id) => {
    try {
      await apiFetch(`/products/${id}`, { method: 'DELETE', token });
      setProducts(prev => prev.filter(p => p.id !== id));
      showToast('🗑️ Product deleted from database.');
    } catch (e) {
      showToast(`⚠️ ${e.message}`);
    }
    setDeleteId(null);
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const filtered = products.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-inverse text-ink-inverse px-6 py-3 rounded-pill shadow-panel z-50 font-bold text-sm animate-bounce-in">
          {toastMsg}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products by name or category..."
            className="w-full bg-surface border border-line rounded-card pl-10 pr-4 py-2.5 text-sm text-ink font-semibold focus:outline-none focus:border-line-strong"
          />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="bg-surface border border-line rounded-card px-4 py-2.5 text-sm font-bold text-ink focus:outline-none focus:border-line-strong">
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
        <button onClick={fetchProducts} className="p-2.5 bg-surface border border-line rounded-card text-ink-muted hover:text-ink hover:border-line-strong transition">
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setEditingProduct(null); setModalOpen(true); }}
          className="flex items-center gap-2 bg-inverse text-ink-inverse px-4 py-2.5 rounded-card text-sm font-bold hover:bg-inverse transition"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: products.length, icon: Package, color: 'bg-accent-soft text-accent border-accent' },
          { label: 'In Stock', value: products.filter(p => p.inStock).length, icon: CheckCircle2, color: 'bg-success-soft text-success border-success' },
          { label: 'Out of Stock', value: products.filter(p => !p.inStock).length, icon: AlertTriangle, color: 'bg-danger-soft text-danger border-danger' },
          { label: 'New Arrivals', value: products.filter(p => p.isNew).length, icon: Zap, color: 'bg-warning-soft text-warning border-warning' },
        ].map(stat => (
          <div key={stat.label} className={`flex items-center gap-3 bg-surface border rounded-card p-4 ${stat.color}`}>
            <stat.icon className="w-8 h-8 shrink-0" />
            <div>
              <p className="text-2xl font-black">{stat.value}</p>
              <p className="text-xs font-bold opacity-80">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-surface border border-line rounded-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-surface-muted border-b border-line">
                <th className="text-left px-5 py-3.5 font-black text-ink-muted w-12">#</th>
                <th className="text-left px-5 py-3.5 font-black text-ink-muted">Product</th>
                <th className="text-left px-5 py-3.5 font-black text-ink-muted">Category</th>
                <th className="text-right px-5 py-3.5 font-black text-ink-muted">Price</th>
                <th className="text-right px-5 py-3.5 font-black text-ink-muted">Discount</th>
                <th className="text-center px-5 py-3.5 font-black text-ink-muted">Stock</th>
                <th className="text-center px-5 py-3.5 font-black text-ink-muted">Status</th>
                <th className="text-center px-5 py-3.5 font-black text-ink-muted">Hotspots</th>
                <th className="text-center px-5 py-3.5 font-black text-ink-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={9} className="text-center py-10 text-ink-subtle font-bold">Loading from database...</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center py-10 text-ink-subtle font-bold">No products found. Add your first product.</td></tr>
              )}
              {!loading && filtered.map((product, i) => (
                <tr key={product.id} className="border-b border-line hover:bg-surface-muted transition group">
                  <td className="px-5 py-3.5 text-ink-subtle font-bold">{i + 1}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <img src={product.image} alt={product.title} className="w-10 h-10 object-cover rounded-control border border-line shrink-0" />
                      <div>
                        <p className="font-bold text-ink line-clamp-1">{product.title}</p>
                        <p className="text-ink-subtle font-mono">{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="bg-surface-sunken text-ink-muted px-2.5 py-1 rounded-pill font-bold">{product.category}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-black text-ink">₹{product.price.toLocaleString('en-IN')}</td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="bg-danger-soft text-danger border border-danger px-2 py-0.5 rounded-pill font-bold">{product.discount}% OFF</span>
                  </td>
                  <td className="px-5 py-3.5 text-center font-bold text-ink-muted">{product.stockCount}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`px-2.5 py-1 rounded-pill font-bold ${product.inStock ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>
                      {product.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                    {product.isNew && <span className="ml-1.5 bg-warning-soft text-warning px-2 py-0.5 rounded-pill font-bold border border-warning">NEW</span>}
                  </td>
                  <td className="px-5 py-3.5 text-center font-bold text-ink-muted">{product.hotspots?.length || 0}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => { setEditingProduct(product); setModalOpen(true); }}
                        className="p-2 bg-accent-soft text-accent hover:bg-accent-soft rounded-control transition"
                        title="Edit Product"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(product.id)}
                        className="p-2 bg-danger-soft text-danger hover:bg-danger-soft rounded-control transition"
                        title="Delete Product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirm Dialog */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-inverse/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-surface rounded-panel p-6 w-80 border border-line shadow-panel">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-danger-soft rounded-card flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6 text-danger" />
              </div>
              <h3 className="font-black text-ink text-base">Delete Product?</h3>
              <p className="text-ink-subtle text-sm">This action cannot be undone. The product will be permanently removed from the catalog.</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeleteId(null)} className="flex-1 bg-surface-sunken text-ink-muted py-2.5 rounded-card font-bold text-sm hover:bg-surface-sunken transition">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 bg-danger text-ink-inverse py-2.5 rounded-card font-bold text-sm hover:bg-danger transition">Delete</button>
            </div>
          </div>
        </div>
      )}

      <ProductFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingProduct(null); }}
        product={editingProduct}
        categories={categories}
        onSaved={handleSaved}
        token={token}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIES SECTION
// ─────────────────────────────────────────────────────────────────────────────
function CategoriesSection({ token }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    const data = await apiFetch('/categories');
    setCategories((data.data || []).map(mapCategory));
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSaved = (saved, isEdit) => {
    const mapped = mapCategory(saved);
    if (isEdit) {
      setCategories(prev => prev.map(c => c.id === mapped.id ? mapped : c));
      showToast('✅ Category updated!');
    } else {
      setCategories(prev => [...prev, mapped]);
      showToast('✅ Category created!');
    }
    setModalOpen(false);
    setEditingCat(null);
  };

  const handleDelete = async (id) => {
    try {
      await apiFetch(`/categories/${id}`, { method: 'DELETE', token });
      setCategories(prev => prev.filter(c => c.id !== id));
      showToast('🗑️ Category deleted.');
    } catch (e) {
      showToast(`⚠️ ${e.message}`);
    }
    setDeleteId(null);
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-inverse text-ink-inverse px-6 py-3 rounded-pill shadow-panel z-50 font-bold text-sm">
          {toastMsg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-ink-subtle text-sm font-bold">{categories.length} categories configured</p>
        <div className="flex items-center gap-3">
          <button onClick={fetchCategories} className="p-2.5 bg-surface border border-line rounded-card text-ink-muted hover:text-ink hover:border-line-strong transition">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setEditingCat(null); setModalOpen(true); }}
            className="flex items-center gap-2 bg-inverse text-ink-inverse px-4 py-2.5 rounded-card text-sm font-bold hover:bg-inverse transition"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </div>
      </div>

      {loading && <div className="text-center py-10 text-ink-subtle font-bold">Loading categories...</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="bg-surface border border-line rounded-panel overflow-hidden hover:shadow-card transition group relative">
            {cat.isFeatured && (
              <span className="absolute top-3 left-3 bg-accent text-ink-inverse text-[10px] font-black px-2 py-0.5 rounded-pill z-10">
                FEATURED
              </span>
            )}
            <div className="relative h-32 overflow-hidden bg-surface-sunken">
              {cat.bannerUrl ? (
                <img src={cat.bannerUrl} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-surface-muted to-surface-sunken flex items-center justify-center">
                  <Tag className="w-10 h-10 text-ink-subtle" />
                </div>
              )}
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-ink text-sm">{cat.name}</h3>
                <span className="text-xs text-ink-subtle font-bold">{cat._count?.products?.toLocaleString() || 0} items</span>
              </div>
              <p className="font-mono text-[11px] text-ink-subtle">/{cat.slug} • Order: {cat.sortOrder}</p>
              <p className="text-[11px] text-ink-subtle font-medium">Icon: {cat.iconUrl}</p>
              <div className="flex items-center gap-2 pt-2 border-t border-line">
                <button
                  onClick={() => { setEditingCat(cat); setModalOpen(true); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-accent-soft text-accent hover:bg-accent-soft rounded-control text-xs font-bold transition"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => setDeleteId(cat.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-danger-soft text-danger hover:bg-danger-soft rounded-control text-xs font-bold transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 bg-inverse/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-surface rounded-panel p-6 w-80 border border-line shadow-panel">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-danger-soft rounded-card flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6 text-danger" />
              </div>
              <h3 className="font-black text-ink">Delete Category?</h3>
              <p className="text-ink-subtle text-sm">This will remove the category from the database.</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeleteId(null)} className="flex-1 bg-surface-sunken text-ink-muted py-2.5 rounded-card font-bold text-sm">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 bg-danger text-ink-inverse py-2.5 rounded-card font-bold text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}

      <CategoryFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingCat(null); }}
        category={editingCat}
        categories={categories}
        onSaved={handleSaved}
        token={token}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDERS SECTION
// ─────────────────────────────────────────────────────────────────────────────
// ORDER_STAGES imported from lib/apiClient — matches Laravel's real Order.status
// enum. The old local copy ('New'/'Confirmed'/...) never matched what got
// stored (orders are created as "CONFIRMED"), so "advance status" silently
// regressed every order back to stage zero. Fixed by sharing one source of truth.
const STAGE_LABELS = {
  PENDING: 'Pending', CONFIRMED: 'Confirmed', PACKED: 'Packed', SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for Delivery', DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
};
const STATUS_COLORS = {
  PENDING: 'bg-warning-soft text-warning border-warning',
  CONFIRMED: 'bg-accent-soft text-accent border-accent',
  PACKED: 'bg-accent-soft text-accent border-accent',
  SHIPPED: 'bg-accent-soft text-accent border-accent',
  OUT_FOR_DELIVERY: 'bg-warning-soft text-warning border-warning',
  DELIVERED: 'bg-success-soft text-success border-success',
  CANCELLED: 'bg-danger-soft text-danger border-danger',
};

function OrdersSection({ token }) {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const data = await apiFetch('/admin/orders', { token });
      setOrders((data.data || []).map(mapOrder));
      setLoading(false);
    };
    fetchOrders();
  }, []);

  const advance = async (orderId) => {
    setUpdating(true);
    const order = orders.find(o => o.id === orderId);
    const currentIdx = ORDER_STAGES.indexOf(order.status);
    if (currentIdx < ORDER_STAGES.length - 1) {
      const nextStatus = ORDER_STAGES[currentIdx + 1];
      try {
        await apiFetch(`/admin/orders/${order._id}`, {
          method: 'PUT', token, body: { status: nextStatus },
        });
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
        if (selectedOrder?.id === orderId) setSelectedOrder(so => ({ ...so, status: nextStatus }));
      } catch (e) {
        alert(e.message);
      }
    }
    setUpdating(false);
  };

  const statuses = ['All', ...ORDER_STAGES];
  const filtered = filter === 'All' ? orders : orders.filter(o => o.status === filter);
  const counts = ORDER_STAGES.reduce((acc, s) => { acc[s] = orders.filter(o => o.status === s).length; return acc; }, {});

  return (
    <div className="space-y-4">
      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-4 py-2 rounded-pill text-xs font-bold border transition ${filter === s ? 'bg-inverse text-ink-inverse border-line-strong' : 'bg-surface text-ink-muted border-line hover:border-line-strong hover:text-ink'}`}>
            {STAGE_LABELS[s] || s}
            {s !== 'All' && <span className="ml-1.5 bg-surface-sunken text-ink-muted px-1.5 py-0.5 rounded-pill">{counts[s] || 0}</span>}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Orders List */}
        <div className={`${selectedOrder ? 'lg:col-span-1' : 'lg:col-span-3'} space-y-3`}>
          {loading && <div className="text-center py-10 text-ink-subtle font-bold">Loading orders...</div>}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-10 text-ink-subtle font-bold bg-surface border border-line rounded-card">
              No orders with status: {filter}
            </div>
          )}
          {filtered.map(order => (
            <button
              key={order.id}
              onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
              className={`w-full text-left bg-surface border rounded-card p-4 transition hover:shadow-card ${selectedOrder?.id === order.id ? 'border-line-strong ring-2 ring-line-strong/20' : 'border-line'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-ink text-sm">{order.id}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-pill border ${STATUS_COLORS[order.status] || 'bg-surface-muted text-ink-muted border-line'}`}>
                      {STAGE_LABELS[order.status] || order.status}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted font-bold">{order.customerName}</p>
                  <p className="text-[11px] text-ink-subtle font-medium">{order.city}, {order.pincode}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs font-black text-ink">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-ink-subtle">{order.paymentMethod}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-ink-subtle font-medium">{order.createdAt}</p>
                  <ChevronRight className={`w-4 h-4 text-ink-subtle mt-2 mx-auto transition ${selectedOrder?.id === order.id ? 'rotate-90 text-ink' : ''}`} />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Order Detail */}
        {selectedOrder && (
          <div className="lg:col-span-2 bg-surface border border-line rounded-panel overflow-hidden">
            <div className="bg-inverse text-ink-inverse p-5 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base">Order {selectedOrder.id}</h3>
                <p className="text-ink-subtle text-xs font-medium">{selectedOrder.customerName} • {selectedOrder.createdAt}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-ink-subtle hover:text-ink-inverse p-1.5 rounded-pill hover:bg-inverse transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Status Timeline */}
              <div>
                <h4 className="font-black text-xs text-ink-muted mb-3">ORDER STATUS TIMELINE</h4>
                <div className="space-y-2">
                  {ORDER_STAGES.map((stage, idx) => {
                    const currentIdx = ORDER_STAGES.indexOf(selectedOrder.status);
                    const done = idx <= currentIdx;
                    const current = idx === currentIdx;
                    return (
                      <div key={stage} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-pill flex items-center justify-center shrink-0 transition ${done ? (current ? 'bg-warning' : 'bg-success') : 'bg-surface-sunken'}`}>
                          {done && !current && <CheckCircle2 className="w-4 h-4 text-ink-inverse" />}
                          {current && <Clock className="w-3.5 h-3.5 text-ink" />}
                          {!done && <div className="w-2 h-2 bg-surface-sunken rounded-pill" />}
                        </div>
                        <div className={`flex-1 py-2 px-3 rounded-control text-xs font-bold ${current ? 'bg-warning-soft border border-warning text-warning' : done ? 'bg-success-soft text-success' : 'text-ink-subtle'}`}>
                          {STAGE_LABELS[stage]}
                          {current && <span className="ml-2 text-[10px] font-black uppercase tracking-wide bg-warning text-ink px-1.5 py-0.5 rounded-pill">CURRENT</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Advance Status Button */}
              {selectedOrder.status !== 'DELIVERED' && selectedOrder.status !== 'CANCELLED' && (
                <button
                  onClick={() => advance(selectedOrder.id)}
                  disabled={updating}
                  className="w-full bg-inverse text-ink-inverse py-3 rounded-card text-sm font-black hover:bg-inverse transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {updating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                  Advance to: {STAGE_LABELS[ORDER_STAGES[ORDER_STAGES.indexOf(selectedOrder.status) + 1]]}
                </button>
              )}

              {/* Customer Details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <h4 className="font-black text-ink-muted">CUSTOMER</h4>
                  <p className="font-bold text-ink">{selectedOrder.customerName}</p>
                  <p className="text-ink-subtle">{selectedOrder.phone}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-black text-ink-muted">DELIVERY ADDRESS</h4>
                  <p className="text-ink-muted font-medium">{selectedOrder.address}, {selectedOrder.city} – {selectedOrder.pincode}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-black text-xs text-ink-muted mb-2">ORDERED ITEMS</h4>
                {(selectedOrder.items || []).map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-line last:border-0">
                    <div>
                      <p className="font-bold text-ink text-xs">{item.title}</p>
                      <p className="text-[11px] text-ink-subtle">Qty: {item.qty}</p>
                    </div>
                    <span className="font-black text-ink text-sm">₹{(item.price * item.qty).toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 font-black">
                  <span className="text-ink text-xs">Total Amount</span>
                  <span className="text-ink text-base">₹{selectedOrder.totalAmount?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Payment & Courier */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-surface-muted border border-line rounded-card p-3">
                  <h4 className="font-black text-ink-subtle mb-1">PAYMENT</h4>
                  <p className="font-bold text-ink">{selectedOrder.paymentMethod}</p>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-pill ${selectedOrder.paymentStatus === 'PAID' ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning'}`}>
                    {selectedOrder.paymentStatus}
                  </span>
                </div>
                <div className="bg-surface-muted border border-line rounded-card p-3">
                  <h4 className="font-black text-ink-subtle mb-1">COURIER</h4>
                  <p className="font-bold text-ink text-[11px]">{selectedOrder.courier || 'Not assigned'}</p>
                  <p className="text-ink-subtle font-mono text-[11px]">{selectedOrder.trackingNo || 'No tracking yet'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OVERVIEW SECTION
// ─────────────────────────────────────────────────────────────────────────────
function OverviewSection({ onNavigate, token }) {
  const [stats, setStats] = useState({ products: 0, orders: 0, categories: 0, reviews: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [pData, oData, cData] = await Promise.all([
        apiFetch('/products'), apiFetch('/admin/orders', { token }), apiFetch('/categories')
      ]);
      const products = (pData.data || []).map(mapProduct);
      const orders = (oData.data || []).map(mapOrder);
      const categories = cData.data || [];
      setStats({
        products: products.length,
        orders: orders.length,
        categories: categories.length,
        reviews: products.reduce((acc, p) => acc + (p.reviewsCount || 0), 0),
      });
      setRecentOrders(orders.slice(0, 5));
      setLoading(false);
    };
    load();
  }, []);

  const STAT_CARDS = [
    { label: 'Total Products', value: stats.products, icon: Package, color: 'from-accent to-accent', link: 'products' },
    { label: 'Total Orders', value: stats.orders, icon: ShoppingCart, color: 'from-warning to-warning', link: 'orders' },
    { label: 'Categories', value: stats.categories, icon: Tag, color: 'from-success to-success', link: 'categories' },
    { label: 'Total Reviews', value: stats.reviews, icon: Star, color: 'from-danger to-danger', link: 'reviews' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(card => (
          <button key={card.label} onClick={() => onNavigate(card.link)} className="text-left group">
            <div className={`bg-gradient-to-br ${card.color} text-ink-inverse rounded-panel p-5 hover:shadow-hover transition hover:-translate-y-0.5`}>
              <div className="flex items-center justify-between mb-3">
                <card.icon className="w-6 h-6 opacity-80" />
                <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
              </div>
              <p className="text-3xl font-black">{loading ? '...' : card.value}</p>
              <p className="text-sm font-bold opacity-80 mt-0.5">{card.label}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-surface border border-line rounded-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-ink">Recent Orders</h2>
            <button onClick={() => onNavigate('orders')} className="text-xs text-accent font-bold hover:underline">View all →</button>
          </div>
          <div className="space-y-3">
            {loading && <div className="text-ink-subtle text-sm font-bold text-center py-4">Loading...</div>}
            {recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-line last:border-0">
                <div>
                  <p className="font-bold text-ink text-sm">{order.id}</p>
                  <p className="text-xs text-ink-subtle">{order.customerName} · {order.city}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-ink text-sm">₹{order.totalAmount?.toLocaleString('en-IN')}</p>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-pill border ${STATUS_COLORS[order.status] || 'bg-surface-muted border-line text-ink-muted'}`}>
                    {STAGE_LABELS[order.status] || order.status}
                  </span>
                </div>
              </div>
            ))}
            {!loading && recentOrders.length === 0 && (
              <div className="text-ink-subtle text-sm font-bold text-center py-4">No orders yet.</div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-surface border border-line rounded-panel p-5">
          <h2 className="font-black text-ink mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { label: 'Add a new product to catalog', icon: Plus, action: () => onNavigate('products'), color: 'text-accent bg-accent-soft' },
              { label: 'Create a product category', icon: Tag, action: () => onNavigate('categories'), color: 'text-success bg-success-soft' },
              { label: 'Fulfill pending orders', icon: Truck, action: () => onNavigate('orders'), color: 'text-warning bg-warning-soft' },
              { label: 'Review customer messages', icon: MessageSquare, action: () => onNavigate('messages'), color: 'text-accent bg-accent-soft' },
            ].map(item => (
              <button key={item.label} onClick={item.action} className={`w-full flex items-center gap-3 p-3 ${item.color} rounded-card hover:scale-[1.01] transition text-sm font-bold text-left`}>
                <item.icon className="w-5 h-5 shrink-0" />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ADMIN APP
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  // Session lives in app/admin/layout.js so every /admin/* route is gated.
  const { token: adminToken, user: adminUser, logout: handleLogout } = useAdminAuth();
  const [section, setSection] = useState('overview');
  const [collapsed, setCollapsed] = useState(false);

  const renderSection = () => {
    switch (section) {
      case 'overview': return <OverviewSection onNavigate={setSection} token={adminToken} />;
      case 'products': return <ProductsSection token={adminToken} />;
      case 'categories': return <CategoriesSection token={adminToken} />;
      case 'orders': return <OrdersSection token={adminToken} />;
      case 'returns': return <ReturnsSection token={adminToken} />;
      case 'reviews': return <ReviewsSection token={adminToken} />;
      case 'coupons': return <CouponsSection token={adminToken} />;
      case 'messages': return <BroadcastSection token={adminToken} />;
      case 'settings': return (
        <div className="bg-surface border border-line rounded-panel p-8 text-ink">
          <h2 className="font-black text-lg mb-4">Admin Settings</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-3 border-b border-line">
              <span className="font-bold">Admin Email</span>
              <span className="text-ink-subtle font-mono">{adminUser?.email}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-line">
              <span className="font-bold">Session Duration</span>
              <span className="text-ink-subtle">8 hours</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-line">
              <span className="font-bold">Auth</span>
              <span className="text-ink-subtle">Laravel Sanctum token</span>
            </div>
            <button onClick={handleLogout} className="mt-4 flex items-center gap-2 bg-danger-soft text-danger border border-danger px-4 py-2.5 rounded-card text-sm font-bold hover:bg-danger-soft transition">
              <LogOut className="w-4 h-4" /> Sign Out of Admin Portal
            </button>
          </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-surface-muted">
      <Sidebar current={section} onNavigate={setSection} onLogout={handleLogout} collapsed={collapsed} setCollapsed={setCollapsed} user={adminUser} />
      <TopBar section={section} collapsed={collapsed} adminEmail={adminUser?.email} />
      <main className={`pt-16 min-h-screen transition-all duration-300 ${collapsed ? 'pl-20' : 'pl-64'}`}>
        <div className="p-6 max-w-screen-xl">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}
