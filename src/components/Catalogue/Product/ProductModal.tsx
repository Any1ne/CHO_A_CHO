"use client";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/types";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  closeProductModal,
  openProductModalAsync,
} from "@/store/slices/productModalSlice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import ProductGallery from "./ProductGallery";
import ProductDetails from "./ProductDetails";

export default function ProductModal() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const { isOpen, productId, product, loading, error } = useSelector(
    (state: RootState) => state.productModal
  );

  useEffect(() => {
    if (isOpen && productId && !product) {
      dispatch(openProductModalAsync(productId));
    }
  }, [isOpen, productId, product, dispatch]);

  const handleClose = () => {
    dispatch(closeProductModal());
    router.replace("/store");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[100vw] sm:w-[95vw] lg:w-[90vw] h-full md:h-[90vh] lg:h-[80vh] max-w-[100vw] max-h-none p-0 pt-0 overflow-auto">
        <DialogHeader className="p-4 border-b md:max-h-[5rem] text-dark bg-primary rounded-b-lg">
          <DialogTitle className="text-3xl font-bold font-sans text-white">
            {product ? (
              `Шоколадка "${product.category}" "${product.flavour}" ${product.weight}г`
            ) : (
              <Skeleton className="h-[3rem] w-1/2 bg-white/30 rounded-xl bg-red" />
            )}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col md:flex-row gap-4 px-4 py-6">
            <Skeleton className="w-full md:w-1/2 h-[300px] rounded-lg" />
            <div className="flex flex-col gap-4 flex-1">
              <Skeleton className="h-18 w-full" />
              <Skeleton className="h-12 w-[50%]" />
              <Skeleton className="h-10 w-[80%]" />
              <Skeleton className="h-5 w-[70%]" />
              <Skeleton className="h-10 w-1/2 mt-6" />
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="text-center text-red-500 py-10">Помилка: {error}</div>
        )}

        {!loading && product && (
          <div className="flex flex-col max-w-[100vw]">
            <div className="flex flex-col md:flex-row gap-2 md:gap-4 lg:gap-10 px-4">
              <ProductGallery
                images={product.preview ? [product.preview] : ["/preview.jpg"]}
                title={product.title}
              />
              <ProductDetails
                title={product.title}
                description={product.description!}
                price={product.price}
                wholesale_price={product.wholesale_price}
                id={product.id}
                preview={product.preview!}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
