"use client";

import { useState } from "react";
import ProductCard from "./ProductCard";
import SmartPagination from "./SmartPagination";

const allProducts = Array.from({ length: 73 }, (_, i) => ({
  id: i + 1,
  title: `Product ${i + 1}`,
  price: 19.99 + i,
}));

const ITEMS_PER_PAGE = 10;

export default function ProductGrid() {
  const [currentPage, setCurrentPage] = useState(1);

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const visibleProducts = allProducts.slice(start, end);
  const totalPages = Math.ceil(allProducts.length / ITEMS_PER_PAGE);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-5 sm:grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-5">
        {visibleProducts.map((product) => (
          <ProductCard
            key={product.id}
            title={product.title}
            price={product.price}
          />
        ))}
      </div>

      <SmartPagination
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={(page) => setCurrentPage(page)}
      />
    </>
  );
}
