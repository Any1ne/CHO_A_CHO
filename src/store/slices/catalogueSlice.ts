import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type CatalogueState = {
  selectedCategory: string;
  sortOption: string;
  searchTerm: string;
};

const initialState: CatalogueState = {
  selectedCategory: "All",
  sortOption: "",
  searchTerm: "",
};

const catalogueSlice = createSlice({
  name: "catalogue",
  initialState,
  reducers: {
    setCategory(state, action: PayloadAction<string>) {
      state.selectedCategory = action.payload;
    },
    setSortOption(state, action: PayloadAction<string>) {
      state.sortOption = action.payload;
    },
    setSearchTerm(state, action: PayloadAction<string>) {
      state.searchTerm = action.payload;
    },
  },
});

export const { setCategory, setSortOption, setSearchTerm } =
  catalogueSlice.actions;
export default catalogueSlice.reducer;
