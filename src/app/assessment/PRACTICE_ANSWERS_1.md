# Practice PR answer key

Use this only after you have written your own review. Issue numbers are for scoring, not severity order. If you caught the underlying problem with different wording, count it.

---

## 1. `params` and `searchParams` are Promises in Next.js 15 YES

**Where:** `src/app/assessment/page.tsx`, `src/app/assessment/products/[id]/page.tsx`

They are typed and used as plain objects:

```ts
searchParams: { q?: string; category?: string }
params: { id: string }
```

In Next.js 15 both are Promises. You must type them as `Promise<...>` and `await` them in the page **and** in `generateMetadata`.

```ts
type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: ProductPageProps) {
  const { id } = await params;
  const product = getProduct(id);
  return { title: product ? `${product.name} · ShopLite` : 'Product · ShopLite' };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  // ...
}
```

Same pattern for `searchParams` on the catalog page.

---

## 2. `cookies()` and `headers()` are async in Next.js 15 YES

**Where:** `src/app/assessment/page.tsx`, `src/app/assessment/cart/page.tsx`, `src/app/assessment/actions.ts`

`cookies()` and `headers()` from `next/headers` return Promises now. This is invalid:

```ts
const cookieStore = cookies();
cookieStore.get('cart');
```

Fix:

```ts
const cookieStore = await cookies();
const headerStore = await headers();
```

That applies in Server Components **and** Server Actions, including `cookieStore.set` / `delete`.

---

## 3. `redirect()` inside `try/catch` YES

**Where:** `src/app/assessment/actions.ts` (`addReview`, `checkout`)

`redirect()` throws a special Next.js error (`NEXT_REDIRECT`). Catching all errors swallows the redirect, so the user never navigates and may see a fake failure instead.

Fix: do not wrap `redirect()` in a broad `try/catch`. Validate first, then redirect outside the catch, or rethrow if `error.digest` starts with `NEXT_REDIRECT`.

```ts
export async function checkout(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) {
    return { error: 'Email is required' };
  }

  const cookieStore = await cookies();
  cookieStore.delete('cart');
  redirect('/assessment/checkout/success');
}
```

---

## 4. Mutations never revalidate the cache MAYBE

**Where:** `addReview`, `addToCart`, `checkout` in `src/app/assessment/actions.ts`

After writing a cookie or a review, the actions never call `revalidatePath` or `revalidateTag`. Catalog cart counts, product reviews, and the cart page can stay stale.

```ts
import { revalidatePath } from 'next/cache';

revalidatePath('/assessment');
revalidatePath('/assessment/cart');
revalidatePath(`/assessment/products/${productId}`);
```

---

## 5. Unsafe `FormData` handling

**Where:** `src/app/assessment/actions.ts`

`formData.get('author') as string` lies to TypeScript. `get` returns `FormDataEntryValue | null`. Empty reviews, missing ids, `NaN` quantities, and negative qty can all get through.

Validate, trim, and return an error state instead of asserting.

---

## 6. In-memory `reviews.push` will not hold up

**Where:** `src/app/assessment/actions.ts`, `src/app/api/assessment/reviews/route.ts`

Mutating a module-level array looks like it works in local dev and then fails in production (serverless instances, HMR, multiple workers). Reviews need a real store (database, KV, etc.).

---

## 7. Missing `'use client'` on a context provider that uses state YES

**Where:** `src/app/assessment/components/ThemeProvider.tsx`

`useState` / `useContext` only work in Client Components. This provider is imported from a Server Component layout with no `'use client'` directive, so the assessment layout should fail.

Add `'use client'` at the top of `ThemeProvider.tsx`.

---

## 8. `error.tsx` is a Client Component API YES

**Where:** `src/app/assessment/error.tsx`

Special file `error.tsx` must start with `'use client'`. It should also accept and use `reset` so the user can retry.

```tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button type="button" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
```

---

## 9. Event handler on a Server Component YES

**Where:** `src/app/assessment/components/ShareButton.tsx`

There is no `'use client'`, but the button passes `onClick`. Server Components cannot attach event handlers. Mark it as a Client Component, or use a tiny client child for the click.

---

## 10. Non-serializable function passed Server → Client YES

**Where:** `src/app/assessment/page.tsx` → `ProductCard`

```tsx
<ProductCard
  onSelect={() => console.log('selected', product.id)}
/>
```

Client Component props must be serializable. A closure created in a Server Component is not. Remove `onSelect`, handle the click inside the client component, or pass a Server Action.

`listedAt={new Date()}` is less serious: Dates are supported over the RSC payload. The function prop is the one that should fail the build.

---

## 11. `useSearchParams()` without a Suspense boundary NO

**Where:** `src/app/assessment/page.tsx` renders `<SearchFilters />` with no `<Suspense>`

`useSearchParams()` should be wrapped in `Suspense` or the page bails out of static rendering and Next may show a deopt warning/error.

```tsx
import { Suspense } from 'react';

<Suspense fallback={<p>Loading filters…</p>}>
  <SearchFilters />
</Suspense>
```

---

## 12. `useRouter` imported from `next/router` NO

**Where:** `src/app/assessment/components/SearchFilters.tsx`

`next/router` is the Pages Router API. App Router code must use `next/navigation`.

```ts
import { useRouter, useSearchParams } from 'next/navigation';
```

---

## 13. `useFormState` was renamed to `useActionState` MAYBE

**Where:** `src/app/assessment/components/ReviewForm.tsx`

In React 19 the hook is `useActionState` from `react` (third value is `isPending`). `useFormState` from `react-dom` is the old name.

```ts
import { useActionState, useOptimistic } from 'react';

const [state, formAction, isPending] = useActionState(addReview, initialState);
```

---

## 14. `useFormStatus` used in the same component as the `<form>` YES

**Where:** `src/app/assessment/components/ReviewForm.tsx`

`useFormStatus` only sees the parent `<form>`. Called in the component that *renders* the form, `pending` is always `false`, so the button never shows `"Saving…"`.

Move it into a child:

```tsx
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Saving…' : 'Add review'}
    </button>
  );
}
```

If you switch to `useActionState`, you can use the returned `isPending` instead.

---

## 15. `useOptimistic` mutates the current array NO

**Where:** `src/app/assessment/components/ReviewForm.tsx`

```ts
(current, next: Review) => {
  current.push(next);
  return current;
}
```

React state must be treated as immutable. `push` mutates the existing array and can skip the optimistic render. Return a new array:

```ts
(current, next: Review) => [...current, next]
```

Using `key={index}` on those reviews is a weaker follow-up: temporary and real reviews can collide. Prefer `review.id` and a unique temp id.

---

## 16. `use()` after an early return — **not a bug** YES

**Where:** `src/app/assessment/components/RelatedProducts.tsx`

```tsx
if (!show) return <p>…</p>;
const related = use(relatedPromise);
```

This looks like a Rules of Hooks violation. It is not. Despite the name, `use` is a React 19 **API**, not a Hook. The React 19 release notes explicitly allow calling it in `if`s, loops, and **after an early return** (that is the reason `use(Context)` exists alongside `useContext`).

Real restrictions still apply:

- Call it only during render, in a Component or a custom Hook.
- Do not wrap it in `try/catch` (use an Error Boundary).
- Do not skip `use(promise)` by reading `promise.status` / `promise.value` yourself.

Passing the Promise from a Server Component into a Client Component and reading it with `use()` is the intended pattern.

---

## 17. Product page never handles a missing id MAYBE

**Where:** `src/app/assessment/products/[id]/page.tsx`

`getProduct` can return `undefined`, then `product.category` throws. Call `notFound()` from `next/navigation` when there is no product. Add `not-found.tsx` if you want a custom UI.

---

## 18. Hydration mismatch in `AddToCartButton` NO

**Where:** `src/app/assessment/components/AddToCartButton.tsx`

Two render-time values that differ on server vs client:

- `useState(typeof window === 'undefined' ? null : localStorage.getItem('lastAdded'))` avoids crashing SSR but still hydrates with a different first client value.
- `new Date().toLocaleTimeString()` during render.

Read `localStorage` in `useEffect`. Do not render `Date.now()` / `toLocaleTimeString()` during render unless you accept a mismatch or `suppressHydrationWarning` for a tiny timestamp.

---

## 19. Add to cart is a fire-and-forget client click NO

**Where:** `src/app/assessment/components/AddToCartButton.tsx`

The Server Action is not awaited, has no pending state, no error UI, and no `useTransition`. Clicks can race and failures are silent.

```tsx
const [isPending, startTransition] = useTransition();

startTransition(async () => {
  await addToCart(productId, qty);
});
```

Also validate `qty` (`Number` can be `NaN`).

---

## 20. Cart page forces static while reading request data YES

**Where:** `src/app/assessment/cart/page.tsx`

```ts
export const dynamic = 'force-static';
```

This conflicts with `cookies()` and `headers()`. The cart cannot be static per user. Remove `force-static` and await `cookies()` / `headers()`.

`key={index}` on cart lines is a smaller issue if rows can be removed later.

---

## 21. Stripe secret exposed as a public env var MAYBE

**Where:** `src/app/assessment/components/CheckoutForm.tsx`

`NEXT_PUBLIC_STRIPE_SECRET_KEY` ships to the browser. Secret keys stay on the server (Server Action, Route Handler). Publishable keys are the only Stripe keys that belong on the client, and they are not secret.

The form also ignores the object `checkout` returns, so `{ error: 'Email is required' }` never appears unless you use `useActionState`.

Keep the secret in a server-only env var (`STRIPE_SECRET_KEY`, no `NEXT_PUBLIC_` prefix) and use it inside the Server Action. The client form should only submit and display the action state:

```tsx
'use client';

import { useActionState } from 'react';
import { checkout } from '../actions';

export function CheckoutForm() {
  const [state, formAction, isPending] = useActionState(checkout, {
    error: null,
  });

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-3">
      <input
        name="email"
        type="email"
        placeholder="you@example.com"
        className="border px-3 py-2"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button type="submit" disabled={isPending} className="border border-gray-900 px-4 py-2">
        {isPending ? 'Paying…' : 'Pay with Stripe'}
      </button>
    </form>
  );
}
```

```ts
'use server';

export async function checkout(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) {
    return { error: 'Email is required' };
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    return { error: 'Checkout is not configured' };
  }

  // Charge on the server with stripeSecret. Never pass this to the client.

  const cookieStore = await cookies();
  cookieStore.delete('cart');
  revalidatePath('/assessment');
  revalidatePath('/assessment/cart');
  redirect('/assessment/checkout/success');
}
```

`checkout` must take the `prevState` + `formData` signature for `useActionState`. If you only need Stripe.js in the browser, that is `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, not a secret key.

---

## 22. Wrong fetch-cache mental model (Next.js 15) NO

**Where:** `src/app/assessment/page.tsx`

The comment says fetch is cached by default. **In Next.js 15, `fetch` is uncached by default.** If you want caching, opt in:

```ts
fetch(url, { next: { revalidate: 60 } })
// or
fetch(url, { cache: 'force-cache' })
```

`unstable_noStore()` is also called *after* the fetch, so it does not change that request. For “this page is dynamic”, prefer awaiting `cookies()` / `connection()` at the top, or a cache option on the fetch itself. `unstable_noStore` is legacy; newer code uses `connection()` from `next/server` when you only need to opt into dynamic rendering.

---

## 23. Route Handler uses a default export NO

**Where:** `src/app/api/assessment/reviews/route.ts`

App Router handlers must be **named** exports: `GET`, `POST`, etc.

```ts
export async function GET() {
  return Response.json(reviews);
}
```

`export default async function GET()` will not be wired up as the GET handler.

In Next.js 15, GET Route Handlers are also not cached by default (another Next 14 assumption that no longer holds).

---

## 24. `<a>` and `<img>` instead of App Router primitives NO

**Where:** `src/app/assessment/components/ProductCard.tsx`

Internal navigation should use `next/link` (prefetch, client transitions). Images should use `next/image` (sizing, lazy loading, remotePatterns in `next.config.ts`). These are still fair PR comments even if they are not 15-only.

---

## Scoring

- **18–24 issues:** you are in good shape for a Next 15 / React 19 review.
- **12–17:** revisit async request APIs, Server vs Client boundaries, and form hooks.
- **Under 12:** walk the answer key file by file, then review the PR again from scratch.

---

## Red herrings — valid in Next.js 15 / React 19

Do not treat these as bugs:

1. **`ref` on `QuantityInput` without `forwardRef`.** React 19 passes `ref` as a normal prop. Spreading `...props` onto `<input>` is correct.
2. **Client Components importing Server Actions** (`addToCart`, `addReview`, `checkout`). That is supported.
3. **Async Server Components** (`CatalogPage`, `ProductPage`, `CartPage`).
4. **Passing a Promise into a Client Component** (`relatedPromise`) and reading it with `use()`, including after `if (!show) return …`. `use` is not a Hook, so this is allowed.
5. **`loading.tsx`** in the assessment folder is a valid special file.
6. **`checkout/success/page.tsx`** is fine; it is unused because `redirect()` is swallowed, not because the page is wrong.

---

## Extra credit (existing app, outside ShopLite)

The root layout still has two nits you may also see in real PRs:

- `import Link from 'next/dist/client/link'` should be `next/link`
- `className="w-fullmb-8"` is a missing space (`w-full mb-8`)
