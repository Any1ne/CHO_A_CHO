"use client";
import BasketControls from "@/components/Catalogue/BasketControls";

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
  return (
    <div className="w-full md:w-1/2 flex flex-col gap-6 border-1 p-4">
      <div className="border-b-1 p-1">
        <h2 className="text-3xl font-bold mb-2">{title}</h2>
      </div>

      <div className="border-b-1 p-1">
        <p className="text-gray-700 mb-4">Controls</p>
      </div>

      <div className="border-b-1 flex gap-4 p-1">
        <p className="text-xl font-semibold">${price.toFixed(2)}</p>
        <div>
          <BasketControls id={id} title={title} price={price} />
        </div>
      </div>

      <div className="border-b-1 p-1">
        <p className="text-gray-700 mb-4">{description}</p>
      </div>
    </div>
  );
}
