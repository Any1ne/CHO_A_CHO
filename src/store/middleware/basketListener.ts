import { getWholesaleTotal } from "@/config/pricing";
import type { Middleware } from "@reduxjs/toolkit";
import type { RootState } from "../types"; // <- не створює циклічність

import {
  addToBasket,
  removeFromBasket,
  increaseQuantity,
  decreaseQuantity,
  setQuantity,
  clearBasket,
  initBasket
} from "../slices/basketSlice";

import { updateWholesale } from "../slices/checkoutSlice";

export const basketListenerMiddleware: Middleware<unknown, RootState> =
  (store) => (next) => (action) => {
    const result = next(action);

    const isBasketAction =
      initBasket.match(action) ||
      addToBasket.match(action) ||
      removeFromBasket.match(action) ||
      increaseQuantity.match(action) ||
      decreaseQuantity.match(action) ||
      setQuantity.match(action) ||
      clearBasket.match(action);

    if (isBasketAction) {
      const { items } = store.getState().basket;

      store.dispatch(updateWholesale(getWholesaleTotal(items)));
    }

    return result;
  };
