"use client";

import CheckoutForm from "./CheckoutForm";

export default function CheckoutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Оформлення замовлення</h1>
      <CheckoutForm />
    </div>
  );
}
