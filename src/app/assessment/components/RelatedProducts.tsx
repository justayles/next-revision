'use client';

import { use } from 'react';
import { Product } from '../lib/types';
import Link from 'next/link';

export function RelatedProducts({
  relatedPromise,
  show,
}: {
  relatedPromise: Promise<Product[]>;
  show: boolean;
}) {
  if (!show) {
    return <p className="text-sm text-gray-500">Related products hidden while out of stock.</p>;
  }

  const related = use(relatedPromise);

  if (related.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">Related products</h2>
      <ul className="flex flex-wrap gap-3">
        {related.map((product) => (
          <li key={product.id}>
            <Link className="underline" href={`/assessment/products/${product.id}`}>
              {product.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
