import { InputHTMLAttributes } from 'react';

type QuantityInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function QuantityInput({ label, ...props }: QuantityInputProps) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span>{label}</span>
      <input className="w-24 border px-2 py-1" {...props} />
    </label>
  );
}
