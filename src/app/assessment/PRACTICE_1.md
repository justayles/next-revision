# Practice PR: ShopLite catalog, reviews, and cart

Treat `src/app/assessment` and `src/app/api/assessment` as a pull request from a developer who last used **Next.js 14** and **React 18**.

The PR claims to add:

- a product catalog with search and category filters
- product detail pages with reviews and add-to-cart
- a cookie-based cart and checkout flow
- a reviews API route

Your job is the same as the assessment: **review the PR, list the issues, and say what should be fixed**. Do not rewrite the whole app unless you want extra practice after the review.

## How to practice

1. Do **not** open `PRACTICE_ANSWERS.md` yet.
2. Read the ShopLite code as if it were someone else's PR.
3. Write your review notes: file, what is wrong, why it matters, and how you would fix it.
4. Optionally run `npm run dev` and click through `/assessment`. Some screens will fail; that is intentional.
5. Compare your notes with `PRACTICE_ANSWERS.md`.

## Scope

Focus on **Next.js 15 App Router** and **React 19**:

- async `params` / `searchParams` / `cookies()` / `headers()`
- Server Components vs Client Components
- Server Actions, forms, and cache revalidation
- hydration, `use()`, `useOptimistic`, `useFormStatus`, `useActionState`
- Route Handlers, `next/image`, `next/link`, `next/navigation`

There are also a few things that look unusual but are **valid** in Next.js 15 / React 19. Do not flag everything.

## Suggested time

Spend 25–40 minutes on the review, the way you would on a timed assessment, then check the answer key.
