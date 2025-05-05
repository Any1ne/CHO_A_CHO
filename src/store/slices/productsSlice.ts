// import { ProductType } from "@/types/products";
// import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// export interface Product {
//   id: string;
//   name: string;
//   flavour: string;
//   category: string;
// }

// interface ProductsState {
//   list: ProductType[];
// }

// const initialState: ProductsState = {
//   list: [],
// };

// export const productsSlice = createSlice({
//   name: "products",
//   initialState,
//   reducers: {
//     setProducts: (state, action: PayloadAction<ProductType[]>) => {
//       state.list = action.payload;
//     },
//   },
// });

// export const { setProducts } = productsSlice.actions;
// export default productsSlice.reducer;
