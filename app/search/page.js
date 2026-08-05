import { apiFetch, mapProduct } from '../../lib/apiClient';
import SearchClient from '../../components/storefront/SearchClient';

export const metadata = {
  title: 'Search Results | BazaarX',
  description: 'Search for the best products on BazaarX.',
};

export default async function SearchPage({ searchParams }) {
  const query = (await searchParams)?.q || '';

  const params = new URLSearchParams();
  if (query) params.set('search', query);

  const res = await apiFetch(`/products?${params.toString()}`);
  const mappedProducts = res.data.map(mapProduct);

  return <SearchClient query={query} products={mappedProducts} />;
}
