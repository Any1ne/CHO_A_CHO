"use client";

import Image from "next/image";
import { BasketItemType } from "@/types/products";
type Props = {
  item: BasketItemType;
};

export default function CartItem({ item }: Props) {
  return (
    <div className="flex items-center justify-between gap-2 py-2 border-b">
      <div className="flex items-center gap-3">
        <Image
          src={item.images?.[0] || "/placeholder.png"}
          alt={item.title}
          width={50}
          height={50}
        />
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
