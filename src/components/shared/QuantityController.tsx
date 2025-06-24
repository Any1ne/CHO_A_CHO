"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [inputValue, setInputValue] = useState<string>(quantity.toString());

  const handleDecrease = () => {
    const newQty = Math.max(1, parseInt(inputValue || "1", 10) - 1);
    setInputValue(newQty.toString());
    handleQuantityChange(newQty);
  };

  const handleIncrease = () => {
    const newQty = parseInt(inputValue || "1", 10) + 1;
    setInputValue(newQty.toString());
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
    setInputValue(e.target.value);
  };

  const handleBlur = () => {
    const parsed = parseInt(inputValue, 10);
    const safeValue = isNaN(parsed) || parsed < 1 ? 1 : parsed;
    setInputValue(safeValue.toString());
    handleQuantityChange(safeValue);
  };

  const handleRemove = () => {
    dispatch(removeFromBasket(productId));
  };

  return (
    <div className="flex items-center space-x-2">
      <Button size="sm" variant="outline" onClick={handleDecrease}>
        <Minus className="h-4 w-4" />
      </Button>
      <Input
        type="number"
        min={1}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        className="w-14 h-8 text-center px-1"
      />
      <Button size="sm" variant="outline" onClick={handleIncrease}>
        <Plus className="h-4 w-4" />
      </Button>
      {showRemoveButton && (
        <Button size="sm" variant="destructive" onClick={handleRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
