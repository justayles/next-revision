'use client';

export function ShareButton({ productName }: { productName: string }) {
  return (
    <button
      type="button"
      className="text-sm underline"
      onClick={() => {
        navigator.clipboard.writeText(`Check out ${productName} on ShopLite`);
      }}
    >
      Share product
    </button>
  );
}
