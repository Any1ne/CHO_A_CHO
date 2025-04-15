import { configureStore } from "@reduxjs/toolkit";
import basketReducer from "./slices/basketSlice";
import catalogueReducer from "./slices/catalogueSlice";

export const store = configureStore({
  reducer: {
    basket: basketReducer,
    catalogue: catalogueReducer,
  },
});

// Типи для useDispatch / useSelector
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
