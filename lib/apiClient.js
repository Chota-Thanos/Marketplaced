const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80';

export async function apiFetch(path, { method = 'GET', body, token, cache } = {}) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: cache ?? 'no-store',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // A 401 on a request we sent a token with means that token is dead
    // (expired/revoked//DB reset). Clear it and let the app fall back to its
    // login screen — otherwise callers silently render empty data as if the
    // account genuinely had none.
    if (res.status === 401 && token && typeof window !== 'undefined') {
      clearStoredAuth();
      localStorage.removeItem('bx_admin_session');
      window.dispatchEvent(new CustomEvent('bazaarx:unauthorized'));
    }

    const message = data.errors
      ? Object.values(data.errors).flat().join(' ')
      : data.message || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return data;
}

// ── Auth token persistence (client-side only) ─────────────────────────────
const TOKEN_KEY = 'bazaarx_auth_token';
const USER_KEY = 'bazaarx_auth_user';

export function getStoredAuth() {
  if (typeof window === 'undefined') return { token: null, user: null };
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    return { token, user };
  } catch (e) {
    return { token: null, user: null };
  }
}

export function setStoredAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// ── Shape normalizers: Laravel's snake_case JSON -> the shape every
//    storefront/admin component already expects (carried over from Prisma) ──
export function mapCategory(c) {
  if (!c) return c;
  return {
    ...c,
    iconUrl: c.icon_url,
    bannerUrl: c.banner_url,
    sortOrder: c.sort_order,
    isFeatured: c.is_featured,
    parentId: c.parent_id,
    _count: { products: c.products_count ?? c._count?.products ?? 0 },
  };
}

export function mapVariant(v) {
  if (!v) return v;
  return {
    ...v,
    price: v.price !== null && v.price !== undefined ? Number(v.price) : undefined,
    mrp: v.mrp !== null && v.mrp !== undefined ? Number(v.mrp) : undefined,
    stock: Number(v.stock ?? 0),
  };
}

export function mapProduct(p) {
  if (!p) return p;
  const images = p.images || [];
  return {
    ...p,
    categoryId: p.category_id,
    categorySlug: p.category?.slug,
    category: p.category?.name || p.category,
    image: images[0] || FALLBACK_IMAGE,
    images,
    price: Number(p.price),
    mrp: Number(p.mrp),
    discount: p.discount ?? (p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0),
    isNew: p.is_new,
    lifestyleBadges: p.tags || [],
    rating: p.rating ?? 0,
    reviewsCount: p.reviews_count ?? 0,
    stockCount: p.stock_count ?? 0,
    inStock: p.in_stock ?? true,
    variants: (p.variants || []).map(mapVariant),
    rolloverImage: p.rollover_image,
    authenticityGrade: p.authenticity_grade,
    localStoreAvailable: p.local_store_available,
    localStoreName: p.local_store_name || 'Local Store Pickup',
    expressPincodes: p.express_pincodes || [],
    hotspots: p.hotspots || [],
    spinImages: p.spin_images || [],
    codAvailable: p.cod_available ?? true,
    reelVideoUrl: p.reel_video_url || null,
    reelCaption: p.reel_caption || '',
    hasReel: p.has_reel ?? Boolean(p.reel_video_url),
  };
}

// Laravel's real order status vocabulary (replaces the old mismatched
// 'New'/'Confirmed'/... strings that never matched what got stored).
export const ORDER_STAGES = ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

export const STAGE_LABELS = {
  PENDING: 'Pending', CONFIRMED: 'Confirmed', PACKED: 'Packed', SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for Delivery', DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
};

export const RETURN_STATUS_LABELS = {
  REQUESTED: 'Requested', APPROVED: 'Approved', PICKUP_SCHEDULED: 'Pickup Scheduled',
  PICKED_UP: 'Picked Up', REFUNDED: 'Refunded', REJECTED: 'Rejected',
};

export function formatINR(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function mapOrder(o) {
  if (!o) return o;
  const addr = o.shipping_address || {};
  return {
    ...o,
    id: o.order_number, // admin UI displays/keys by the human order number
    _id: o.id, // real UUID, used for API calls
    customerName: addr.name || o.user?.name || 'Guest',
    phone: addr.phone || o.user?.phone || '',
    address: [addr.line1, addr.line2].filter(Boolean).join(', '),
    city: addr.city,
    pincode: addr.pincode,
    totalAmount: Number(o.total_amount),
    paymentMethod: o.payment_method,
    paymentStatus: o.payment_status,
    status: o.status,
    createdAt: o.created_at ? new Date(o.created_at).toLocaleString('en-IN') : '',
    courier: o.courier,
    trackingNo: o.tracking_no,
    labelGenerated: o.label_generated,
    items: (o.items || []).map(item => ({
      title: item.product?.title || 'Product',
      qty: item.quantity,
      price: Number(item.price),
    })),
  };
}
