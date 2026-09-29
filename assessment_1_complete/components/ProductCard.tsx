'use client';

import { useState } from 'react';
import { Product } from '../lib/types';
import Image from 'next/image';
import Link from 'next/link';

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);

  const listedAt = new Date();
  const onSelect = () => console.log('selected', product.id);

  return (
    <div
      className={`rounded border p-4 ${hovered ? 'border-gray-900' : 'border-gray-200'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
    >
      <Link href={`/assessment/products/${product.id}`}>
        <Image
          width={640}
          height={420}
          src={product.image}
          alt={product.name}
          className="mb-3 h-40 w-full rounded object-cover"
        />
        <h2 className="text-lg font-semibold">{product.name}</h2>
        <p className="text-sm text-gray-500">{product.category}</p>
        <p className="mt-2 font-medium">£{product.price.toFixed(2)}</p>
        <p className="mt-1 text-xs text-gray-400">
          Listed {listedAt.toLocaleDateString()}
        </p>
        {product.stock === 0 && (
          <p className="mt-2 text-sm text-red-600">Out of stock</p>
        )}
      </Link>
    </div>
  );
}
