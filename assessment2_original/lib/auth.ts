import { cookies } from 'next/headers';
import type { User } from './types';

const users: User[] = [
  { id: 'u1', name: 'Ada Lovelace', role: 'admin' },
  { id: 'u2', name: 'Grace Hopper', role: 'member' },
];

// Demo auth: defaults to the admin when no cookie is set.
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const id = cookieStore.get('userId')?.value ?? 'u1';
  return users.find((user) => user.id === id) ?? null;
}
