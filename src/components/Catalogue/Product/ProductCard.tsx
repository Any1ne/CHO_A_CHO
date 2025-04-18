import { useState } from "react";
import ProductModal from "@/components/Catalogue/Product/ProductModal";
import BasketControls from "@/components/Catalogue/BasketControls";
import { ProductType } from "@/types/products";

export default function ProductCard({
  id,
  title,
  price,
  images,
  description,
}: ProductType) {
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div
        className={`group bg-white rounded overflow-hidden p-2 h-64 transition-transform duration-300 transform hover:scale-110 hover:shadow hover:border hover:z-10`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className="bg-gray-200 h-32 overflow-hidden rounded cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          {images?.[0] && (
            <img
              src={images[0]}
              alt={title}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <div className="p-3">
          <h3
            className="font-medium overflow-hidden cursor-pointer"
            onClick={() => setIsModalOpen(true)}
          >
            {title}
          </h3>
          <p className="text-sm text-gray-600">${price.toFixed(2)}</p>
          <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <BasketControls id={id} title={title} price={price} />
          </div>
        </div>
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={title}
        description={description || "Немає опису"}
        images={images}
        id={id}
        price={price}
      />
    </>
  );
}
