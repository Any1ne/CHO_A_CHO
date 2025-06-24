"use client";

import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import CheckoutForm from "@/components/Checkout/CheckoutForm";
import OrderSummary from "@/components/Checkout/OrderSummary";
import Link from "next/link";
import { useEffect } from "react";
import { updateFreeDelivery } from "@/store/slices/checkoutSlice";
import { Button } from "@/components/ui/button";

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const basketItems = useSelector((state: RootState) => state.basket.items);

  useEffect(() => {
    const total = basketItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    dispatch(updateFreeDelivery(total));
  }, [basketItems, dispatch]); // 👈 Автооновлення при зміні кошика


  if (basketItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center mt-[6rem] md:mt-[8rem] px-4 min-h-[85vh]">
        <h1 className="text-3xl font-semibold mb-4">Ваш кошик порожній</h1>
        <p className="text-lg text-gray-600 mb-6 text-center">
          Додайте товари до кошика, потім перейдіть до оформлення замовлення!
        </p>

        <Button>
          <Link href="/">Повернутися на головну</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-[6rem] md:mt-[8rem] mx-auto px-4 md:px-10 lg:px-30 py-8 min-h-[85vh]">
      <h1 className="text-2xl font-bold mb-6">Оформлення замовлення</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <CheckoutForm />
        <OrderSummary />
      </div>
    </div>
  );
}
