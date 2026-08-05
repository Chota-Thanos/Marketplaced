import React from 'react';
import HomeClient from '../components/storefront/HomeClient';
import { apiFetch, mapProduct, mapCategory } from '../lib/apiClient';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [categoriesRes, productsRes, reelsRes] = await Promise.all([
    apiFetch('/categories'),
    apiFetch('/products'),
    // Reels are opt-in per product — most stores will have none. A cheap
    // existence check (one row) is enough to decide whether the homepage
    // promotes a feature that would otherwise lead to an empty page.
    apiFetch('/reels?per_page=1'),
  ]);

  const categories = categoriesRes.data.map(mapCategory);
  const products = productsRes.data.map(mapProduct);
  const hasReels = (reelsRes.meta?.total ?? 0) > 0;

  return <HomeClient categories={categories} products={products} hasReels={hasReels} />;
}
