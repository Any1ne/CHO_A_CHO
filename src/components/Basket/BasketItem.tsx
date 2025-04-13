"use client";

import { Item } from "@/types/products";
import { useDispatch } from "react-redux";
import { increaseQuantity, decreaseQuantity } from "@/store/slices/basketSlice";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

type Props = {
  item: Item;
};

export default function BasketItem({ item }: Props) {
  const dispatch = useDispatch();

  return (
    <li className="flex justify-between items-center py-2 border-b space-x-4">
      <span className="flex-1">{item.title}</span>
      <span className="w-24 text-center">${item.price.toFixed(2)}</span>

      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => dispatch(decreaseQuantity(item.id))}
        >
          <Minus />
        </Button>
        <span>{item.quantity}</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => dispatch(increaseQuantity(item.id))}
        >
          <Plus />
        </Button>
      </div>
    </li>
  );
}
