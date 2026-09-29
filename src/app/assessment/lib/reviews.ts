import { Review } from './types';

export const reviews: Review[] = [
  {
    id: 'r1',
    productId: '1',
    author: 'Maya',
    body: 'Still warm after a 45 minute retro. Buying another for the kitchen.',
    createdAt: '2026-08-02T10:12:00.000Z',
  },
  {
    id: 'r2',
    productId: '1',
    author: 'Chris',
    body: 'Nice weight, lid rattles a bit if you walk quickly.',
    createdAt: '2026-08-11T16:40:00.000Z',
  },
  {
    id: 'r3',
    productId: '4',
    author: 'Priya',
    body: 'Office mode is actually quiet. Battery lasted through a travel day.',
    createdAt: '2026-09-01T09:05:00.000Z',
  },
];

export function getReviews(productId: string) {
  return reviews.filter((review) => review.productId === productId);
}
