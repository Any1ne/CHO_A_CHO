"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ProductCard from "@/components/Catalogue/Product/ProductCard";
import SmartPagination from "./SmartPagination";
import { fetchProducts } from "@/lib/api";
import { ProductType } from "@/types/products";
import { useAppSelector } from "@/lib/hooks";

const ITEMS_PER_PAGE = 10;
type Props = {
  selectedCategory: string;
  sortOption: string;
  searchTerm: string;
};

export default function ProductGrid() {
  const selectedCategory = useAppSelector(
    (state) => state.catalogue.selectedCategory
  );
  const sortOption = useAppSelector((state) => state.catalogue.sortOption);
  const searchTerm = useAppSelector((state) => state.catalogue.searchTerm);
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: allProducts = [],
    isLoading,
    error,
  } = useQuery<ProductType[]>({
    queryKey: ["products", selectedCategory],
    queryFn: () => fetchProducts(selectedCategory),
  });

  const filteredProducts = allProducts
    .filter((product) =>
      product.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOption === "low") return a.price - b.price;
      if (sortOption === "high") return b.price - a.price;
      return 0;
    });

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const visibleProducts = filteredProducts.slice(start, end);
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  if (isLoading) return <div>Завантаження...</div>;
  if (error) return <div>Помилка при завантаженні даних</div>;

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-5 sm:grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-5 mt-4 z-2">
        {visibleProducts.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            title={product.title}
            price={product.price}
            description={product.description}
          />
        ))}
      </div>

      <SmartPagination
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </>
  );
}
