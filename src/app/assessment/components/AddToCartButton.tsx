'use client';

import { useRef, useState } from 'react';
import { addToCart } from '../actions';
import { QuantityInput } from './QuantityInput';

export function AddToCartButton({ productId }: { productId: string }) {
  const qtyRef = useRef<HTMLInputElement>(null);
  const [lastAdded, setLastAdded] = useState(
    typeof window === 'undefined' ? null : localStorage.getItem('lastAdded'),
  );
  const renderedAt = new Date().toLocaleTimeString();

  function handleAdd() {
    const qty = Number(qtyRef.current?.value ?? 1);
    addToCart(productId, qty);
    localStorage.setItem('lastAdded', productId);
    setLastAdded(productId);
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-gray-400">Button rendered at {renderedAt}</p>
      <QuantityInput
        ref={qtyRef}
        label="Quantity"
        type="number"
        min={1}
        defaultValue={1}
        name="qty"
      />
      <button
        type="button"
        onClick={handleAdd}
        className="border border-gray-900 px-4 py-2"
      >
        Add to cart
      </button>
      {lastAdded && (
        <p className="text-xs text-gray-500">Last added product: {lastAdded}</p>
      )}
    </div>
  );
}
