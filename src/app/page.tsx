import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <h1 className="text-3xl mb-3">Welcome to Next.js Revision</h1>
      <p className="mb-4 max-w-xl text-gray-600">
        ShopLite under <Link className="underline" href="/assessment">/assessment</Link>{' '}
        is a fake PR with deliberate Next.js 15 and React 19 mistakes. Review
        that code first, then compare with <code>PRACTICE_ANSWERS.md</code>.
        Full instructions are in <code>PRACTICE.md</code>.
      </p>
    </div>
  );
}
