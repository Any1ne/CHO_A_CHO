"use client";

import BasketControls from "@/components/Catalogue/BasketControls";
import { RootState } from "@/store";
import { useSelector } from "react-redux";

type Props = {
  title: string;
  description: string;
  price: number;
  id: string;
};

export default function ProductDetails({
  title,
  description,
  price,
  id,
}: Props) {
  const itemInBasket = useSelector((state: RootState) =>
    state.basket.items.find((item) => item.id === id)
  );

  return (
    <div className="shrink w-full md:w-1/2 grid border rounded overflow-hidden">
      {/* Заголовок */}
      <div className="p-4 border-b">
        <h2 className="text-3xl font-bold">{title}</h2>
      </div>

      {/* Пояснення до контролів */}
      <div className="p-4 border-b">
        <p className="text-gray-700">Controls</p>
      </div>

      {/* Ціна + кнопка */}
      <div className="p-4 border-b grid grid-cols-[auto_1fr] items-center gap-4">
        <p className="text-xl font-semibold">${price.toFixed(2)}</p>
        <BasketControls id={id} title={title} price={price} />
      </div>

      {/* Опис */}
      <div className="p-4">
        <p className="text-gray-700">{description}</p>
      </div>
    </div>
  );
}
