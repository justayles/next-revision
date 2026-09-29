# React 19 and Next.js 15: `use`, `useTransition`, `useOptimistic`, `useActionState`, `useFormStatus`

A printable reference for **when and where** to use each API, what it is for, and the mistakes to avoid.

Assumes **Next.js 15 (App Router)** and **React 19**.

---

## 0. The one rule to remember

> **Server Components** run only on the server. They can be `async` and `await` data, but they have no state, effects, or event handlers.
> **Client Components** (`'use client'`) are where state and interactivity live. They are still pre-rendered on the server, then hydrated in the browser.

- Every **hook** on this page except `use` is **Client-only**.
- `use` is an **API, not a hook**. It can be called conditionally, in loops, and after an early return.
- Server Actions (`'use server'`) are the server-side half of the story. Client code calls them, and they can be passed to forms in either kind of component.

---

## 1. At a glance

| API | Import from | Server Component? | Client Component? | Main job |
| --- | --- | --- | --- | --- |
| `use(promise)` | `react` | Allowed, but prefer `await` | Yes | Read a promise during render (suspends) |
| `use(Context)` | `react` | No (no context on the server) | Yes | Read context, even conditionally |
| `useTransition` | `react` | No | Yes | Mark work as non-urgent, get `isPending` |
| `useOptimistic` | `react` | No | Yes | Show an expected result while an Action runs |
| `useActionState` | `react` | No | Yes | Keep state that an Action returns (errors, results), plus `isPending` |
| `useFormStatus` | `react-dom` | No | Yes | Read the pending status of the **parent** `<form>` |
| `<form action={fn}>` | built in | **Yes** (with a Server Action) | Yes | Submit through an Action, no hooks needed |

**Key point:** a Server Component can render `<form action={serverAction}>` with **no hooks at all**. You only need hooks when you want pending state, returned state, or optimistic UI, and those parts must live in a Client Component.

### Vocabulary

- **Action:** an async function React runs inside a **transition**. Sources: `startTransition(async () => ...)`, a function passed to `<form action>`, or the function you give to `useActionState`.
- **Server Action:** an async function marked `'use server'` that runs on the server. It can be used as an Action. Every export is a public HTTP endpoint, so **check authorization inside it**.

---

## 2. `use()`: read a promise or context during render

### 2.1 Where it works

- **Client Components:** the main place. Pair it with `<Suspense>`.
- **Server Components:** allowed for promises, but `async/await` is better. `await` resumes where it stopped; `use` re-renders the component.
- **Context:** only useful in Client Components.

### 2.2 Rules

- Can be used inside `if`, loops, and after an early `return`. It is not a hook.
- **Cannot** be wrapped in `try/catch`. A rejected promise goes to the nearest **Error Boundary**. For a fallback value, add `.catch()` to the promise before passing it in.
- The promise must have **stable identity**. Never create it inside a Client Component's render body. That causes "suspended by an uncached promise" and an endless loop.
- Put a `<Suspense>` boundary above it, or the whole page waits.

### 2.3 Valid use 1: stream server data into a Client Component

```tsx
// app/page.tsx  (Server Component, do NOT await the promise)
import { Suspense } from 'react';
import { Feed } from './Feed';
import { getFeed } from './lib/feed';

export default function Page() {
  const feedPromise = getFeed(); // starts now, not awaited

  return (
    <Suspense fallback={<p>Loading feed…</p>}>
      <Feed feedPromise={feedPromise} />
    </Suspense>
  );
}
```

```tsx
// app/Feed.tsx  (Client Component)
'use client';

import { use, useState } from 'react';

export function Feed({ feedPromise }: { feedPromise: Promise<Item[]> }) {
  const items = use(feedPromise);
  const [query, setQuery] = useState('');

  const visible = items.filter((item) => item.title.includes(query));
  // ...render input + list
}
```

Use this when the client needs the data for interactivity (filter, sort, drag). If the UI is display-only, make it an `async` Server Component and skip `use` entirely.

### 2.4 Valid use 2: unwrap `params` / `searchParams` in a Client Component

In Next 15 these are Promises.

```tsx
'use client';

import { use } from 'react';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <p>Task {id}</p>;
}
```

Client Components can never be `async`, so `use` is the way in.

### 2.5 Valid use 3: read context conditionally

```tsx
'use client';

import { use } from 'react';
import { ThemeContext } from './ThemeContext';

export function Badge({ show }: { show: boolean }) {
  if (!show) return null;
  const theme = use(ThemeContext); // fine after an early return
  return <span className={theme.badge}>New</span>;
}
```

### 2.6 Anti-patterns

```tsx
// BAD: new promise on every render
const items = use(fetch('/api/items').then((res) => res.json()));

// BAD: try/catch around use()
try { const data = use(promise); } catch {}

// BAD: fetching in a click handler (use() is for render, not events)
onClick={() => use(promise)}

// BAD: awaiting in the parent defeats streaming
<Feed feedPromise={await getFeed()} />   // pass the promise, don't await it
```

---

## 3. `useTransition`: keep the UI responsive, get a pending flag

**Where:** Client Components only. `const [isPending, startTransition] = useTransition();`

A standalone `startTransition` can also be imported from `'react'` (no `isPending`). It is also client-side.

In React 19 the function you pass can be `async`. That makes it an **Action**.

### 3.1 Valid use 1: call a Server Action from a click or change handler

```tsx
'use client';

import { useTransition } from 'react';
import { archiveTask } from '../actions';

export function ArchiveButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await archiveTask(id);
        });
      }}
    >
      {isPending ? 'Archiving…' : 'Archive'}
    </button>
  );
}
```

Why wrap it: Next applies the revalidated UI as part of the same transition, and you get `isPending`.

### 3.2 Valid use 2: navigation with a pending indicator

```tsx
'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function PriorityFilter() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <select
      disabled={isPending}
      onChange={(event) => {
        startTransition(() => {
          router.replace(`/board?priority=${event.target.value}`);
        });
      }}
    >
      {/* options */}
    </select>
  );
}
```

### 3.3 Valid use 3: expensive renders while keeping input snappy

```tsx
const [query, setQuery] = useState('');           // urgent: the input
const [filter, setFilter] = useState('');         // non-urgent: the slow list
const [isPending, startTransition] = useTransition();

<input
  value={query}
  onChange={(event) => {
    setQuery(event.target.value);                 // updates immediately
    startTransition(() => setFilter(event.target.value)); // can be interrupted
  }}
/>
```

When you just want to defer a **value** you don't own, `useDeferredValue(value)` is simpler.

### 3.4 Gotchas

- State updates **after an `await`** inside the transition are not automatically part of it. Wrap them in another `startTransition` if needed.
- Do not put a controlled text input's own state inside a transition. Typing will feel wrong.
- Thrown errors go to the nearest Error Boundary. Catch inside the Action if you want inline error handling.
- For `<form>` submissions you often do **not** need `useTransition`. A form `action` already runs as a transition (see `useActionState` and `useFormStatus`).
- It supplies the Action context that `useOptimistic` requires (section 4).

---

## 4. `useOptimistic`: show the expected result before the server confirms

**Where:** Client Components only.

```tsx
const [optimisticValue, setOptimistic] = useOptimistic(realValue);
// or with a reducer, great for lists:
const [optimisticItems, addOptimistic] = useOptimistic(
  items,
  (current, newItem: Item) => [...current, newItem],
);
```

### 4.1 The critical rule

Call the setter **inside an Action**:

- `startTransition(async () => { ... })`
- a function passed to `<form action={...}>`
- the action given to `useActionState`

Outside an Action React logs *"An optimistic state update occurred outside a transition or action"* and the optimistic value disappears at once.

### 4.2 How it behaves

- While the Action is pending, you see the optimistic value.
- When the Action ends (success **or** error), React throws it away and shows the real value.
- So the real value must change before the Action ends. In Next.js that means your Server Action calls `revalidatePath` or `revalidateTag`, so fresh props arrive within the same transition.
- On failure the UI reverts automatically. You still need to show an error separately.

### 4.3 Valid use 1: toggle (like, done, favorite)

```tsx
'use client';

import { startTransition, useOptimistic } from 'react';
import { toggleTask } from '../actions';

export function TaskToggle({ id, done }: { id: string; done: boolean }) {
  const [optimisticDone, setOptimisticDone] = useOptimistic(done);

  function handleClick() {
    startTransition(async () => {
      setOptimisticDone(!done);        // from the REAL prop, not the optimistic value
      await toggleTask(id, !done);     // action revalidates the path/tag
    });
  }

  return (
    <button type="button" onClick={handleClick} aria-pressed={optimisticDone}>
      {optimisticDone ? 'Mark as open' : 'Mark as done'}
    </button>
  );
}
```

```ts
// actions.ts
'use server';
import { revalidatePath } from 'next/cache';

export async function toggleTask(id: string, done: boolean) {
  await updateTaskDone(id, done);
  revalidatePath('/board');   // without this the UI snaps back
}
```

### 4.4 Valid use 2: append to a list from a form

```tsx
'use client';

import { useOptimistic, useRef } from 'react';
import { sendMessage } from '../actions';

type Message = { id: string; text: string; sending?: boolean };

export function Chat({ messages }: { messages: Message[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [optimisticMessages, addOptimistic] = useOptimistic(
    messages,
    (current, text: string): Message[] => [
      ...current,
      { id: `temp-${crypto.randomUUID()}`, text, sending: true }, // never mutate `current`
    ],
  );

  async function submit(formData: FormData) {
    const text = String(formData.get('text') ?? '');
    addOptimistic(text);              // inside the form action, so it's valid
    await sendMessage(text);
  }

  return (
    <>
      <ul>
        {optimisticMessages.map((message) => (
          <li key={message.id} style={{ opacity: message.sending ? 0.5 : 1 }}>
            {message.text}
          </li>
        ))}
      </ul>
      <form ref={formRef} action={submit}>
        <input name="text" />
        <button type="submit">Send</button>
      </form>
    </>
  );
}
```

### 4.5 Best practices

- Compute the optimistic value from the **real** prop or state.
- Use the reducer form for lists and return a **new** array.
- Give temporary items unique temp ids for `key`.
- Mark pending items in the UI (dim them, show "sending…").
- Do not use it for money, permissions, or anything where a wrong UI is harmful.

---

## 5. `useActionState`: state returned by an Action, plus `isPending`

**Where:** Client Components only. Imported from `react` (older name: `useFormState` from `react-dom`).

```tsx
const [state, formAction, isPending] = useActionState(action, initialState);
```

- `action` is called with **`(previousState, formData)`**. The previous state is the **first** argument.
- Whatever the action **returns** becomes the new `state`.
- `formAction` is what you pass to `<form action={...}>`.
- `isPending` is `true` while the action runs.
- Actions run one at a time, in order.

### 5.1 Valid use 1: form validation errors from a Server Action

```ts
// actions.ts
'use server';

import { redirect } from 'next/navigation';

export type FormState = {
  error: string | null;
  values?: { title: string };
};

export async function createTask(
  _prevState: FormState,      // first argument is the previous state
  formData: FormData,
): Promise<FormState> {
  const title = String(formData.get('title') ?? '').trim();

  if (!title) {
    return { error: 'Title is required', values: { title } };
  }

  await saveTask({ title });
  redirect('/board');         // redirect throws; keep it OUTSIDE try/catch
}
```

```tsx
// NewTaskForm.tsx
'use client';

import { useActionState } from 'react';
import { createTask, type FormState } from '../actions';

const initialState: FormState = { error: null };

export function NewTaskForm() {
  const [state, formAction, isPending] = useActionState(createTask, initialState);

  return (
    <form action={formAction}>
      <label htmlFor="title">Title</label>
      <input id="title" name="title" defaultValue={state.values?.title} />

      {state.error && <p role="alert">{state.error}</p>}

      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating…' : 'Create task'}
      </button>
    </form>
  );
}
```

### 5.2 Things that catch people out

- **Wrong signature.** `createTask(formData)` used with `useActionState` receives the previous state as its first argument, so `formData.get` is not a function.
- **React 19 resets uncontrolled form fields after an action completes**, including after a validation error. Return the submitted values and re-fill them with `defaultValue`, as above.
- **Return expected errors; throw for unexpected ones.** Thrown errors go to an Error Boundary.
- **Progressive enhancement.** With a Server Action, the form can submit before JavaScript loads. A third argument (`permalink`) exists for that case, but you can ignore it at first.
- **Non-form use.** Call `formAction(...)` inside `startTransition` when you trigger it from a button.
- Because `isPending` comes back from the hook, you do **not** need `useFormStatus` when the button is in the same component as the `useActionState` call.

### 5.3 Client-side (non-Server-Action) example

It also works with plain async client functions, for example calling an API:

```tsx
const [message, submitAction, isPending] = useActionState(
  async (_prev: string | null, formData: FormData) => {
    const res = await fetch('/api/subscribe', { method: 'POST', body: formData });
    return res.ok ? 'Subscribed!' : 'Something went wrong';
  },
  null,
);
```

---

## 6. `useFormStatus`: the parent form's pending state

**Where:** Client Components only. Imported from **`react-dom`** (not `react`).

```tsx
const { pending, data, method, action } = useFormStatus();
```

- `pending`: is the parent form currently submitting?
- `data`: the `FormData` being submitted (handy for showing what was sent).
- `method`, `action`: the form's method and action.

### 6.1 The rule that matters most

`useFormStatus` reads the **nearest parent `<form>`**. It must be called in a component **rendered inside** the form, not in the component that renders the form itself.

```tsx
// WRONG: same component as the <form>, pending is always false
function Form() {
  const { pending } = useFormStatus();
  return (
    <form action={save}>
      <button disabled={pending}>Save</button>
    </form>
  );
}
```

```tsx
// RIGHT: a child component
'use client';

import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Saving…' : 'Save'}
    </button>
  );
}

export function Form() {
  return (
    <form action={save}>
      <input name="title" />
      <SubmitButton />
    </form>
  );
}
```

### 6.2 When to use which

- **`useFormStatus`:** a reusable submit button, spinner, or "disable everything while saving" component that should not need props. Great for design-system components.
- **`useActionState`'s `isPending`:** when you already have `useActionState` in the same component that renders the form.

### 6.3 Server Component can render the form

Only the button needs to be a Client Component:

```tsx
// app/settings/page.tsx  (Server Component, no hooks, no 'use client')
import { SubmitButton } from './SubmitButton';   // 'use client' + useFormStatus
import { saveSettings } from './actions';        // 'use server'

export default function SettingsPage() {
  return (
    <form action={saveSettings}>
      <input name="displayName" />
      <SubmitButton />
    </form>
  );
}
```

---

## 7. Related tools worth knowing

- **`useDeferredValue(value)`:** shows an older value while a heavier render catches up. Use it for a value you receive (a prop or a search term) when you don't control the update.
- **`startTransition` (standalone):** same as the hook's function without `isPending`.
- **`cache()` from `react`:** dedupes the same non-`fetch` data call within one server render (for example `generateMetadata` plus the page).
- **`useRouter().refresh()`:** re-fetches server data for the current route. Prefer revalidation inside the Server Action.

---

## 8. Which one do I need?

Work down the list.

1. **Do I just need to read data on the server?** Use an `async` Server Component with `await`. No hooks.
2. **Do I need data in a Client Component that a Server Component can fetch?** Start the promise in the server, pass it as a prop, use `use(promise)` inside `<Suspense>`.
3. **Am I submitting a form?**
   - Simple form, no feedback needed: `<form action={serverAction}>`, even in a Server Component.
   - Need validation errors or returned data: `useActionState`.
   - Need a pending state on the button only: `useFormStatus` in a child (or `isPending` from `useActionState`).
4. **Am I calling an action from a click or change?** Wrap it in `useTransition`.
5. **Should the UI update before the server answers?** Add `useOptimistic`, called **inside the Action**, and make the Server Action revalidate.
6. **Is typing or filtering laggy?** `useTransition` for the slow part, or `useDeferredValue`.

### Combos that work well

- **Toggle button:** `useTransition` (or an Action) + `useOptimistic` + Server Action with `revalidatePath`.
- **Form with errors:** `useActionState` + `SubmitButton` (`useFormStatus`).
- **Form that adds to a list:** `<form action={wrapper}>` where the wrapper calls `addOptimistic` then awaits the Server Action.
- **Streamed section:** Server Component starts the promise + `<Suspense>` + Client Component with `use`.

---

## 9. Common mistakes checklist

- [ ] Hooks used in a Server Component (`useTransition`, `useOptimistic`, `useActionState`, `useFormStatus` all need `'use client'`).
- [ ] `async` Client Component. Use `use()` or move the `await` to a Server Component.
- [ ] `use()` given a promise created during render.
- [ ] `use()` inside `try/catch`.
- [ ] Server Component `await`s a promise it meant to stream (defeats `<Suspense>`).
- [ ] `useOptimistic` setter called outside a transition or form action.
- [ ] Optimistic value computed from the optimistic state instead of the real one.
- [ ] Optimistic list updated with `push` (mutation) instead of returning a new array.
- [ ] Server Action forgets `revalidatePath` / `revalidateTag`, so the UI snaps back.
- [ ] Server Action used with `useActionState` but missing the `(prevState, formData)` signature.
- [ ] Form fields wiped after a validation error (React 19 reset), with no `defaultValue` from returned state.
- [ ] `useFormStatus` called in the same component that renders the `<form>`.
- [ ] `useFormStatus` imported from `react` instead of `react-dom`.
- [ ] `redirect()` inside `try/catch` (it throws and gets swallowed).
- [ ] Server Action has no authorization check (hiding a button is not security).
- [ ] `'use server'` file exports a constant or a non-async function.

---

## 10. One-page cheat sheet

**`use(x)`**
- Reads a Promise or Context during render.
- Can be conditional. No `try/catch`. Needs `<Suspense>`. Stable promise identity.
- Prefer `await` in Server Components. Use it in Client Components for server-started promises and `params`.

**`useTransition()`**
- Client only. Returns `[isPending, startTransition]`.
- Wrap Server Action calls from event handlers. Wrap `router.push` for a pending UI.
- Async function inside `startTransition` = an Action. Updates after `await` need their own `startTransition`.

**`useOptimistic(value, reducer?)`**
- Client only. Setter must run inside an Action.
- Reverts when the Action ends, so the Server Action must revalidate.
- Derive from the real value. Return new arrays. Use temp ids.

**`useActionState(action, initial)`**
- Client only. Returns `[state, formAction, isPending]`.
- Action signature: `(prevState, formData)`.
- Return errors as state. Re-fill fields with `defaultValue`. Redirect outside `try/catch`.

**`useFormStatus()`**
- Client only, from `react-dom`. Returns `{ pending, data, method, action }`.
- Must be in a child of the `<form>`. Ideal for a shared `SubmitButton`.

**Forms**
- `<form action={serverAction}>` works in Server Components too.
- Only add hooks (and `'use client'`) for the parts that need pending state, returned state, or optimistic UI.

---

## 11. Self-test questions

Answer without looking.

1. Which of these can be used in a Server Component: `use`, `useTransition`, `useOptimistic`, `useActionState`, `useFormStatus`?
2. Why is `use()` allowed after an early `return` when `useState` is not?
3. Why does `use(fetch(...))` inside a Client Component loop forever?
4. What makes a function call an "Action", and which three things start one?
5. What happens to a `useOptimistic` value when the Action finishes? Why does a Server Action need `revalidatePath` for it to look right?
6. What is the argument order for a function passed to `useActionState`?
7. Why do form inputs get cleared after a failed validation in React 19, and how do you keep the values?
8. Why does `useFormStatus` always report `pending: false` when called next to the `<form>`?
9. When is `useActionState`'s `isPending` enough, and when do you want `useFormStatus`?
10. Can a Server Component render a form that submits to a Server Action? What must be a Client Component, and why?
