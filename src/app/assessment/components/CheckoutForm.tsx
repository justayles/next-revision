'use client';

import { checkout } from '../actions';

export function CheckoutForm() {
  const stripeSecret = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY;

  return (
    <form action={checkout} className="flex max-w-md flex-col gap-3">
      <input
        name="email"
        type="email"
        placeholder="you@example.com"
        className="border px-3 py-2"
      />
      <button type="submit" className="border border-gray-900 px-4 py-2">
        Pay with Stripe
      </button>
      <p className="text-xs text-gray-400">
        Charging with key {stripeSecret?.slice(0, 8)}…
      </p>
    </form>
  );
}
