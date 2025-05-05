"use client";

import CheckoutForm from "@/components/Checkout/CheckoutForm";
import OrderSummary from "@/components/Checkout/OrderSummary";

export default function CheckoutPage() {
  return (
    <div className=" mt-[15vh] mx-auto px-4 md:px-10 lg:px-30 py-8 min-h-[85vh]">
      <h1 className="text-2xl font-bold mb-6">Оформлення замовлення</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <CheckoutForm />
        <OrderSummary />
      </div>
    </div>
  );
}
