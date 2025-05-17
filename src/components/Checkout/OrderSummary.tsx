"use client";

import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import CartItem from "./CartItem";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { confirmOrder } from "@/store/slices/checkoutSlice";

export default function OrderSummary() {
  const completedSteps = useSelector(
    (state: RootState) => state.checkout.completedSteps
  );
  const isFreeDelivery = useSelector(
    (state: RootState) => state.checkout.isFreeDelivery
  );
  const isReadyToPay = completedSteps.includes("payment");

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const items = useSelector((state: RootState) => state.basket.items);
  const total = useSelector((state: RootState) =>
    state.basket.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
  );

  const isSubmitting = useSelector(
    (state: RootState) => state.checkout.isSubmitting
  );

  const handleConfirmOrder = () => {
    dispatch(confirmOrder({ router }));
  };

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
  <span className={`font-medium ${isFreeDelivery ? "text-green-600" : "text-red-500"}`}>
    {isFreeDelivery ? "Безкоштовно" : "Не безкоштовно"}
  </span>
</div>
        <div className="flex justify-between font-semibold text-base">
          <span>Сума до оплати:</span>
          <span>₴{total.toFixed(2)}</span>
        </div>
      </div>

      {items.length > 0 && (
        <div className="pt-4 border-t mt-6">
          <div className="font-semibold text-lg mb-2">
            До сплати: ₴{total.toFixed(2)}
          </div>
          <Button
            disabled={!isReadyToPay}
            onClick={() => dispatch(confirmOrder({ router }))}
          >
            Оплатити замовлення
          </Button>
        </div>
      )}
    </div>
  );
}
