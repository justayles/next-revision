# React Testing Interview Questions: Study Reference

A condensed, printable study guide based on the article **"React Testing Questions That Trip Up Engineers"** by HowToTestFrontend (27 June 2026).

Source: https://howtotestfrontend.com/resources/react-testing-interview-questions

> This is a summary in my own words, with my own code examples, not a copy of the article. It includes the points from the article's collapsed "Show details" sections. Read the original for the author's full explanations and links.

The article assumes a mid-level React role and **React Testing Library (RTL)** as the main tool, with Jest or Vitest as the runner.

---

## Contents

1. Tests that never fail
2. What "testing implementation details" means
3. Lightning round: standard RTL questions
4. What `act()` does
5. Testing a debounced input
6. When mocking causes problems
7. What to avoid in E2E tests
8. Testing `IntersectionObserver`
9. Testing drag and drop
10. One-page cheat sheet

---

## 1. Tests that never fail

**Question:** How does a test that never fails cause problems, and when does that happen?

A test that cannot fail is worse than no test. It gives false confidence, adds maintenance cost, slows the suite, and wastes time that could go into useful tests. Tests should fail when behavior changes.

There are three main causes. In an interview, give one concrete example of each, then explain the cost.

### 1.1 The unit can't change

The test asserts something that is always true, for example hard-coded text in a component with no conditions.

```tsx
const Footer = () => <p>All rights reserved</p>;

// Pointless: this can never fail unless someone deletes the line
expect(screen.getByText('All rights reserved')).toBeInTheDocument();
```

**Exception (the "show details" point):** the same assertion is valuable one level up, when a **parent** decides whether to render the child. Test both branches:

```tsx
const Page = ({ isNew }: { isNew: boolean }) =>
  isNew ? <WelcomeBanner /> : <Footer />;

test('shows the footer for returning users', () => {
  render(<Page isNew={false} />);
  expect(screen.getByText('All rights reserved')).toBeInTheDocument();
});

test('hides the footer for new users', () => {
  render(<Page isNew />);
  expect(screen.queryByText('All rights reserved')).not.toBeInTheDocument();
});
```

### 1.2 The test itself is broken

- Asserting something that is always truthy (`expect(container).toBeTruthy()`, since `container` is always a DOM node).
- Comparing a value to itself (`expect(button).toBe(button)`).
- A test whose title says one thing but whose assertion checks another (for example, "form submits" but asserting `onSubmit` was called **0** times).

### 1.3 Over-mocking

If you mock a function and then assert that the mock returns what you told it to return, you are testing the mocking library, not your app.

```ts
jest.spyOn(api, 'getUser').mockResolvedValue(user);
expect(await api.getUser()).toEqual(user); // only proves the mock works
```

### Gotcha: negation ("show details" section)

Asserting that something is **absent** is prone to false positives. This passes in any test, because the text never exists:

```tsx
expect(screen.queryByText('text that never exists')).toBeNull();
```

**Fix:** run the same test with both conditions so the "present" case proves the query can actually find the element.

```tsx
test.each([true, false])('shows the title only when enabled (%s)', (enabled) => {
  render(<Component showTitle={enabled} />);
  const title = screen.queryByText('Title');

  if (enabled) expect(title).toBeInTheDocument();
  else expect(title).toBeNull();
});
```

### How to avoid never-failing tests

1. **Write the test first** so you see it fail before the implementation makes it pass.
2. **Break the implementation on purpose** (or delete it temporarily). If the test still passes, it isn't testing what you think. Use this as a check, not as part of the normal workflow.

---

## 2. What "testing implementation details" means

**Question:** What does "testing implementation details" really mean?

**Rule of thumb:** if you refactor the internals and the user-visible behavior stays the same, would your tests break? If yes, you are testing implementation details.

Tests should use the component's **public surface**: what it renders and how users interact with it.

### Bad: spying on internals

```tsx
// Breaks the moment useState becomes useReducer, Redux, Zustand, etc.
jest.spyOn(React, 'useState').mockReturnValue([0, setCount]);
...
expect(setCount).toHaveBeenCalled();
```

### Good: assert on what the user sees

```tsx
test('counter increments on click', async () => {
  const user = userEvent.setup();
  render(<Counter />);

  expect(screen.getByText('Count: 0')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /increment/i }));
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

If tests keep passing untouched after an internal refactor, you can trust the refactor.

### Red flag answer: "Just don't test private methods" ("show details" section)

That is true but too simple, and it doesn't fit React components well. Also, "test every public method" leads to over-testing each piece in isolation. Often you get more value from **integration tests** on the places that use several components together, which exercise the public interfaces anyway.

---

## 3. Lightning round: standard RTL questions

Be ready to answer each of these quickly.

| Question | Short answer |
| --- | --- |
| `getByText` vs `getByRole` vs `getByLabelText` | Know the full query family. Prefer role and label queries, which reflect how users and assistive tech find things. |
| `getBy` vs `queryBy` vs `findBy` | `getBy`: must exist now, throws if not. `queryBy`: returns `null` if missing (use for "not present"). `findBy`: async, waits for it to appear. |
| `userEvent` vs `fireEvent` | `userEvent` simulates a realistic sequence (focus, keydown, input, etc.). `fireEvent` dispatches one raw event. Prefer `userEvent`. |
| What is `waitFor` for? | Retrying an assertion until it passes or times out. Bonus: many `waitFor` calls can be replaced by `await findBy...`. |
| Should you use `data-testid`? | Only as a last resort or escape hatch. Prefer `getByRole` and friends. |
| Should you use snapshots? | Subjective. Have an opinion. They are easy to overuse and can become a pile of low-value tests in a large codebase. |

---

## 4. What `act()` does

**Question:** What is `act()` and when do you need it?

- `act()` makes sure queued state updates and re-renders are **finished** before you make your assertions.
- You can write many tests without ever calling it directly, but you may see the warning **"not wrapped in act(...)"**.
- Treat that warning as a real code smell, not noise. The risk: you assert on what's on screen, but a pending state change re-renders afterwards, so the user sees something different. That produces a **false positive**.
- **E2E tests** (Playwright, Cypress) and **Vitest Browser Mode** don't need `act()`, because they run in a real browser with real async behavior.

### Two more facts ("show details" section)

1. `userEvent` methods and `waitFor` already handle `act()` internally. Don't wrap them yourself.
2. `act` can be imported from several places (RTL, `react`, and `react-dom/test-utils` in older React). **Use the one re-exported by React Testing Library.**

---

## 5. Testing a debounced input

**Question:** How would you test a debounced input?

**What is debouncing?** It delays a function (such as an API call) until the user has stopped typing for a set time. With a 300 ms debounce, the search runs 300 ms after the last keystroke, instead of on every key press.

### Red flags

- Typing, then immediately asserting the callback was called (the delay hasn't passed).
- Using `waitFor(() => expect(onSearch).toHaveBeenCalled())`, which runs the debounce in real time and is slow and unreliable.

### What to mention

- **Fake timers**
- Configuring **`userEvent.setup({ advanceTimers })`**, because `userEvent` hangs under fake timers otherwise
- Using **`act()`** when advancing timers triggers state updates

### Example ("show details" section)

Component under test:

```tsx
import { useMemo } from 'react';
import { debounce } from 'lodash';

export function Search({ onSearch }: { onSearch: (query: string) => void }) {
  const debounced = useMemo(() => debounce(onSearch, 300), [onSearch]);

  return (
    <input
      placeholder="Search..."
      onChange={(event) => debounced(event.target.value)}
    />
  );
}
```

Test:

```tsx
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Search } from './Search';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

it('calls onSearch only after the debounce delay', async () => {
  const onSearch = jest.fn();
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

  render(<Search onSearch={onSearch} />);
  await user.type(screen.getByPlaceholderText('Search...'), 'react');

  expect(onSearch).not.toHaveBeenCalled(); // still waiting

  act(() => {
    jest.advanceTimersByTime(300);
  });

  expect(onSearch).toHaveBeenCalledWith('react');
});
```

Fake timers work almost identically in Jest and Vitest (`vi.useFakeTimers`, `vi.advanceTimersByTime`).

---

## 6. When mocking causes problems

**Question:** When does mocking cause problems in tests?

**Over-mocking is one of the biggest causes of low-value, hard-to-maintain tests.** Your answer shows how much experience you have with a large suite.

### Kinds of mocking to be able to discuss

- `jest.mock('module')`: replaces a whole import
- `jest.spyOn(obj, 'method')`: wraps or replaces one method
- `jest.fn()`: a standalone mock function (also what `spyOn` returns)
- Manually passing fake data or callbacks, or mocking a hook's return value

If the interviewer is junior-focused, be ready to explain the difference between `jest.mock`, `jest.spyOn`, and `jest.fn`.

### Problems

- Too many mocks means you're testing your mocks, not the real app.
- Mocks **drift** from the real implementation and keep passing when the real thing changes.
- Mocks can be set up so the test never fails (see section 1).

### When you *should* mock

Things you don't own or control: **browser APIs, third-party modules, network/API responses**.

---

## 7. What to avoid in E2E tests

**Question:** What should you avoid over-testing in E2E tests, and why?

(Also be able to explain unit vs integration vs E2E. It comes up constantly.)

**E2E tests** run a real browser, often with Playwright or Cypress. They are the best proof the app works end to end, and they are best for:

- critical user flows
- the general happy and sad paths
- things impossible in jsdom (real Web APIs). Vitest Browser Mode can give you a mix of both.

### Why not test everything in E2E

- **Slower** to run
- **More flaky** (network, timing, environment), which often means re-runs in CI
- **More time-consuming to maintain**
- **Harder to debug**, especially when they only fail in CI

### Things to avoid

- Testing every combination of a component. Cover the main happy path and maybe one error path in E2E, and put the rest in faster Jest/Vitest + RTL tests (or Vitest Browser Mode).
- Depending on specific seeded database data. For example, a test that requires exactly N orders on a page is a constant headache. Leave that to non-E2E tests.

---

## 8. Testing a component that uses `IntersectionObserver`

**Question:** How would you test it, and what makes it hard?

**What it is:** a browser API that tells you when an element enters or leaves the viewport (or another element). Common in lazy-loaded images and infinite scroll.

**The key point interviewers listen for:** **jsdom has no `IntersectionObserver`.** Using it throws `ReferenceError: IntersectionObserver is not defined`.

### Your options

1. **Use a real browser:** Playwright/Cypress E2E, or Vitest Browser Mode.
2. **Mock it in jsdom.** A ready-made package like `jsdom-testing-mocks` covers this and other APIs (`ResizeObserver`, `matchMedia`). Also know how to write a mock from scratch.

### A hand-rolled mock ("show details" section)

Written for Jest. It keeps track of observed elements and lets a test trigger the callback.

```tsx
export function mockIntersectionObserver() {
  const callbacks = new Map<Element, IntersectionObserverCallback>();

  class MockIntersectionObserver {
    constructor(private callback: IntersectionObserverCallback) {}
    observe = (element: Element) => callbacks.set(element, this.callback);
    unobserve = (element: Element) => callbacks.delete(element);
    disconnect = () => callbacks.clear();
  }

  Object.defineProperty(globalThis, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });
  // Vitest: vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

  function triggerIntersection(element: Element, isIntersecting: boolean) {
    callbacks.get(element)?.(
      [{ isIntersecting, target: element } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
  }

  return { triggerIntersection };
}
```

Use it by calling `mockIntersectionObserver()` in the test, rendering, and then calling `triggerIntersection(element, true)` (inside `act()` if it causes state updates).

**Red flag:** trying to fake scroll positions in jsdom. Mocking the API is fine here, since it's an external API you don't control. Expect some compromise with browser APIs in RTL.

---

## 9. Testing drag and drop

**Question:** How would you test drag and drop in a React component?

Hard to prepare for, so have a plan.

- If a library (for example `@dnd-kit`) does the dragging, don't test the library itself. Test **your** behavior around it. You may mock the library.
- If you do want to exercise it, think **accessibility first**: any correctly built interactive widget should work with the keyboard, and libraries like `@dnd-kit` ship keyboard support. Drive the keyboard interaction with `fireEvent.keyDown`, and assert on the resulting order.
- Testing the actual mouse or touch behavior needs a **real browser** (E2E or Vitest Browser Mode).

### Keyboard example

```tsx
it('moves an item down with the keyboard', () => {
  render(<SortableList items={['A', 'B', 'C']} />);

  const handle = screen.getByRole('button', { name: 'Drag A' });
  act(() => handle.focus());

  fireEvent.keyDown(handle, { key: ' ', code: 'Space' });          // pick up
  fireEvent.keyDown(handle, { key: 'ArrowDown', code: 'ArrowDown' }); // move
  fireEvent.keyDown(handle, { key: ' ', code: 'Space' });          // drop

  const order = screen.getAllByRole('listitem').map((li) => li.textContent);
  expect(order).toEqual(['B', 'A', 'C']);
});
```

### Red flags

- Simulating `mouseDown`, `mouseMove`, `mouseUp` in RTL. It won't work in jsdom because there is no layout for the library to measure.
- Saying "no need to test it, it's a library". You still need to test your own behavior around it.

Trade-off: keyboard tests miss some mouse-only bugs, but they are clean and easy to maintain.

---

## 10. One-page cheat sheet

**Tests that never fail**
- Trivial or hard-coded assertions, self-comparisons, always-truthy checks, wrong titles, over-mocking
- Negation (`queryBy...` + `toBeNull`) needs a matching "present" case (`test.each([true, false])`)
- Check by writing the test first, or by breaking the implementation

**Implementation details**
- Would a refactor with identical user behavior break the test? Then it's too coupled
- Test through rendered output and user interaction
- Don't just say "don't test private methods"; consider integration tests

**RTL basics**
- Prefer `getByRole` / `getByLabelText`; `data-testid` is a last resort
- `getBy` (exists now), `queryBy` (may be absent), `findBy` (appears later)
- `userEvent` over `fireEvent`; replace `waitFor` with `findBy` where possible
- Have an opinion on snapshots

**`act()`**
- Flushes queued updates so assertions see the final UI
- Don't ignore "not wrapped in act" warnings
- `userEvent` and `waitFor` already wrap it; import `act` from RTL
- Not needed in real-browser tests

**Debounce**
- Fake timers + `userEvent.setup({ advanceTimers: jest.advanceTimersByTime })`
- Advance timers inside `act()`; restore real timers in `afterEach`
- Never rely on real-time `waitFor` for a debounce

**Mocking**
- Mock what you don't own (browser APIs, network, third parties)
- Avoid mocking your own code until the test only checks the mock
- Know `jest.mock` vs `jest.spyOn` vs `jest.fn`

**E2E**
- Critical flows, happy/sad paths, real browser APIs only
- Avoid exhaustive combinations and DB-seeded data expectations

**IntersectionObserver**
- Missing in jsdom: use a real browser, or mock (`jsdom-testing-mocks` or your own)

**Drag and drop**
- Test your logic, not the library
- Keyboard interaction with `fireEvent.keyDown` in RTL
- Real mouse/touch behavior needs a real browser

---

## Self-test questions

Try to answer these out loud without looking.

1. Name three ways a test can pass forever. Which one applies to `expect(queryByText('x')).toBeNull()`?
2. How can you prove a test actually tests something?
3. What is the practical definition of "testing implementation details"?
4. When should you pick `queryBy` over `getBy`? When `findBy`?
5. Why does `userEvent` hang under fake timers, and how do you fix it?
6. Why is a "not wrapped in act()" warning dangerous even when the test passes?
7. Which things should you mock, and which should you avoid mocking?
8. Why should E2E tests not cover every component state?
9. What happens when a component using `IntersectionObserver` is rendered in jsdom?
10. How would you test a sortable list without simulating mouse movement?
