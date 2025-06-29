"use client";

import Image from "next/image";
import { useState } from "react";
import { BasketItem } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  item: BasketItem;
};

export default function CartItem({ item }: Props) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

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
            {item.quantity} x ₴{item.price}
          </div>
        </div>
      </div>
      <div className="font-semibold">
        ₴{(item.quantity * item.price).toFixed(2)}
      </div>
    </div>
  );
}
