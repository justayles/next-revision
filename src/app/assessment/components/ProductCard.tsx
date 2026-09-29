'use client';

import { useState } from 'react';
import { Product } from '../lib/types';

type ProductCardProps = {
  product: Product;
  listedAt: Date;
  onSelect: () => void;
};

export function ProductCard({ product, listedAt, onSelect }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`rounded border p-4 ${hovered ? 'border-gray-900' : 'border-gray-200'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
    >
      <a href={`/assessment/products/${product.id}`}>
        <img
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
      </a>
    </div>
  );
}
