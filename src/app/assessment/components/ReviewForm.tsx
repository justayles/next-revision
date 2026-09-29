'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useOptimistic } from 'react';
import { addReview } from '../actions';
import { ActionState, Review } from '../lib/types';

const initialState: ActionState = { error: null };

export function ReviewForm({
  productId,
  reviews,
}: {
  productId: string;
  reviews: Review[];
}) {
  const [state, formAction] = useFormState(addReview, initialState);
  const { pending } = useFormStatus();
  const [optimisticReviews, addOptimisticReview] = useOptimistic(
    reviews,
    (current, next: Review) => {
      current.push(next);
      return current;
    },
  );

  return (
    <div>
      <ul className="mb-6 space-y-3">
        {optimisticReviews.map((review, index) => (
          <li key={index} className="border-b pb-3">
            <p className="font-medium">{review.author}</p>
            <p className="text-sm text-gray-600">{review.body}</p>
          </li>
        ))}
      </ul>

      <form
        action={async (formData) => {
          addOptimisticReview({
            id: 'temp',
            productId,
            author: String(formData.get('author') ?? 'You'),
            body: String(formData.get('body') ?? ''),
            createdAt: new Date().toISOString(),
          });
          await formAction(formData);
        }}
        className="flex max-w-md flex-col gap-3"
      >
        <input type="hidden" name="productId" value={productId} />
        <input
          name="author"
          placeholder="Your name"
          className="border px-3 py-2"
        />
        <textarea
          name="body"
          placeholder="How was the product?"
          className="border px-3 py-2"
          rows={3}
        />
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="border border-gray-900 px-4 py-2 disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Add review'}
        </button>
      </form>
    </div>
  );
}
