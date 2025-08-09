"use client";

import Image from "next/image";
import { useState } from "react";
import { BasketItem } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import {useSelector } from "react-redux";
import { RootState } from "@/store/types";

type Props = {
  item: BasketItem;
};

export default function CartItem({ item }: Props) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const isWholesale = useSelector((state: RootState) => state.checkout.checkoutSummary.isWholesale);
  const unitPrice = isWholesale ? item.wholesale_price : item.price;
  const isDiscounted = isWholesale && item.wholesale_price !== item.price;
  const totalPrice = item.quantity * unitPrice;

  return (
    <div className="flex items-center justify-between gap-2 py-2 border-b">
      <div className="flex items-center gap-3">
        <div className="relative ">
          {!isImageLoaded && (
            <Skeleton className="absolute inset-0 w-full h-full rounded object-cover" />
          )}
          <Image
            src={
              item.preview ||
              "https://petrovka-horeca.com.ua/images/thumbnails/240/290/detailed/16/4424930790_shokolad-belgijskij-s.jpg"
            }
            alt={item.title}
            width={50}
            height={50}
            className={`rounded object-cover transition-opacity duration-500 ${
              isImageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setIsImageLoaded(true)}
          />
        </div>

        <div>
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
      <div className="font-semibold text-right">
          ₴{totalPrice.toFixed(2)}
        </div>
    </div>
  );
}
