'use client';

import { useActionState, useId } from 'react';
import { useFormStatus } from 'react-dom';
import { createTask } from '../actions';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      data-testid="submit-button"
      className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
    >
      {pending ? 'Creating…' : 'Create task'}
    </button>
  );
}

export function NewTaskForm() {
  const id = useId();
  const [state, formAction] = useActionState(createTask, { error: null });

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-3">
      <label htmlFor={`${id}-title`}>Title</label>
      <input
        id={`${id}-title`}
        name="title"
        data-testid="title-input"
        className="border px-3 py-2"
        defaultValue={state.values?.title ?? ''}
      />

      <label htmlFor={`${id}-description`}>Description</label>
      <textarea
        id={`${id}-description`}
        name="description"
        className="border px-3 py-2"
        defaultValue={state.values?.description ?? ''}
      />

      <label htmlFor={`${id}-priority`}>Priority</label>
      <select
        id={`${id}-priority`}
        name="priority"
        defaultValue={state.values?.priority ?? 'medium'}
        className="border px-3 py-2"
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
