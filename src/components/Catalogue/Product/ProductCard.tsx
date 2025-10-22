"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/store/types";
import BasketControls from "@/components/Catalogue/BasketControls";
import { ProductType } from "@/types/product";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export default function ProductCard({
  id,
  title,
  price,
  wholesale_price,
  preview,
}: ProductType) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const isWholesale = useSelector(
    (state: RootState) => state.checkout.checkoutSummary.isWholesale
  );
  const displayPrice = isWholesale ? wholesale_price : price;
  const isDiscounted = isWholesale && wholesale_price !== price;

  return (
    // Цей компонент більше не відкриває модалку самостійно — навігацію забезпечує Link у ProductGrid
    <div
      className={`
    bg-white flex flex-col rounded-2xl overflow-hidden p-3 
    border border-gray-200 md:border-none
    shadow-sm md:shadow-none
    transition-transform duration-300 transform 
    md:hover:scale-110 md:hover:shadow-lg
    group max-w-[300px] min-w-[50px] md:min-w-[190px] mx-auto min-mx-2 md:h-[112%]
    z-0
  `}
    >
      {/* При кліку на картку тепер спрацьовує Link; внутрішні кнопки повинні зупиняти propagation */}
      <div className="bg-gray-100 overflow-hidden rounded-xl cursor-pointer relative">
        {!isImageLoaded && (
          <Skeleton className="absolute inset-0 w-full h-full rounded-xl" />
        )}

        <Image
          src={preview || "/preview.jpg"}
          alt={title}
          width={400}
          height={300}
          className={`
            h-full w-full object-cover aspect-[5/4]  transition-opacity duration-500 
            ${isImageLoaded ? "opacity-100" : "opacity-0"}
          `}
          sizes="(max-width: 768px) 100vw, 300px"
          onLoad={() => setIsImageLoaded(true)}
        />
      </div>

      <div className="p-0 md:p-2 flex flex-col flex-grow">
        <h3 className="font-semibold text-base text-gray-800 line-clamp-2 min-h-[3rem]">
          {title}
        </h3>

        <div className="text-md font-medium text-gray-700">
          {isDiscounted && (
            <span className="text-sm text-gray-400 line-through mr-1">
              ₴{price.toFixed(2)}
            </span>
          )}
          <span className={`font-bold ${isDiscounted ? "text-green-600" : ""}`}>
            ₴{displayPrice.toFixed(2)}
          </span>
        </div>

        <div
          className="
            mt-2
            md:absolute md:bottom-3 md:left-3 md:right-3
            md:opacity-0 md:group-hover:opacity-100
            transition-opacity duration-300
          "
          // зупиняємо propagation, щоб кліки по BasketControls не викликали навігацію Link
          onClick={(e) => e.stopPropagation()}
        >
          <BasketControls
            id={id}
            title={title}
            price={price}
            wholesale_price={wholesale_price}
            preview={preview ?? ""}
            showQuantityController={false}
          />
        </div>
      </div>
    </div>
  );
}
