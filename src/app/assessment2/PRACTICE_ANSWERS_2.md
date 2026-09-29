# Practice PR 2 answer key

Use this only after you have written your own review. Issue numbers are for scoring, not severity order. If you caught the underlying problem with different wording, count it.

- Issues **1 to 19** are Next.js 15 / React 19 / general web issues.
- Issues **20 to 24** are Jest and React Testing Library issues in `__tests__`.

Some bugs hide behind others. For example, issue 11 only shows up after issue 9 is fixed. That is normal in a real PR.

---

## 1. `params` and `searchParams` are Promises in Next.js 15 YES

**Where:** `src/app/assessment2/page.tsx`, `src/app/assessment2/tasks/[id]/page.tsx` (both `generateMetadata` and the page)

```ts
type BoardPageProps = { searchParams: { q?: string; priority?: string } };
type TaskPageProps = { params: { id: string } };
```

In Next.js 15 both are Promises. Next 15 still lets you read them synchronously for now, but only through a compatibility shim that logs a dev warning and will be removed. The generated route types (checked by `next build`) already expect a Promise, so the build fails on the type mismatch.

Why the change: it lets Next start rendering and streaming before it knows the request-specific values.

```tsx
type BoardPageProps = {
  searchParams: Promise<{ q?: string; priority?: string }>;
};

export default async function BoardPage({ searchParams }: BoardPageProps) {
  const { q = '', priority } = await searchParams;
  // ...
}
```

```tsx
type TaskPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: TaskPageProps) {
  const { id } = await params;
  const task = await getCachedTask(id);
  return { title: task ? `${task.title} · TaskFlow` : 'Task · TaskFlow' };
}

export default async function TaskPage({ params }: TaskPageProps) {
  const { id } = await params;
  // ...
}
```

Remember `generateMetadata`. It is easy to fix the page and forget it.

---

## 2. Route Handler `params` and `cookies()` are async too YES

**Where:** `src/app/assessment2/api/tasks/[id]/route.ts`

```ts
{ params }: { params: { id: string } }   // should be a Promise
const cookieStore = cookies();           // should be awaited
```

The second argument of a Route Handler (the "context") gets the same treatment as page props: `params` is a Promise. `cookies()` and `headers()` from `next/headers` are async as well. People fix pages and forget Route Handlers, Server Actions, and `layout.tsx`.

```ts
import { cookies } from 'next/headers';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await deleteTaskRecord(id);
  return new Response(null, { status: 204 });
}
```

(This handler also has an authorization problem. See issue 5.)

---

## 3. `async` Client Component

**Where:** `src/app/assessment2/tasks/[id]/edit/page.tsx`

```tsx
'use client';

export default async function EditTaskPage({ params }: { params: Promise<...> }) {
  const { id } = await params;
  const task = await getTask(id);
```

Only Server Components can be `async`. Next reports: `async/await is not yet supported in Client Components`. This file also has a second problem: it imports `getTask` (server data access) into a Client Component, which would put your data layer in the browser bundle.

The mistake usually happens because the author added `'use client'` "just in case". Keep pages as Server Components and only push `'use client'` down to the leaf that needs state or events.

**Fix A (preferred):** remove `'use client'` and keep the page async on the server. Move interactive parts into a small client component.

```tsx
// no 'use client'
export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const task = await getTask(id);
  if (!task) notFound();

  return <EditTaskForm task={{ id: task.id, title: task.title }} />;
}
```

**Fix B (if the page truly must be a Client Component):** unwrap the Promise with React 19's `use()`.

```tsx
'use client';

import { use } from 'react';

export default function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  // fetch data through a Server Action, a route handler, or a promise passed from a parent Server Component
}
```

---

## 4. A `'use server'` file may only export async functions

**Where:** `src/app/assessment2/actions.ts`

```ts
'use server';

export const MAX_TITLE_LENGTH = 80;   // not allowed
```

Every export from a `'use server'` module becomes a public Server Action endpoint. Next enforces this at build time: `Only async functions are allowed to be exported in a "use server" file.` Constants, sync helpers, and classes cannot be exported.

(Types are fine, they disappear at compile time.)

**Fix:** move shared values to a normal module and import it from both the action and the form.

```ts
// lib/constants.ts
export const MAX_TITLE_LENGTH = 80;
```

```ts
// actions.ts
'use server';

import { MAX_TITLE_LENGTH } from './lib/constants';
```

You can keep using a non-exported `const` inside the actions file.

---

## 5. Server Actions and Route Handlers need their own authorization

**Where:** `deleteTask` in `src/app/assessment2/actions.ts`, `TaskCard.tsx`, and `DELETE` in `api/tasks/[id]/route.ts`

The Delete button is only rendered when `user?.role === 'admin'`, and the action itself checks nothing:

```ts
export async function deleteTask(id: string) {
  await deleteTaskRecord(id);
  revalidatePath('/assessment2');
}
```

A Server Action is just a public HTTP `POST` endpoint with a generated id. Hiding the button is UI, not security. Anyone can replay the request with any task id. Contrast with `createTask`, which does call `getCurrentUser()`. The inconsistency is the tell.

The `DELETE` route handler is the same story. It only checks that a `userId` cookie exists, not who the user is or what they may do.

```ts
export async function deleteTask(id: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  const task = await getTask(id);
  if (!task) {
    return { error: 'Task not found' };
  }
  if (user.role !== 'admin' && task.ownerId !== user.id) {
    return { error: 'Forbidden' };
  }

  await deleteTaskRecord(id);
  revalidatePath('/assessment2');
  return { error: null };
}
```

Also: a plain `userId` cookie can be edited by the user. Real sessions use a signed or encrypted cookie (or a session store) so the server can trust it. Check auth in a data-access layer that every action and handler calls, not scattered in UI conditions.

---

## 6. A Server Component fetching its own Route Handler with a relative URL

**Where:** `src/app/assessment2/page.tsx`

```ts
const res = await fetch('/assessment2/api/tasks');
```

Two problems:

1. Server-side `fetch` needs an absolute URL. This throws `TypeError: Failed to parse URL from /assessment2/api/tasks`. The relative path only works in the browser.
2. Even with an absolute URL, it is an unnecessary network hop. The Server Component already runs on the server and can call the same data function that the handler uses. At build time, the app is not even running to answer that request.

```tsx
import { getTasks } from './lib/tasks';

const tasks = await getTasks();
```

Use Route Handlers for external consumers (mobile apps, webhooks, browser `fetch` from client code), not for server-to-server calls inside the same app.

---

## 7. Cached data with a tag that is never revalidated

**Where:** `getCachedTask` in `lib/tasks.ts`, used by `tasks/[id]/page.tsx`. `toggleTask` in `actions.ts`.

```ts
export const getCachedTask = unstable_cache(
  async (id: string) => getTask(id),
  ['task'],
  { tags: ['tasks'] },
);
```

`unstable_cache` stores the result in the Data Cache. `toggleTask` updates the record and then does nothing else, so the detail page keeps showing `Status: Open` until the cache entry expires (never, since no `revalidate` time is set). Every mutation must invalidate what it changed.

```ts
import { revalidatePath, revalidateTag } from 'next/cache';

export async function toggleTask(id: string, done: boolean) {
  await updateTaskDone(id, done);
  revalidateTag('tasks');
  revalidatePath('/assessment2');
}
```

Related Next.js 15 mindset: nothing is cached unless you opt in (see the note on `fetch` defaults in the first practice PR). If you add a cache, you own its invalidation.

---

## 8. `useOptimistic` update outside a transition

**Where:** `src/app/assessment2/components/TaskToggle.tsx`

```tsx
async function handleClick() {
  setOptimisticDone(!optimisticDone);   // called from a plain event handler
  await toggleTask(id, !done);
}
```

Optimistic updates are only valid inside an **Action**: a function passed to `startTransition`, a `<form action>`, or an `useActionState` action. Outside one, React logs `An optimistic state update occurred outside a transition or action` and the optimistic value is dropped right away, so the UI does not change until the server responds.

Fix: wrap the work in `startTransition`.

```tsx
'use client';

import { startTransition, useOptimistic } from 'react';
import { toggleTask } from '../actions';

export function TaskToggle({ id, done }: { id: string; done: boolean }) {
  const [optimisticDone, setOptimisticDone] = useOptimistic(done);

  function handleClick() {
    startTransition(async () => {
      setOptimisticDone(!done);
      await toggleTask(id, !done);
    });
  }

  return (
    <button type="button" onClick={handleClick} aria-pressed={optimisticDone}>
      {optimisticDone ? 'Mark as open' : 'Mark as done'}
    </button>
  );
}
```

Two more details:

- Compute the optimistic value from the **real** prop (`!done`), not from optimistic state. Fast double clicks otherwise read a value that is about to be reverted.
- When the transition finishes, React throws the optimistic value away and shows the real `done` prop. The real prop only changes if the server data was revalidated (issue 7).

You could also use `useTransition` to get an `isPending` flag for disabling the button.

---

## 9. Wrong Server Action signature for `useActionState`

**Where:** `createTask` in `actions.ts` and `NewTaskForm.tsx`

```ts
export async function createTask(formData: FormData): Promise<ActionState> { ... }

const [state, formAction] = useActionState(createTask, { error: null });
```

`useActionState(action, initialState)` calls `action(previousState, formData)`. The previous state comes **first**. Here `formData` would actually be `{ error: null }`, so `formData.get` throws `TypeError: formData.get is not a function`. TypeScript also complains about the mismatch.

```ts
export async function createTask(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // ...
}
```

The form's `action={formAction}` passes the `FormData` automatically as the second argument.

---

## 10. React 19 resets uncontrolled forms after an action

**Where:** `src/app/assessment2/components/NewTaskForm.tsx`

Once issue 9 is fixed, submitting an empty or too-long title shows the error message, but React 19 **resets the form after a function action completes**. The user's description and priority are wiped. This is a deliberate React 19 change (it matches what a native form post does) and surprises many people.

Fix: return the submitted values from the action and feed them back in through `defaultValue`.

```ts
// actions.ts
export async function createTask(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const values = {
    title: String(formData.get('title') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    priority: String(formData.get('priority') ?? 'medium'),
  };

  if (!values.title) {
    return { error: 'Title is required', values };
  }
  // ...
}
```

```tsx
// NewTaskForm.tsx
<input
  id={`${id}-title`}
  name="title"
  defaultValue={state.values?.title}
/>
<textarea
  id={`${id}-description`}
  name="description"
  defaultValue={state.values?.description}
/>
<select
  name="priority"
  defaultValue={state.values?.priority ?? 'medium'}
>
```

Alternatives are controlled inputs, or a client-side check before calling the action. Also validate `priority` against the allowed values instead of casting with `as Priority`.

---

## 11. Derived state copied into state with `useEffect`

**Where:** `src/app/assessment2/components/FilterBar.tsx`

```tsx
const [openCount, setOpenCount] = useState(0);

useEffect(() => {
  setOpenCount(tasks.filter((task) => !task.done).length);
}, [tasks]);
```

`openCount` can be calculated from `tasks` during render. The effect version renders once with `0` (also in the server HTML), then re-renders with the real number. That causes a visible flicker and an extra render pass, and it is easy to get out of sync.

```tsx
const openCount = tasks.filter((task) => !task.done).length;
```

Use `useMemo` only if the calculation is measurably expensive. "You might not need an effect" is one of the most common React review comments. Effects are for synchronizing with things outside React.

---

## 12. Hydration mismatch: random ids and locale-dependent dates

**Where:** `src/app/assessment2/components/TaskCard.tsx`, `lib/format.ts`

Client Components are still rendered on the server first, then hydrated. The output must match.

```tsx
const descriptionId = `description-${Math.random().toString(36).slice(2)}`;
...
Due {formatDueDate(task.dueDate)}   // new Date(...).toLocaleDateString()
```

- `Math.random()` produces a different id on the server and in the browser, so the `id` and `aria-describedby` attributes mismatch. Use React's `useId()`, which is stable across server and client. It is also what `NewTaskForm` correctly uses.
- `toLocaleDateString()` with no arguments uses the runtime's locale **and time zone**. The server might be `en-US` in UTC and the browser `en-GB` in another zone. `'2026-10-02'` is parsed as UTC midnight, so users west of UTC can see the previous day too.

```tsx
import { useId } from 'react';

const descriptionId = useId();
```

```ts
export function formatDueDate(dueDate: string): string {
  return new Date(dueDate).toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
```

If you really need the user's local format, render it after mount (`useEffect` plus state) or wrap the small timestamp in `suppressHydrationWarning`.

`isOverdue` uses `Date.now()` during render, which can also differ between the server render and hydration. It is a smaller risk here, but it is the same class of bug.

---

## 13. `next/image` with a host that is not allowed

**Where:** `src/app/assessment2/components/Avatar.tsx`, data in `lib/tasks.ts`, `next.config.ts`

`Avatar` loads `https://i.pravatar.cc/...`, but `next.config.ts` only allows `picsum.photos`. At runtime Next throws `Invalid src prop ... hostname "i.pravatar.cc" is not configured under images in your next.config.js`.

```ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
    ],
  },
};
```

Prefer `remotePatterns` over the deprecated `domains`, and make the pattern as specific as you can (`pathname`) so your server does not become an open image proxy. `width` and `height` are provided here, which is correct (a common miss is forgetting them or using `fill` inside a parent that is not positioned).

---

## 14. Server-only code imported into a Client Component

**Where:** `TaskCard.tsx` imports `getPriorityLabel` from `lib/tasks.ts`, and `lib/tasks.ts` contains database and cache code

```tsx
'use client';
import { getPriorityLabel } from '../lib/tasks';
```

`lib/tasks.ts` also reads `process.env.DATABASE_URL`, `ADMIN_API_TOKEN`, exports `dbConfig`, and imports `unstable_cache` from `next/cache`. Once a Client Component imports it, the **entire module** is pulled into the browser bundle.

What this means in practice:

- Non-`NEXT_PUBLIC_` env vars are not inlined into client code (they are `undefined` there), so secrets do not automatically leak. But real DB drivers and SDKs break the client build, bloat the bundle, and the next refactor that adds `NEXT_PUBLIC_` (or hard-codes a value) leaks for real.
- You will see this in tests too: importing `TaskCard` in jsdom crashes with `TextEncoder is not defined` because `next/cache` is loaded. The workaround `jest.mock('../lib/tasks')` in `TaskCard.test.tsx` hides a real architectural bug.

Fix: split the module and mark server code with `server-only`, which turns accidental client imports into a build error.

```bash
npm install server-only
```

```ts
// lib/tasks.server.ts
import 'server-only';
import { unstable_cache } from 'next/cache';
// getTasks, getTask, createTaskRecord, dbConfig, ...
```

```ts
// lib/priority.ts  (safe for both environments)
import type { Priority } from './types';

export function getPriorityLabel(priority: Priority) { /* ... */ }
```

```tsx
'use client';
import { getPriorityLabel } from '../lib/priority';
```

---

## 15. `metadata` exported from a Client Component

**Where:** `src/app/assessment2/tasks/new/page.tsx`

```tsx
'use client';

export const metadata: Metadata = { title: 'New task · TaskFlow' };
```

`metadata` and `generateMetadata` only work in Server Components. Next fails with `You are attempting to export "metadata" from a component marked with "use client", which is disallowed.` The page has no state or events of its own (`NewTaskForm` is already a Client Component), so `'use client'` should not be there at all.

```tsx
import type { Metadata } from 'next';
import { NewTaskForm } from '../../components/NewTaskForm';

export const metadata: Metadata = { title: 'New task · TaskFlow' };

export default function NewTaskPage() {
  return (
    <div>
      <h1 className="mb-4 text-3xl font-semibold">New task</h1>
      <NewTaskForm />
    </div>
  );
}
```

---

## 16. `use()` with a Promise created during render

**Where:** `src/app/assessment2/components/ActivityFeed.tsx`

```tsx
const items = use(fetch('/assessment2/api/activity').then((res) => res.json()));
```

Every render creates a **new** Promise. `use()` suspends on it, React retries the render, a new Promise is created, and so on. React warns `A component was suspended by an uncached promise. Creating promises inside a Client Component or hook is not yet supported`, and the component never settles.

`use()` needs a Promise with a stable identity: one created outside the component, cached, or (best in Next) created in a **Server Component** and passed down.

```tsx
// page.tsx (Server Component)
import { getActivity } from './lib/tasks';

<Suspense fallback={<p className="mt-8">Loading activity…</p>}>
  <ActivityFeed activityPromise={getActivity()} />
</Suspense>
```

```tsx
// ActivityFeed.tsx
'use client';

import { use } from 'react';
import type { ActivityItem } from '../lib/types';

export function ActivityFeed({
  activityPromise,
}: {
  activityPromise: Promise<ActivityItem[]>;
}) {
  const items = use(activityPromise);
  // ...
}
```

Don't `await` the promise in the page, or the whole page waits and the Suspense boundary has no effect. Even simpler: make `ActivityFeed` an async Server Component that awaits `getActivity()` itself.

---

## 17. `revalidatePath` called during render

**Where:** `src/app/assessment2/page.tsx`

```tsx
if (tasks.some((task) => isOverdue(task.dueDate, task.done))) {
  revalidatePath('/assessment2');
}
```

`revalidatePath` and `revalidateTag` are for **mutations**: Server Actions and Route Handlers. Calling them while rendering throws `Route /assessment2 used "revalidatePath /assessment2" during render which is unsupported.` Even if it worked, a render that invalidates its own cache would be a loop and a side effect in render.

Fix: delete the call. The page already reads fresh data on each request. If overdue state must update on a schedule, use time-based revalidation (`revalidate` route segment config, `next: { revalidate }`, or a cron hitting a Route Handler that revalidates).

---

## 18. `dangerouslySetInnerHTML` with user content (XSS)

**Where:** `src/app/assessment2/components/TaskCard.tsx`, seed task `t3` in `lib/tasks.ts`

```tsx
<div dangerouslySetInnerHTML={{ __html: task.description }} />
```

Task descriptions are user input. Task `t3` contains `<img src="x" onerror="alert(document.cookie)" />`, which runs script in every viewer's session. React escapes text by default; `dangerouslySetInnerHTML` deliberately bypasses that.

Fix options:

```tsx
// Plain text: let React escape it
<p id={descriptionId} className="mt-3 text-sm">{task.description}</p>
```

If rich text is a real requirement, sanitize with an allow-list (`sanitize-html` on the server, or DOMPurify in the browser) or render a restricted Markdown subset, and add a Content-Security-Policy as defense in depth. Never sanitize with your own regex.

---

## 19. Passing entire database rows to Client Components

**Where:** `page.tsx` passes `task` to `TaskCard` and `tasks` to `FilterBar`. Type `Task` in `lib/types.ts`.

Everything passed as a prop to a Client Component is serialized into the RSC payload and delivered to the browser. `Task` includes `assigneeEmail`, `ownerId`, and `internalNotes` ("Big customer is threatening to churn"), and the client only needs id, title, description, priority, done, dueDate, and the assignee's name and avatar. The same problem exists in `GET /api/tasks`, which returns the full rows.

Fix: map to a minimal DTO on the server.

```ts
// lib/types.ts
export type TaskSummary = Pick<
  Task,
  'id' | 'title' | 'description' | 'priority' | 'done' | 'dueDate' | 'assigneeName' | 'assigneeAvatar'
>;

// lib/dto.ts
export function toTaskSummary(task: Task): TaskSummary {
  const { id, title, description, priority, done, dueDate, assigneeName, assigneeAvatar } = task;
  return { id, title, description, priority, done, dueDate, assigneeName, assigneeAvatar };
}
```

```tsx
<TaskCard task={toTaskSummary(task)} />
```

Server Components can read anything, but treat every prop that crosses the `'use client'` boundary as public. React also has experimental taint APIs (`experimental_taintObjectReference`) as a safety net, but the DTO is the real fix.

---

## 20. Testing implementation details instead of user-visible behavior

**Where:** `__tests__/NewTaskForm.test.tsx`

```tsx
const input = container.querySelector('input[name="title"]') as HTMLInputElement;
fireEvent.change(input, { target: { value: 'Ship it' } });
expect(input.value).toBe('Ship it');

expect(screen.getByTestId('submit-button').className).toContain('bg-black');
expect(container.querySelectorAll('option')).toHaveLength(3);
```

Problems:

- `container.querySelector` and `name` attributes are DOM details. If you rename the field or restyle the button, the test breaks even though nothing the user sees changed. It also never proves that the input has a label.
- `getByTestId` should be the last resort in the query priority list.
- Asserting a Tailwind class (`bg-black`) is a style test, not a behavior test.
- `fireEvent.change` skips the real sequence of focus, key presses, and input events. `userEvent` simulates a person.

RTL query priority: `getByRole` (with `name`), `getByLabelText`, `getByPlaceholderText`, `getByText`, `getByDisplayValue`, then `getByAltText`, `getByTitle`, and finally `getByTestId`. Queries that mirror how people and assistive tech find things double as accessibility checks.

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('lets the user type a title', async () => {
  const user = userEvent.setup();
  render(<NewTaskForm />);

  await user.type(screen.getByLabelText(/title/i), 'Ship it');

  expect(screen.getByLabelText(/title/i)).toHaveValue('Ship it');
});

it('renders an enabled submit button', () => {
  render(<NewTaskForm />);
  expect(screen.getByRole('button', { name: /create task/i })).toBeEnabled();
});

it('defaults the priority to medium', () => {
  render(<NewTaskForm />);
  expect(screen.getByLabelText(/priority/i)).toHaveDisplayValue('Medium');
  expect(screen.getAllByRole('option')).toHaveLength(3);
});
```

A stronger test would submit the form and assert that the mocked `createTask` was called with `(prevState, formData)`, or that a returned error appears via `screen.getByRole('alert')`.

---

## 21. Async interaction handled synchronously (`userEvent`, `waitFor`)

**Where:** `__tests__/TaskToggle.test.tsx`

```tsx
it('optimistically flips the label after a click', () => {
  const user = userEvent.setup();
  render(<TaskToggle id="1" done={false} />);

  user.click(screen.getByRole('button', { name: /mark as done/i }));   // not awaited

  expect(screen.getByRole('button', { name: /mark as open/i })).toBeInTheDocument();
});
```

```tsx
await waitFor(() => {
  fireEvent.click(screen.getByRole('button'));   // side effect inside waitFor
  expect(toggleTask).toHaveBeenCalledWith('1', true);
});
```

Problems:

- Every `userEvent` method in v14 returns a Promise. Without `await`, the assertion runs before the click has happened. The test either fails or, worse, passes by accident on a different code path.
- The test is `sync` (`() => {}`), so nothing waits for the follow-up render. Make it `async`.
- `waitFor` re-runs its callback until it stops throwing. A click inside it could fire many times. Put actions **outside** `waitFor`, put only assertions inside. Also use one assertion per `waitFor`, or prefer `findBy*`, which is `waitFor` plus `getBy*`.
- Use `getBy*` when the element must already be there, `findBy*` when it appears asynchronously, `queryBy*` to assert absence.
- The `console.error` about optimistic updates in the output is the app bug from issue 8, not a test problem.

There is a subtle gotcha even after the component is fixed: the optimistic value is discarded when the transition ends, and the `done` prop never changes in a unit test. If the mock resolves immediately, the label flips back before you can assert. Keep the action pending while you assert.

```tsx
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toggleTask } from '../actions';
import { TaskToggle } from '../components/TaskToggle';

jest.mock('../actions', () => ({ toggleTask: jest.fn() }));

it('optimistically flips the label while the action is pending', async () => {
  let finish!: () => void;
  jest.mocked(toggleTask).mockReturnValue(
    new Promise<void>((resolve) => {
      finish = resolve;
    }),
  );
  const user = userEvent.setup();
  render(<TaskToggle id="1" done={false} />);

  await user.click(screen.getByRole('button', { name: /mark as done/i }));

  expect(
    screen.getByRole('button', { name: /mark as open/i }),
  ).toBeInTheDocument();
  expect(toggleTask).toHaveBeenCalledWith('1', true);

  await act(async () => finish());   // let the transition finish before the test ends
});
```

---

## 22. `next/navigation` not mocked, and no mock hygiene

**Where:** `__tests__/FilterBar.test.tsx` (and mocks in the other test files)

`FilterBar` calls `useRouter`, `usePathname`, and `useSearchParams`. Outside a running Next app there is no App Router context, so the hooks throw `invariant expected app router to be mounted` and both tests fail before any assertion. Also, the second test ends in a `// TODO` comment: it "tests" nothing.

Mock the module. Variables used in a `jest.mock` factory must be prefixed with `mock`, because `jest.mock` calls are hoisted above imports and Jest only allows out-of-scope variables that start with `mock`.

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterBar } from '../components/FilterBar';
import { makeTask } from '../testing/fixtures';

const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => '/assessment2',
  useSearchParams: () => new URLSearchParams('q=login'),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

it('updates the URL when the priority changes', async () => {
  const user = userEvent.setup();
  render(<FilterBar tasks={[makeTask()]} />);

  await user.selectOptions(screen.getByLabelText(/priority/i), 'high');

  expect(mockReplace).toHaveBeenCalledWith('/assessment2?q=login&priority=high');
});
```

Mock hygiene:

- Call counts leak between tests unless you reset them. Use `beforeEach(() => jest.clearAllMocks())`, or set `clearMocks: true` (or `resetMocks`/`restoreMocks`) in `jest.config.ts`.
- Restore anything you spy on (`jest.spyOn(...).mockRestore()`, or `restoreMocks: true`).
- For actions, do `jest.mock('../actions', ...)` (Server Actions are just functions to Jest).
- Do not try to render an `async` Server Component with RTL. Test the pure logic separately, and cover server rendering with an end-to-end test.

---

## 23. Time-dependent tests without controlling the clock

**Where:** `__tests__/format.test.ts`

```ts
expect(isOverdue('2026-10-15', false)).toBe(false);   // fails after Oct 15, 2026
expect(isOverdue('2026-09-20', false)).toBe(true);
expect(daysUntil('2026-10-01')).toBe(2);              // wrong tomorrow, and depends on time of day
```

These tests pass today and fail as the calendar moves on. Tests must be deterministic. Freeze time with Jest's modern fake timers and restore it.

```ts
describe('date helpers', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2026-09-29T09:00:00Z') });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('is not overdue when the due date is in the future', () => {
    expect(isOverdue('2026-10-15', false)).toBe(false);
  });

  it('counts the days until the due date', () => {
    expect(daysUntil('2026-10-01')).toBe(2);
  });
});
```

Notes:

- Always call `jest.useRealTimers()` in `afterEach`, or fake timers leak into other tests in the same file.
- With `userEvent` and fake timers, create it with `userEvent.setup({ advanceTimers: jest.advanceTimersByTime })`, or interactions hang.
- The most robust design is to inject the clock: `isOverdue(dueDate, done, now = Date.now())`.
- Locale and time zone also make tests flaky. For example `toLocaleDateString()` output differs across machines and CI. Pass explicit options.

---

## 24. Tests that cannot fail (or fail for the wrong reason)

**Where:** `__tests__/TaskCard.test.tsx`, `__tests__/stats.test.ts`

```tsx
expect(screen.getByRole('link', { name: 'Fix login' }));   // no matcher: asserts nothing

expect(screen.queryByText('Overdue'));                     // no matcher, and queryBy never throws

expect(screen.getByText('Overdue')).not.toBeInTheDocument();   // getBy throws when missing
```

```ts
try {
  await getTaskStats([makeTask({ dueDate: 'not-a-date' })]);
} catch (error) {
  expect(error).toBeInstanceOf(RangeError);   // never runs if nothing throws
}
```

- `expect(x)` alone is a no-op. `getBy*` still throws when nothing is found (so the first test only fails on a missing element), but `queryBy*` returns `null`, so the "overdue badge" test passes even when the badge is missing entirely.
- `getBy*` throws when the element is absent, so it can never be used with `.not.toBeInTheDocument()`. It fails for the wrong reason. Use `queryBy*` to assert absence.
- A `try/catch` test that asserts in `catch` passes silently if nothing throws. `getTaskStats` does not throw for an invalid date (`NaN < now` is `false`), so the test passes while proving nothing. Use `await expect(...).rejects.toThrow(...)`, or add `expect.assertions(1)`.
- Related trap: `expect(promise).resolves.toEqual(...)` without `await` or `return`. The assertion outlives the test. A failing one becomes an unhandled rejection (in practice it can crash the Jest worker), and a passing one proves nothing about timing. Always `await expect(...).resolves`.

```tsx
it('renders the task title as a link', () => {
  render(<TaskCard task={makeTask({ title: 'Fix login' })} />);
  expect(screen.getByRole('link', { name: 'Fix login' })).toHaveAttribute(
    'href',
    '/assessment2/tasks/t-test',
  );
});

it('shows an overdue badge for late tasks', () => {
  render(<TaskCard task={makeTask({ dueDate: '2020-01-01' })} />);
  expect(screen.getByText('Overdue')).toBeInTheDocument();
});

it('hides the overdue badge for finished tasks', () => {
  render(<TaskCard task={makeTask({ dueDate: '2020-01-01', done: true })} />);
  expect(screen.queryByText('Overdue')).not.toBeInTheDocument();
});
```

```ts
it('counts overdue tasks', async () => {
  const stats = await getTaskStats([makeTask({ dueDate: '2020-01-01' })]);
  expect(stats.overdue).toBe(1);
});
```

Tools that catch this: `eslint-plugin-jest` (`jest/expect-expect`, `jest/no-conditional-expect`) and `eslint-plugin-testing-library` (`prefer-presence-queries`, `await-async-events`, `no-container`, `no-node-access`).

Also note the workaround in `TaskCard.test.tsx`:

```ts
jest.mock('../lib/tasks', () => ({ getPriorityLabel: () => 'High priority' }));
```

It is there only because of issue 14. Fixing the module split lets you delete it.

---

## Scoring

- **20–24 issues:** you are in good shape for a Next 15 / React 19 review.
- **14–19:** revisit async request APIs, Server vs Client boundaries, and Server Action rules, then RTL query/async rules.
- **Under 14:** walk the answer key file by file, then review the PR again from scratch.

If you only caught the app issues, re-read the test files. Reviewing test code is a skill on its own.

---

## Red herrings: valid in Next.js 15 / React 19

Do not treat these as bugs:

1. **`<SessionContext value={{ user }}>`** in `SessionProvider.tsx`. In React 19 the context itself is the provider. `<Context.Provider>` still works, but is no longer needed.
2. **`use(SessionContext)`** in `useSession`. `use()` can read context, and unlike `useContext` it may be called conditionally.
3. **`async` layout with `await cookies()`** in `layout.tsx`. That is the correct Next 15 form. (It makes the whole segment dynamic, which is a trade-off, not a bug.)
4. **`SubmitButton` calling `useFormStatus`** in `NewTaskForm.tsx`. It lives in a child of the `<form>`, so `pending` works. (Compare with the mistake in the first practice PR.)
5. **`useActionState` returning a value used as `state.error`**, with the form rendering `role="alert"`. Correct usage once the signature is fixed.
6. **Client Components importing Server Actions** (`TaskToggle`, `TaskCard`, `NewTaskForm`). Supported.
7. **`redirect()` after `revalidatePath()` at the end of `createTask`**, not in `try/catch`. Correct.
8. **`GET` handlers as named exports** in `api/tasks/route.ts` and `api/activity/route.ts`. In Next 15 they are not cached by default.
9. **`notFound()` in `tasks/[id]/page.tsx`** with a sibling `not-found.tsx`. Correct, and `notFound()` throws so code after it does not run.
10. **`error.tsx` with `'use client'`, `error`, and `reset`**, and `loading.tsx`.
11. **`FilterBar` wrapped in `<Suspense>`** in `page.tsx`, because `useSearchParams` needs it.
12. **Passing a plain-object `user` from the Server Component layout into the Client Component provider.** Serializable props are fine. (Contrast with issue 19, which is about passing *too much* data.)
13. **Fixtures in `testing/fixtures.ts`** rather than inside `__tests__`. Jest treats every file inside `__tests__` as a test file, so a helper placed there fails with "Your test suite must contain at least one test".

---

## Bonus nits (not counted in the score)

- `POST /api/tasks` passes `request.json()` straight to `createTaskRecord` with no validation, no auth, no try/catch for invalid JSON, and returns `200` instead of `201`. Validate the body (for example with zod) and return `400` on bad input.
- `GET /api/tasks` returns the full rows, including `internalNotes` (see issue 19).
- Several tests import `../actions` and mock it, but none assert the form or toggle behavior end to end (a submitted `FormData`, an error state).
- Root `layout.tsx` still has `import Link from 'next/dist/client/link'` and `className="w-fullmb-8"` from the first PR.
