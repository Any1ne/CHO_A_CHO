"use client";

import { ShoppingBasket } from "lucide-react";
import { Button } from "../ui/button";
import { useSelector } from "react-redux";
import { RootState } from "@/store"; // оновити шлях при потребі
import { Badge } from "../ui/badge"; // можна замінити на кастомний стиль, якщо не використовуєш Badge

type BasketProps = {
  onOpen: () => void;
};

export default function BasketButton({ onOpen }: BasketProps) {
  const itemsCount = useSelector((state: RootState) =>
    state.basket.items.reduce((total, item) => total + item.quantity, 0)
  );

  return (
    <div>
      <Button className="relative" onClick={onOpen}>
        <ShoppingBasket />
        {itemsCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {itemsCount}
          </span>
        )}
        <span className="hidden md:inline">Shoping</span>
      </Button>
    </div>
  );
}
