"use client";

import { Button } from "@/components/ui/button";
import { useDispatch, useSelector } from "react-redux";
import { addToBasket } from "@/store/slices/basketSlice";
import { RootState } from "@/store";
import QuantityController from "@/components/shared/QuantityController";

export default function BasketControls({
  id,
  title,
  price,
}: {
  id: string;
  title: string;
  price: number;
}) {
  const dispatch = useDispatch();
  const itemInBasket = useSelector((state: RootState) =>
    state.basket.items.find((item) => item.id === id)
  );

  const quantity = itemInBasket?.quantity || 0;

  if (!quantity) {
    return (
      <Button
        className="w-full"
        onClick={() => dispatch(addToBasket({ id, title, price, quantity: 1 }))}
      >
        Придбати
      </Button>
    );
  }

  return <QuantityController productId={id} quantity={quantity} />;
}
