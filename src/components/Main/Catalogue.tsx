"use client";
import SortingSearching from "@/components/Catalogue/SortingSearching";
import ProductGrid from "@/components/Catalogue/ProductGrid";
import CategoryList from "@/components/Catalogue/CategoryList";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setCategory } from "@/store/slices/catalogueSlice";

export default function Catalogue() {
  const dispatch = useAppDispatch();
  const selectedCategory = useAppSelector(
    (state) => state.catalogue.selectedCategory
  );

  return (
    <section className="p-4 space-y-4">
      <CategoryList
        selectedCategory={selectedCategory}
        onCategoryChange={(value) => dispatch(setCategory(value))}
      />
      <SortingSearching />
      <ProductGrid />
    </section>
  );
}
