# Practice PR 2: TaskFlow board, tasks, and tests

Treat `src/app/assessment2` as a pull request from a developer who last used **Next.js 14** and **React 18**.

The PR claims to add:

- a task board with search and priority filters (`/assessment2`)
- a task detail page, an edit page, and a "new task" form
- optimistic "mark as done" toggling and an admin-only delete button
- a small activity feed
- Route Handlers under `api/tasks` and `api/activity`
- unit tests written with **Jest** and **React Testing Library**

Your job is the same as the assessment: **review the PR, list the issues, and say what should be fixed**. Do not rewrite the whole app unless you want extra practice after the review.

## How to practice

1. Do **not** open `PRACTICE_ANSWERS_2.md` yet.
2. Read the TaskFlow code as if it were someone else's PR. Read the `__tests__` folder too. Tests are code under review.
3. Write your review notes: file, what is wrong, why it matters, and how you would fix it.
4. Optionally run `npm run dev` and click through `/assessment2`. Some screens will fail. That is intentional.
5. Optionally run the PR's tests with `npm run test:practice`. (`npm test` skips this folder on purpose.) Some fail, some pass for the wrong reasons, and some will only fail later, for example tomorrow.
6. Compare your notes with `PRACTICE_ANSWERS_2.md`.

## Scope

Focus on **Next.js 15 App Router** and **React 19**:

- async `params` / `searchParams` / `cookies()`, including in Route Handlers
- Server Components vs Client Components, and what may cross the boundary
- Server Actions: exports, signatures, authorization, revalidation
- `use()`, `useOptimistic`, `useActionState`, form reset behavior
- caching, `revalidatePath` / `revalidateTag`
- hydration, `next/image`, metadata
- security: XSS and over-sharing data with the client

And on **testing**:

- RTL query priority and testing behavior instead of implementation
- async user interaction (`userEvent`, `findBy*`, `waitFor`)
- mocking `next/navigation` and Server Actions
- fake timers and time-dependent tests
- tests that pass without proving anything

There are also a few things that look unusual but are **valid** in Next.js 15 / React 19. Do not flag everything.

## Suggested time

Spend 35 to 50 minutes on the review, the way you would on a timed assessment, then check the answer key.
