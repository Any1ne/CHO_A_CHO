"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ProductCard from "./ProductCard";
import SmartPagination from "./SmartPagination";
import { fetchProducts } from "@/lib/api";
import { Product } from "@/types/products";

const ITEMS_PER_PAGE = 10;

export default function ProductGrid() {
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: allProducts = [],
    isLoading,
    error,
  } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const visibleProducts = allProducts.slice(start, end);
  const totalPages = Math.ceil(allProducts.length / ITEMS_PER_PAGE);

  if (isLoading) return <div>Завантаження...</div>;
  if (error) return <div>Помилка при завантаженні даних</div>;

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-5 sm:grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-5">
        {visibleProducts.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            title={product.title}
            price={product.price}
            quantity={1}
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
