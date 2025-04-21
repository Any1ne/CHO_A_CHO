"use client";

import { Button } from "@/components/ui/button";
import { useDispatch } from "react-redux";
import { addToBasket } from "@/store/slices/basketSlice";
import QuantityController from "@/components/shared/QuantityController";
import { toast } from "sonner";
import { useState } from "react";
import { ShoppingBagIcon } from "lucide-react";

type Props = {
  id: string;
  title: string;
  price: number;
  showQuantityController?: boolean;
};

export default function BasketControls({
  id,
  title,
  price,
  showQuantityController = true,
}: Props) {
  const dispatch = useDispatch();
  const [localQty, setLocalQty] = useState(1);

  const handleAddToBasket = () => {
    const quantityToAdd = showQuantityController ? localQty : 1;

    dispatch(addToBasket({ id, title, price, quantity: quantityToAdd }));

    if (showQuantityController) {
      setLocalQty(1);
    }

    toast.success(`Товар "${title}" додано до кошика`);
  };

  if (showQuantityController) {
    return (
      <div className="flex space-x-2">
        <QuantityController
          productId={id}
          quantity={localQty}
          onQuantityChange={setLocalQty}
        />
        <Button className="rounded-2xl" onClick={handleAddToBasket}>
          <ShoppingBagIcon />
          Придбати
        </Button>
      </div>
    );
  } else {
    return (
      <div className="flex">
        <Button className="grow" onClick={handleAddToBasket}>
          Придбати
        </Button>
      </div>
    );
  }
}
