'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { reviews } from './lib/reviews';
import { ActionState, CartItem } from './lib/types';

export async function addReview(prevState: ActionState, formData: FormData) {
  const productId = formData.get('productId') as string;
  const author = formData.get('author') as string;
  const body = formData.get('body') as string;

  try {
    reviews.push({
      id: `r${reviews.length + 1}`,
      productId,
      author,
      body,
      createdAt: new Date().toISOString(),
    });

    redirect(`/assessment/products/${productId}`);
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Could not save review' };
  }
}

export async function addToCart(productId: string, qty: number) {
  const cookieStore = cookies();
  const current = cookieStore.get('cart')?.value;
  const cart: CartItem[] = current ? JSON.parse(current) : [];

  cart.push({ productId, qty });
  cookieStore.set('cart', JSON.stringify(cart));
}

export async function checkout(formData: FormData) {
  const email = formData.get('email') as string;

  try {
    if (!email) {
      throw new Error('Email is required');
    }

    const cookieStore = cookies();
    cookieStore.delete('cart');
    redirect('/assessment/checkout/success');
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Checkout failed' };
  }
}
