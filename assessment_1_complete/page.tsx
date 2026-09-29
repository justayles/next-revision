import { cookies } from 'next/headers';
// import { unstable_noStore as noStore } from 'next/cache';
import { products } from './lib/products';
import { ProductCard } from './components/ProductCard';
import { SearchFilters } from './components/SearchFilters';
import { CartItem } from './lib/types';
import { Suspense } from 'react';

type CatalogPageProps = {
  searchParams: Promise<{ q?: string; category?: string }>;
};

export default async function CatalogPage({
  searchParams,
}: CatalogPageProps): Promise<React.ReactNode> {
  const query = (await searchParams).q?.toLowerCase() ?? '';
  const category = (await searchParams).category;

  const cookieStore = await cookies();
  const cart: CartItem[] = JSON.parse(cookieStore.get('cart')?.value ?? '[]');

  // Next.js caches fetch() by default, so this CMS banner stays cheap to render.
  const bannerRes = await fetch(
    'https://jsonplaceholder.typicode.com/posts?_limit=1',
    { next: { revalidate: 60 } },
  );
  const banner = await bannerRes.json();

  const visibleProducts = products.filter((product) => {
    const matchesQuery = product.name.toLowerCase().includes(query);
    const matchesCategory = category ? product.category === category : true;
    return matchesQuery && matchesCategory;
  });

  // noStore();

  return (
    <div>
      <div className="mb-6 rounded border border-gray-200 p-4">
        <p className="text-sm text-gray-500">From the merchandising feed</p>
        <p className="font-medium">{banner[0].title}</p>
        <p className="text-sm">Items in cart: {cart.length}</p>
      </div>

      <h1 className="mb-4 text-3xl font-semibold">Catalog</h1>
      <Suspense fallback={<p>Loading filters…</p>}>
        <SearchFilters />
      </Suspense>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {visibleProducts.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </div>
  );
}
