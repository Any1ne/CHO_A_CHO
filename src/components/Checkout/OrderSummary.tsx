"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/store";
import CartItem from "./CartItem";

export default function OrderSummary() {
  const items = useSelector((state: RootState) => state.basket.items);
  const total = useSelector((state: RootState) =>
    state.basket.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
  );

  return (
    <div className="w-full border rounded-xl p-6 shadow-sm bg-white h-fit">
      <h2 className="text-lg font-semibold mb-4">Моє замовлення</h2>
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-muted-foreground">Кошик порожній</p>
        ) : (
          items.map((item) => <CartItem key={item.id} item={item} />)
        )}
      </div>

      <div className="mt-6 border-t pt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Доставка:</span>
          <span className="text-green-600 font-medium">Безкоштовно</span>
        </div>
        <div className="flex justify-between font-semibold text-base">
          <span>Сума до оплати:</span>
          <span>₴{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
