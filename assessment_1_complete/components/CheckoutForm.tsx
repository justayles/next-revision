'use client';

import { useActionState } from 'react';
import { checkout } from '../actions';

export function CheckoutForm() {
  const [state, formAction, isPending] = useActionState(checkout, {
    error: null,
  });
  //  const stripeSecret = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY;

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-3">
      <input
        name="email"
        type="email"
        placeholder="you@example.com"
        className="border px-3 py-2"
      />
      {state.error && <p className="text-red-500">{state.error}</p>}
      <button type="submit" className="border border-gray-900 px-4 py-2">
        {isPending ? 'Paying with Stripe...' : 'Pay with Stripe'}
      </button>
      {/* <p className="text-xs text-gray-400">
        Charging with key {stripeSecret?.slice(0, 8)}…
      </p> */}
    </form>
  );
}
