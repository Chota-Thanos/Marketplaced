import React from 'react';
import { notFound } from 'next/navigation';
import { apiFetch, mapProduct, mapCategory } from '../../../lib/apiClient';
import CategoryClient from '../../../components/storefront/CategoryClient';

export default async function CategoryPage({ params }) {
  const { slug } = await params;

  const categoriesRes = await apiFetch('/categories');
  const rawCategory = categoriesRes.data.find(c => c.slug === slug);

  if (!rawCategory) {
    notFound();
  }

  const productsRes = await apiFetch(`/products?category=${slug}`);
  const products = productsRes.data.map(mapProduct);
  const category = mapCategory(rawCategory);

  return <CategoryClient category={category} products={products} />;
}
