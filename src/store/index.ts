import { configureStore } from "@reduxjs/toolkit";
import basketReducer from "./slices/basketSlice";
import catalogueReducer from "./slices/catalogueSlice";
// import productsReducer from "./slices/productsSlice";
import productModalReducer from "./slices/productModalSlice";
import checkoutSliceReducer from "./slices/checkoutSlice";
import { basketListenerMiddleware } from "./middleware/basketListener";
import { analyticsMiddleware } from "./middleware/analyticsMiddleware";

export const store = configureStore({
  reducer: {
    basket: basketReducer,
    catalogue: catalogueReducer,
    // products: productsReducer,
    productModal: productModalReducer,
    checkout: checkoutSliceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(basketListenerMiddleware).concat(analyticsMiddleware),
});