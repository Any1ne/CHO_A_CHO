"use client";

import Image from "next/image";
import { BasketItem as BasketItemType } from "@/types";
import QuantityController from "@/components/shared/QuantityController";

type Props = {
  item: BasketItemType;
};

export default function BasketItem({ item }: Props) {
  return (
    <li className="flex items-center justify-between gap-4 py-2 border-b">
      {/* Зображення + Назва */}
      <div className="flex items-center gap-3 min-w-50">
        <Image
          src={
            item.preview ||
            "https://petrovka-horeca.com.ua/images/thumbnails/240/290/detailed/16/4424930790_shokolad-belgijskij-s.jpg"
          }
          alt={item.title}
          width={50}
          height={50}
          className="rounded object-cover"
        />
        <div className="text-sm font-medium">{item.title}</div>
      </div>

      {/* Ціна */}
      <div className="w-24 text-center text-sm font-medium">
        ₴{item.price.toFixed(2)}
      </div>

      {/* QuantityController */}
      <QuantityController
        productId={item.id}
        quantity={item.quantity}
        showRemoveButton
      />
    </li>
  );
}
