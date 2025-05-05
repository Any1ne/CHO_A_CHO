"use client";

import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useDispatch } from "react-redux";
import { removeFromBasket, setQuantity } from "@/store/slices/basketSlice";
import { useState } from "react";

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
  const [inputValue, setInputValue] = useState(quantity);

  const handleDecrease = () => {
    const newQty = Math.max(1, inputValue - 1);
    setInputValue(newQty);
    handleQuantityChange(newQty);
  };

  const handleIncrease = () => {
    const newQty = inputValue + 1;
    setInputValue(newQty);
    handleQuantityChange(newQty);
  };

  const handleQuantityChange = (newQty: number) => {
    if (onQuantityChange) {
      onQuantityChange(newQty);
    } else {
      dispatch(setQuantity({ productId, quantity: newQty }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      const safeValue = Math.max(1, value);
      setInputValue(safeValue);
      handleQuantityChange(safeValue);
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
      <input
        type="number"
        value={inputValue}
        onChange={handleInputChange}
        className="w-12 text-center border rounded h-9"
        min={1}
      />
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
