"use client";

import { Progress } from "@/components/ui/progress";
import { CheckCircle } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

export default function FreeDeliveryProgress() {
  const total = useSelector((state: RootState) =>
    state.basket.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
  );

  const freeLimit = 1000;
  const progress = Math.min((total / freeLimit) * 100, 100);
  const isFree = total >= freeLimit;

  return (
    <div className="bg-muted p-4 rounded-lg space-y-2 mt-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Free delivery</p>
          <p className="text-xs text-muted-foreground">
            Order more than {freeLimit}₴ to get free delivery
          </p>
        </div>
        {isFree && <CheckCircle className="text-green-500" size={20} />}
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
