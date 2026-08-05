import React from 'react';
import { notFound } from 'next/navigation';
import { apiFetch, mapProduct } from '../../../lib/apiClient';
import ProductDetailClient from '../../../components/storefront/ProductDetailClient';

export default async function ProductPage({ params }) {
  const { id } = await params;

  let productRes;
  try {
    productRes = await apiFetch(`/products/${id}`);
  } catch (e) {
    notFound();
  }

  const product = mapProduct(productRes.data);

  return <ProductDetailClient product={product} />;
}
