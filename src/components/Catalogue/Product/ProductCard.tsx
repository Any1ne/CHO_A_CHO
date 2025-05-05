"use client";

import { useDispatch } from "react-redux";
import { openProductModal } from "@/store/slices/productModalSlice";
import BasketControls from "@/components/Catalogue/BasketControls";
import { ProductType } from "@/types/products";

export default function ProductCard({
  id,
  title,
  price,
  preview,
  description,
}: ProductType) {
  const dispatch = useDispatch();

  const handleOpenModal = () => {
    dispatch(openProductModal(id));
  };

  return (
    <div
      className={`
        bg-white flex flex-col rounded-2xl overflow-hidden p-3 
        border border-gray-200 md:border-none
        shadow-sm md:shadow-none
        transition-transform duration-300 transform 
        md:hover:scale-105 md:hover:shadow-lg md:hover:z-10
        group max-w-[300px] mx-auto h-90
      `}
    >
      <div
        className="bg-gray-100 aspect-[4/3] overflow-hidden rounded-xl cursor-pointer"
        onClick={handleOpenModal}
      >
        <img
          src={
            preview ||
            "https://petrovka-horeca.com.ua/images/thumbnails/240/290/detailed/16/4424930790_shokolad-belgijskij-s.jpg"
          }
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300"
        />
        )
      </div>

      <div className="p-3 flex flex-col  flex-grow ">
        <h3
          className="font-semibold text-base text-gray-800 line-clamp-2 cursor-pointer min-h-[3rem]"
          onClick={handleOpenModal}
        >
          {title}
        </h3>

        <p className="text-md font-medium text-gray-700">₴{price.toFixed(2)}</p>

        <div
          className="
            mt-2
            md:absolute md:bottom-3 md:left-3 md:right-3
            md:opacity-0 md:group-hover:opacity-100
            transition-opacity duration-300
          "
        >
          <BasketControls
            id={id}
            title={title}
            price={price}
            showQuantityController={false}
          />
        </div>
      </div>
    </div>
  );
}
