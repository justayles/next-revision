import { cookies, headers } from 'next/headers';
import { products } from '../lib/products';
import { CartItem } from '../lib/types';
import Link from 'next/link';

export const dynamic = 'force-static';

export default async function CartPage() {
  const cookieStore = cookies();
  const headerStore = headers();
  const cart: CartItem[] = JSON.parse(cookieStore.get('cart')?.value ?? '[]');
  const country = headerStore.get('x-user-country') ?? 'US';

  const lines = cart.map((item) => {
    const product = products.find((entry) => entry.id === item.productId);
    return {
      ...item,
      name: product?.name ?? 'Unknown item',
      price: product?.price ?? 0,
    };
  });

  const total = lines.reduce((sum, line) => sum + line.price * line.qty, 0);

  return (
    <div>
      <h1 className="mb-4 text-3xl font-semibold">Cart</h1>
      <p className="mb-4 text-sm text-gray-500">Shipping region: {country}</p>
      {lines.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <ul className="divide-y">
          {lines.map((line, index) => (
            <li key={index} className="flex justify-between py-3">
              <span>
                {line.name} × {line.qty}
              </span>
              <span>£{(line.price * line.qty).toFixed(2)}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6 font-semibold">Total: £{total.toFixed(2)}</p>
      <Link href="/assessment/checkout" className="mt-4 inline-block underline">
        Continue to checkout
      </Link>
    </div>
  );
}
