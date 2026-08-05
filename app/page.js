import React from 'react';
import HomeClient from '../components/storefront/HomeClient';
import { apiFetch, mapProduct, mapCategory } from '../lib/apiClient';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let categories = [];
  let products = [];
  let hasReels = false;

  try {
    const [categoriesRes, productsRes, reelsRes] = await Promise.all([
      apiFetch('/categories'),
      apiFetch('/products'),
      apiFetch('/reels?per_page=1'),
    ]);

    categories = (categoriesRes?.data || []).map(mapCategory);
    products = (productsRes?.data || []).map(mapProduct);
    hasReels = (reelsRes?.meta?.total ?? 0) > 0;
  } catch (e) {
    console.error('Failed to fetch home page data from API:', e.message);
  }

  return <HomeClient categories={categories} products={products} hasReels={hasReels} />;
}
