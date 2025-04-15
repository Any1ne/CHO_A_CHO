"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/store";
import BasketItem from "./BasketItem";

export default function BasketItemsList() {
  const items = useSelector((state: RootState) => state.basket.items);

  return (
    <ul className="flex-grow overflow-auto">
      {items.map((item) => (
        <BasketItem key={item.id} item={item} />
      ))}
    </ul>
  );
}
