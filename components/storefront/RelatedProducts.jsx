"use client";

import { useEffect, useState } from 'react';
import ProductCard from '../ProductCard';
import { apiFetch, mapProduct } from '../../lib/apiClient';

/**
 * "Customers who bought this also bought" — real co-purchase data from
 * order_items, with same-category siblings as the cold-start fallback.
 */
export default function RelatedProducts({ productId }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiFetch(`/products/${productId}/related`)
      .then(res => { if (!cancelled) setProducts((res.data || []).map(mapProduct)); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [productId]);

  if (loading || products.length === 0) return null;

  return (
    <section aria-labelledby="related-heading">
      <h2 id="related-heading" className="text-2xl font-black text-ink mb-6">
        Customers also bought
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}
