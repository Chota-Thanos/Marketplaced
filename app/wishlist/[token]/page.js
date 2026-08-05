import { notFound } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, mapProduct, formatINR } from '../../../lib/apiClient';
import { Gift } from 'lucide-react';

export const metadata = {
  title: 'Shared Wishlist | BazaarX',
};

export default async function SharedWishlistPage({ params }) {
  const { token } = await params;

  let wishlist;
  try {
    const res = await apiFetch(`/wishlists/shared/${token}`);
    wishlist = res.data;
  } catch (e) {
    notFound();
  }

  const items = wishlist.items || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-10">
        <div className="w-14 h-14 bg-danger-soft rounded-card flex items-center justify-center mx-auto mb-4">
          <Gift className="w-7 h-7 text-danger" />
        </div>
        <h1 className="text-3xl font-black text-ink">{wishlist.name}</h1>
        <p className="text-ink-subtle font-medium mt-1">
          Shared by {wishlist.user?.name || 'a BazaarX shopper'} · {items.length} item{items.length === 1 ? '' : 's'}
        </p>
      </div>

      {items.length === 0 ? (
        <p className="text-center text-ink-subtle font-bold py-12">This wishlist is empty.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map(item => {
            const product = mapProduct(item.product);
            return (
              <Link key={item.id} href={`/product/${product.id}`}
                className="bg-surface border border-line rounded-card overflow-hidden hover:shadow-card transition group">
                <div className="aspect-square bg-surface-muted overflow-hidden">
                  <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-ink text-xs line-clamp-2">{product.title}</h3>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="font-black text-ink">{formatINR(product.price)}</span>
                    <span className="text-[11px] text-ink-subtle line-through font-semibold">{formatINR(product.mrp)}</span>
                  </div>
                  {!product.inStock && (
                    <p className="text-[10px] font-black text-danger mt-1">Out of stock</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
