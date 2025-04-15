"use client";

import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  addToBasket,
  increaseQuantity,
  decreaseQuantity,
} from "@/store/slices/basketSlice";
import { RootState } from "@/store";
import { BasketItemType, ProductType } from "@/types/products";
import { useState } from "react";

export default function ProductCard({ id, title, price, images }: ProductType) {
  const [isHovered, setIsHovered] = useState(false);
  const dispatch = useDispatch();

  const itemInBasket = useSelector((state: RootState) =>
    state.basket.items.find((item) => item.id === id)
  );

  const quantity = itemInBasket?.quantity || 0;
  const isInBasket = quantity > 0;

  const handleAddToBasket = () => {
    const item: BasketItemType = { id, title, price, quantity: 1 };
    dispatch(addToBasket(item));
  };

  const handleIncrease = () => {
    dispatch(increaseQuantity(id));
  };

  const handleDecrease = () => {
    dispatch(decreaseQuantity(id));
  };

  return (
    <div
      className={`group bg-white relative rounded overflow-hidden p-2 h-64 transition-transform duration-300 transform hover:scale-110 hover:shadow hover:border hover:z-10`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="bg-gray-200 h-32 overflow-hidden rounded">
        {images && (
          <img
            src={images[0]}
            alt={title}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="p-3">
        {" "}
        {/*Fix: description layout maybde flex-column*/}
        <h3 className="font-medium overflow-hidden">{title}</h3>
        <p className="text-sm text-gray-600">${price.toFixed(2)}</p>
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {!isInBasket ? (
            <Button className="w-full" onClick={handleAddToBasket}>
              Придбати
            </Button>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <Button size="sm" variant="outline" onClick={handleDecrease}>
                <Minus />
              </Button>
              <span>{quantity}</span>
              <Button size="sm" variant="outline" onClick={handleIncrease}>
                <Plus />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
