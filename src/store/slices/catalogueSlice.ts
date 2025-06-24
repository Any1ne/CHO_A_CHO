import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type CatalogueState = {
  selectedCategory: string;
  sortOption: string;
  searchTerm: string;
  currentPage: number;
};

const initialState: CatalogueState = {
  selectedCategory: "All",
  sortOption: "",
  searchTerm: "",
  currentPage: 1,
};

const catalogueSlice = createSlice({
  name: "catalogue",
  initialState,
  reducers: {
    setSelectedCategory(state, action: PayloadAction<string>) {
      state.selectedCategory = action.payload;
      state.currentPage = 1;
    },
    setSortOption(state, action: PayloadAction<string>) {
      state.sortOption = action.payload;
      state.currentPage = 1;
    },
    setSearchTerm(state, action: PayloadAction<string>) {
      state.searchTerm = action.payload;
      state.currentPage = 1;
    },
    setCurrentPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload;
    },
  },
});

export const { setSelectedCategory, setSortOption, setSearchTerm, setCurrentPage } =
  catalogueSlice.actions;
export default catalogueSlice.reducer;
