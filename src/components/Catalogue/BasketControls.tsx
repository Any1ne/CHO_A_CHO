"use client";

import { Button } from "@/components/ui/button";
import { useDispatch } from "react-redux";
import { addToBasket } from "@/store/slices/basketSlice";
import QuantityController from "@/components/shared/QuantityController";
import { toast } from "sonner";
import { useState } from "react";
import { ShoppingBagIcon, XIcon } from "lucide-react";

type Props = {
  id: string;
  title: string;
  price: number;
  wholesale_price: number; 
  preview: string;
  showQuantityController?: boolean;
};

export default function BasketControls({
  id,
  title,
  price,
  wholesale_price,
  preview,
  showQuantityController = true,
}: Props) {
  const dispatch = useDispatch();
  const [localQty, setLocalQty] = useState(1);

  const handleAddToBasket = () => {
    const quantityToAdd = showQuantityController ? localQty : 1;

    dispatch(addToBasket({ id, title, price, wholesale_price, preview, quantity: quantityToAdd }));

    toast.custom((t) => (
      <div className="relative flex items-start gap-3 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 p-4 shadow-lg w-[320px]">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          Товар <strong>{title}</strong> додано до кошика
        </div>
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-black dark:hover:text-white transition"
          onClick={() => toast.dismiss(t)}
        >
          <XIcon/>
        </button>
      </div>
    ));
    
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
          Додати в кошик
        </Button>
      </div>
    );
  } else {
    return (
      <div className="flex">
        <Button className="grow h-6" onClick={handleAddToBasket}>
        <span className="text-sm">Додати в кошик</span>
        </Button>
      </div>
    );
  }
}
