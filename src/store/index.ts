import { configureStore } from "@reduxjs/toolkit";
import basketReducer from "./slices/basketSlice";
import catalogueReducer from "./slices/catalogueSlice";
// import productsReducer from "./slices/productsSlice";
import productModalReducer from "./slices/productModalSlice";

export const store = configureStore({
  reducer: {
    basket: basketReducer,
    catalogue: catalogueReducer,
    // products: productsReducer,
    productModal: productModalReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
