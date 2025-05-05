"use client";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import type { AppDispatch, RootState } from "@/store";
import {
  closeProductModal,
  openProductModalAsync,
} from "@/store/slices/productModalSlice";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Gallery from "./Gallery";
import ProductDetails from "./ProductDetails";

export default function ProductModal() {
  const dispatch = useDispatch<AppDispatch>();
  const { isOpen, productId, product, loading, error } = useSelector(
    (state: RootState) => state.productModal
  );

  useEffect(() => {
    if (isOpen && productId) {
      dispatch(openProductModalAsync(productId));
    }
  }, [isOpen, productId, dispatch]);

  const handleClose = () => {
    dispatch(closeProductModal());
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full md:w-[90vw] lg:w-[80vw] h-[80vh] max-w-none max-h-none p-6 overflow-auto">
        {loading && (
          <div className="text-center text-gray-500 py-10">Завантаження...</div>
        )}

        {!loading && error && (
          <div className="text-center text-red-500 py-10">Помилка: {error}</div>
        )}

        {!loading && product && (
          <div className="flex flex-col md:flex-row gap-2 h-full py-4">
            <Gallery
              images={[
                "https://petrovka-horeca.com.ua/images/detailed/16/4424930790_shokolad-belgijskij-s.jpg",
              ]}
              title={product.title}
            />
            <ProductDetails
              title={product.title}
              description={product.description}
              price={product.price}
              id={product.id}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
