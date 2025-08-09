import { configureStore } from "@reduxjs/toolkit";
import basketReducer from "./slices/basketSlice";
import catalogueReducer from "./slices/catalogueSlice";
import productModalReducer from "./slices/productModalSlice";
import checkoutSliceReducer from "./slices/checkoutSlice";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const tempStore = configureStore({
  reducer: {
    basket: basketReducer,
    catalogue: catalogueReducer,
    productModal: productModalReducer,
    checkout: checkoutSliceReducer,
  },
});

export type RootState = ReturnType<typeof tempStore.getState>;
export type AppDispatch = typeof tempStore.dispatch;
