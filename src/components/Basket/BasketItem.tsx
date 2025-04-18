"use client";

import { BasketItemType } from "@/types/products";
import QuantityController from "@/components/shared/QuantityController";

type Props = {
  item: BasketItemType;
};

export default function BasketItem({ item }: Props) {
  return (
    <li className="flex justify-between items-center py-2 border-b space-x-4">
      <span className="flex-1">{item.title}</span>
      <span className="w-24 text-center">${item.price.toFixed(2)}</span>
      <QuantityController
        productId={item.id}
        quantity={item.quantity}
        showRemoveButton
      />
    </li>
  );
}
