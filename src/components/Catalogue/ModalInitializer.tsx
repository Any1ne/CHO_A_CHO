/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/hooks"; // твій хук
import {
  openProductModal,
  fetchProductSuccess,
  setProductFlavours,
} from "@/store/slices/productModalSlice";
import type { ProductType } from "@/types/product";
import { fetchFlavoursByCategory } from "@/lib/api";

export default function ModalInitializer({
  productId,
  product,
}: {
  productId: string;
  product: ProductType;
}) {
  const dispatch = useAppDispatch();
  const modalState = useAppSelector((s) => s.productModal);

  useEffect(() => {
    if (!productId || !product) return;

    // Якщо модалка вже відкрита для цього productId — нічого не робимо
    if (modalState.isOpen && modalState.productId === productId) {
      // Але якщо flavours відсутні — підвантажимо їх
      if ((modalState.flavours?.length ?? 0) === 0 && product.category) {
        (async () => {
          try {
            const flavours = await fetchFlavoursByCategory(product.category!);
            dispatch(setProductFlavours(flavours));
          } catch (err) {
            // можна логнути
          }
        })();
      }
      return;
    }

    // В іншому випадку — ініціалізуємо модалку та наповнюємо state продуктом
    dispatch(openProductModal(productId));
    dispatch(fetchProductSuccess(product));

    // Якщо product вже має flavours — встановимо їх
    if (product.flavours && product.flavours.length > 0) {
      dispatch(setProductFlavours(product.flavours));
    } else if (product.category) {
      // Інакше підвантажимо flavours по категорії
      (async () => {
        try {
          const flavours = await fetchFlavoursByCategory(product.category!);
          dispatch(setProductFlavours(flavours));
        } catch (err) {
          // логування опціонально
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, product]);
  return null;
}
