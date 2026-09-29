import Link from 'next/link';
import { SessionProvider } from './components/SessionProvider';
import { getCurrentUser } from './lib/auth';

export default async function TaskFlowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <SessionProvider user={user}>
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center justify-between border-b border-gray-200 pb-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Practice PR 2
            </p>
            <Link href="/assessment2" className="text-2xl font-semibold">
              TaskFlow
            </Link>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/assessment2">Board</Link>
            <Link href="/assessment2/tasks/new">New task</Link>
            <span className="text-gray-500">
              {user ? `${user.name} (${user.role})` : 'Signed out'}
            </span>
          </nav>
        </header>
        {children}
      </div>
    </SessionProvider>
  );
}
