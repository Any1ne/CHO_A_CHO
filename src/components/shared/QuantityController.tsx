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
  onQuantityChange?: (newQty: number) => void;
};

export default function QuantityController({
  productId,
  quantity,
  showRemoveButton = false,
  onQuantityChange,
}: Props) {
  const dispatch = useDispatch();

  const handleDecrease = () => {
    if (onQuantityChange) {
      const newQty = Math.max(1, quantity - 1);
      onQuantityChange(newQty);
    } else {
      dispatch(decreaseQuantity(productId));
    }
  };

  const handleIncrease = () => {
    if (onQuantityChange) {
      onQuantityChange(quantity + 1);
    } else {
      dispatch(increaseQuantity(productId));
    }
  };

  const handleRemove = () => {
    dispatch(removeFromBasket(productId));
  };

  return (
    <div className="flex items-center space-x-2">
      <Button size="sm" variant="outline" onClick={handleDecrease}>
        <Minus />
      </Button>
      <span>{quantity}</span>
      <Button size="sm" variant="outline" onClick={handleIncrease}>
        <Plus />
      </Button>
      {showRemoveButton && (
        <Button size="sm" variant="destructive" onClick={handleRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
