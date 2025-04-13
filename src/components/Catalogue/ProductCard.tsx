"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { addToBasket } from "@/store/slices/basketSlice";
import { Item } from "@/types/products";

export default function ProductCard({ id, title, price, image }: Item) {
  const [isHovered, setIsHovered] = useState(false);
  const dispatch = useDispatch();

  const handleAddToBasket = () => {
    dispatch(addToBasket({ id, title, price, quantity: 1 }));
    console.log(`dispatch(addToBasket({ ${id}, ${title}, ${price}))`);
  };

  return (
    <div
      className={`group bg-white relative rounded overflow-hidden p-2 h-64 transition-transform duration-300 transform hover:scale-110 hover:shadow hover:border hover:z-10`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="bg-gray-200 h-32 overflow-hidden rounded">
        {image && (
          <img src={image} alt={title} className="h-full w-full object-cover" />
        )}
      </div>

      <div className="p-3">
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-gray-600">${price.toFixed(2)}</p>
      </div>

      <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <Button className="w-full" onClick={handleAddToBasket}>
          Придбати
        </Button>
      </div>
    </div>
  );
}
