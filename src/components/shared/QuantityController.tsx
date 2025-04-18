"use client";

import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useDispatch } from "react-redux";
import {
  increaseQuantity,
  decreaseQuantity,
  removeFromBasket,
} from "@/store/slices/basketSlice";

type Props = {
  productId: string;
  quantity: number;
  showRemoveButton?: boolean;
};

export default function QuantityController({
  productId,
  quantity,
  showRemoveButton = false,
}: Props) {
  const dispatch = useDispatch();

  return (
    <div className="flex items-center space-x-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => dispatch(decreaseQuantity(productId))}
      >
        <Minus />
      </Button>
      <span>{quantity}</span>
      <Button
        size="sm"
        variant="outline"
        onClick={() => dispatch(increaseQuantity(productId))}
      >
        <Plus />
      </Button>
      {showRemoveButton && (
        <Button
          size="sm"
          variant="destructive"
          onClick={() => dispatch(removeFromBasket(productId))}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
