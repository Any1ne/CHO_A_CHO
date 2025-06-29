import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { ProductType } from "@/types/product";
import { fetchProductById, fetchFlavoursByCategory } from "@/lib/api";

interface ProductModalState {
  isOpen: boolean;
  productId: string | null;
  product: ProductType | null;
  loading: boolean;
  error: string | null;
  flavours: { id: string; flavour: string }[];
}

const initialState: ProductModalState = {
  isOpen: false,
  productId: null,
  product: null,
  loading: false,
  error: null,
  flavours: [],
};

export const openProductModalAsync = createAsyncThunk(
  "productModal/openProductModalAsync",
  async (productId: string, { dispatch, rejectWithValue }) => {
    dispatch(openProductModal(productId));

    try {
      const product = await fetchProductById(productId);
      dispatch(fetchProductSuccess(product));

      if (product.category) {
        const flavours = await fetchFlavoursByCategory(product.category);
        dispatch(setProductFlavours(flavours));
      }

      return product;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Невідома помилка";
      dispatch(fetchProductFailure(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateProductInModalAsync = createAsyncThunk(
  "productModal/updateProductInModalAsync",
  async (productId: string, { dispatch, rejectWithValue }) => {
    try {
      const product = await fetchProductById(productId);

      dispatch(fetchProductSuccess(product));

      if (product.category) {
        const flavours = await fetchFlavoursByCategory(product.category);
        dispatch(setProductFlavours(flavours));
      }

      return product;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Невідома помилка";
      console.error("Помилка під час оновлення продукту:", errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

const productModalSlice = createSlice({
  name: "productModal",
  initialState,
  reducers: {
    openProductModal: (state, action: PayloadAction<string>) => {
      state.isOpen = true;
      state.productId = action.payload;
      state.loading = true;
      state.error = null;
    },
    closeProductModal: (state) => {
      state.isOpen = false;
      state.productId = null;
      state.product = null;
      state.loading = false;
      state.error = null;
      state.flavours = [];
    },
    fetchProductSuccess: (state, action: PayloadAction<ProductType>) => {
      state.product = action.payload;
      state.loading = false;
    },
    fetchProductFailure: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    setProductFlavours: (
      state,
      action: PayloadAction<{ id: string; flavour: string }[]>
    ) => {
      state.flavours = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateProductInModalAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProductInModalAsync.fulfilled, (state, action) => {
        state.product = action.payload;
        state.loading = false;
      })
      .addCase(updateProductInModalAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  openProductModal,
  closeProductModal,
  fetchProductSuccess,
  fetchProductFailure,
  setProductFlavours,
} = productModalSlice.actions;

export default productModalSlice.reducer;
