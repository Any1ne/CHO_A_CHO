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
    <section className="py-4 px-30 space-y-4 z-2 ">
      <SortingSearching />
      <CategoryList
        selectedCategory={selectedCategory}
        onCategoryChange={(value) => dispatch(setCategory(value))}
      />
      <ProductGrid />
    </section>
  );
}
