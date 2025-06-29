"use client";

import Image from "next/image";
import { useState } from "react";
import { BasketItem as BasketItemType } from "@/types";
import QuantityController from "@/components/shared/QuantityController";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  item: BasketItemType;
};

export default function BasketItem({ item }: Props) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  return (
    <li className="flex items-center justify-between gap-4 py-2 border-b">
      {/* Зображення + Назва */}
      <div className="flex items-center gap-3 min-w-50 relative">
        <div className="relative w-[50px] h-[50px]">
          {!isImageLoaded && (
            <Skeleton className="absolute inset-0 w-full h-full rounded object-cover" />
          )}

          <Image
            src={item.preview || "/preview.jpg"}
            alt={item.title}
            width={50}
            height={50}
            className={`rounded object-cover transition-opacity duration-500 ${
              isImageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setIsImageLoaded(true)}
          />
        </div>

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
