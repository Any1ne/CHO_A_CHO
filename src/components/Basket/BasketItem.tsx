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
    <li className="flex gap-4 py-3 border-b items-start">
      {/* Зображення */}
      <div className="relative w-[50px] h-[50px] shrink-0">
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

      {/* Контент: назва, ціна, quantity */}
      <div className="flex flex-wrap gap-x-4 gap-y-4 justify-between flex-1">
        {/* Title + Price */}
        <div className="flex items-end gap-x-6">
          <div className="text-sm font-medium">{item.title}</div>
          <div className="text-md">₴{item.price.toFixed(2)}</div>
        </div>

        {/* QuantityController */}
        <div className="w-full sm:w-auto">
          <QuantityController
            productId={item.id}
            quantity={item.quantity}
            showRemoveButton
          />
        </div>
      </div>
    </li>
  );
}
