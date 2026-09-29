import { CheckoutForm } from '../components/CheckoutForm';

export default function CheckoutPage() {
  return (
    <div>
      <h1 className="mb-4 text-3xl font-semibold">Checkout</h1>
      <p className="mb-6 text-gray-600">
        Enter your email and we will send the order confirmation.
      </p>
      <CheckoutForm />
    </div>
  );
}
