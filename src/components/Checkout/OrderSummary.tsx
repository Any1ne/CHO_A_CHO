"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/types";
import CartItem from "./CartItem";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { placeOrder } from "@/store/slices/checkoutSlice";
import { Loader2 } from "lucide-react"; // для анімації спінера

export default function OrderSummary() {
  const [isClicked, setIsClicked] = useState(false);

  const completedSteps = useSelector((state: RootState) => state.checkout.completedSteps);
  const isWholesale = useSelector((state: RootState) => state.checkout.checkoutSummary.isWholesale);
  const isSubmitting = useSelector((state: RootState) => state.checkout.isSubmitting);
  const items = useSelector((state: RootState) => state.basket.items);

  const total = useSelector((state: RootState) =>
    state.basket.items.reduce((sum, item) => {
      const price = isWholesale ? item.wholesale_price : item.price;
      return sum + price * item.quantity;
    }, 0)
  );

  const isReadyToPay = completedSteps.includes("payment");
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const handlePlaceOrder = () => {
    if (isClicked || isSubmitting) return;
    setIsClicked(true);
    dispatch(placeOrder({ router }));
  };

  return (
    <div className="w-full border rounded-xl p-6 shadow-sm bg-white h-fit">
      <h2 className="text-lg font-semibold mb-4">Моє замовлення</h2>

      <div className="pr-4 max-h-[400px] md:max-h-[150px] overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-muted-foreground">Кошик порожній</p>
        ) : (
          items.map((item) => <CartItem key={item.id} item={item} />)
        )}
      </div>

      <div className="mt-6 border-t pt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Доставка:</span>
          <span className={`font-medium ${isWholesale ? "text-green-600" : "text-red-500"}`}>
            {isWholesale ? "Безкоштовно" : "Не безкоштовно"}
          </span>
        </div>
        <div className="flex justify-between font-semibold text-base">
          <span>Сума до оплати:</span>
          <span>₴{total.toFixed(2)}</span>
        </div>
      </div>

      {items.length > 0 && (
        <div className="pt-4 border-t mt-6">
          <div className="font-semibold text-lg mb-2">До сплати: ₴{total.toFixed(2)}</div>
          <Button
            disabled={!isReadyToPay || isSubmitting || isClicked}
            onClick={handlePlaceOrder}
          >
            {(isSubmitting || isClicked) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Обробка замовлення...
              </>
            ) : (
              "Оплатити замовлення"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
