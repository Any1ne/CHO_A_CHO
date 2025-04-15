"use client";

import { BasketItemType } from "@/types/products";
import { useDispatch } from "react-redux";
import {
  increaseQuantity,
  decreaseQuantity,
  removeFromBasket,
} from "@/store/slices/basketSlice";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";

type Props = {
  item: BasketItemType;
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
        <Button
          size="sm"
          variant="destructive"
          onClick={() => dispatch(removeFromBasket(item.id))}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}
