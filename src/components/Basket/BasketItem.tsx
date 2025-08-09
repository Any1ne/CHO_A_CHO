"use client";

import Image from "next/image";
import { useState } from "react";
import { BasketItem as BasketItemType } from "@/types";
import QuantityController from "@/components/shared/QuantityController";
import { Skeleton } from "@/components/ui/skeleton";
import {useSelector } from "react-redux";
import { RootState } from "@/store/types";

type Props = {
  item: BasketItemType;
};

export default function BasketItem({ item }: Props) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const isWholesale = useSelector((state: RootState) => state.checkout.checkoutSummary.isWholesale);
  const unitPrice = isWholesale ? item.wholesale_price : item.price;
  const isDiscounted = isWholesale && item.wholesale_price !== item.price;
  const totalPrice = item.quantity * unitPrice;

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b">
      {/* Зображення + Назва + ціна */}
      <div className="flex items-center gap-3 flex-1">
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

        <div className="flex flex-col">
          <div className="font-medium">{item.title}</div>
          <div className="text-sm text-muted-foreground">
            {item.quantity} ×{" "}
            {isDiscounted && (
              <span className="line-through text-gray-400 mr-1">
                ₴{item.price.toFixed(2)}
              </span>
            )}
            <span className={isDiscounted ? "text-green-600 font-semibold" : ""}>
              ₴{unitPrice.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Кількість + загальна ціна */}
      <div className="flex flex-col items-end gap-1">
        <QuantityController
          productId={item.id}
          quantity={item.quantity}
          showRemoveButton
        />
        <div className="font-semibold text-right">
          ₴{totalPrice.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
