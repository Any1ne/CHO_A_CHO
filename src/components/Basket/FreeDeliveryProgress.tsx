"use client";

import { Progress } from "@/components/ui/progress";
import { CheckCircle } from "lucide-react";
import { useSelector,useDispatch } from "react-redux";
import { RootState } from "@/store";
import { useEffect } from "react";
import { updateFreeDelivery } from "@/store/slices/checkoutSlice";

export default function FreeDeliveryProgress() {
  const dispatch = useDispatch();
  const total = useSelector((state: RootState) =>
    state.basket.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
  );

  const freeLimit = 1000;
  const progress = Math.min((total / freeLimit) * 100, 100);
  const isFree = total >= freeLimit;

  // Оновлюємо флаг в checkoutSlice при зміні total
  useEffect(() => {
    dispatch(updateFreeDelivery(total));
  }, [total, dispatch]);

  return (
    <div className="bg-muted p-4 rounded-lg space-y-2 mt-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Безкоштовна доставка</p>
          <p className="text-xs text-muted-foreground">
            Замовляй на суму від {freeLimit}₴ аби отримати безкоштовну доставку
          </p>
        </div>
        {isFree && <CheckCircle className="text-green-500" size={20} />}
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
