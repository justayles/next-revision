import { ThemeProvider } from './components/ThemeProvider';
import Link from 'next/link';

export default function AssessmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center justify-between border-b border-gray-200 pb-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Practice PR
            </p>
            <Link href="/assessment" className="text-2xl font-semibold">
              ShopLite
            </Link>
          </div>
          <nav className="flex gap-4 text-sm">
            <Link href="/assessment">Catalog</Link>
            <Link href="/assessment/cart">Cart</Link>
            <Link href="/assessment/checkout">Checkout</Link>
          </nav>
        </header>
        {children}
      </div>
    </ThemeProvider>
  );
}
