"use client";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import type { AppDispatch, RootState } from "@/store";
import {
  closeProductModal,
  openProductModalAsync,
} from "@/store/slices/productModalSlice";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProductGallery from "./ProductGallery";
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
      <DialogContent className="w-[100vw] sm:w-[90vw] lg:w-[80vw] h-full md:h-[90vh] lg:h-[80vh] max-w-[100vw] max-h-none p-0 pt-0 overflow-auto ">
      <DialogHeader className=" p-4 border-b md:max-h-[5rem] text-dark bg-primary rounded-b-lg">
          <DialogTitle className="text-3xl font-bold font-sans text-white" >{product ? `Бельгійська шоколадка "${product.category}" "${product.flavour}" ${product.weight}г `: ""}</DialogTitle>
        </DialogHeader>
        
        {loading && (
          <div className="text-center text-gray-500 py-10">Завантаження...</div>
        )}

        {!loading && error && (
          <div className="text-center text-red-500 py-10">Помилка: {error}</div>
        )}

        {!loading && product && (
        <div className="flex flex-col max-w-[100vw]">
          <div className="flex flex-col md:flex-row gap-2 md:gap-10 px-4">
            <ProductGallery
              images={product.preview ? [product.preview] : ["/preview.jpg"]}
              title={product.title}
            />
            <ProductDetails
              title={product.title}
              description={product.description}
              price={product.price}
              id={product.id}
            />
          </div>
          </div>

          
        )}
      </DialogContent>
    </Dialog>
  );
}
