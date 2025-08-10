"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/store/types";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

type Props = {
  onClose: () => void;
};

export default function BasketFooter({ onClose }: Props) {
  const isWholesale = useSelector(
    (state: RootState) => state.checkout.checkoutSummary.isWholesale
  );

  const total = useSelector((state: RootState) =>
    state.basket.items.reduce((sum, item) => {
      const price = isWholesale ? item.wholesale_price : item.price;
      return sum + price * item.quantity;
    }, 0)
  );

  const router = useRouter();

  const handleCheckout = () => {
    if (total > 0) {
      router.push("/checkout");
      onClose();
    }
  };

  return (
    <div className="mt-4">
      <div className="flex justify-between font-semibold">
        <span>Сума:</span>
        <span>₴{total.toFixed(2)}</span>
      </div>
      <Button
        className="mt-4 w-full bg-black text-white py-2 rounded"
        onClick={handleCheckout}
        disabled={total === 0}
      >
        Оформити замовлення
      </Button>
    </div>
  );
}
