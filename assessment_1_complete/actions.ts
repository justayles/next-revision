'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { reviews } from './lib/reviews';
import { ActionState, CartItem } from './lib/types';

export async function addReview(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState | void> {
  const productId = String(formData.get('productId') ?? '').trim();
  const author = String(formData.get('author') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();

  if (!productId || !author || !body) {
    return { error: 'Name and review are required' };
  }

  try {
    reviews.push({
      id: `r${Date.now()}`,
      productId,
      author,
      body,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Could not save review',
    };
  }

  revalidatePath(`/assessment/products/${productId}`);
  // redirect(`/assessment/products/${productId}`);
}

export async function addToCart(productId: string, qty: number) {
  // wait for 2 secs
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const cookieStore = await cookies();
  const current = cookieStore.get('cart')?.value;
  const cart: CartItem[] = current ? JSON.parse(current) : [];

  cart.push({ productId, qty });
  cookieStore.set('cart', JSON.stringify(cart));
}

export async function checkout(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = formData.get('email') as string;
  if (!email) {
    return { error: 'Email is required' };
  }
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    return { error: 'Checkout is not configured' };
  }
  try {
    const cookieStore = await cookies();
    cookieStore.delete('cart');
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Checkout failed',
    };
  }
  revalidatePath('/assessment');
  revalidatePath('/assessment/cart');
  redirect('/assessment/checkout/success');
}
