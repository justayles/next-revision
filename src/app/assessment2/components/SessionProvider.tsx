'use client';

import { createContext, use } from 'react';
import type { User } from '../lib/types';

type Session = { user: User | null };

export const SessionContext = createContext<Session>({ user: null });

export function SessionProvider({
  user,
  children,
}: {
  user: User | null;
  children: React.ReactNode;
}) {
  return <SessionContext value={{ user }}>{children}</SessionContext>;
}

export function useSession() {
  return use(SessionContext);
}
