"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ProductCard from "@/components/Catalogue/Product/ProductCard";
import SmartPagination from "./SmartPagination";
import { setCurrentPage } from "@/store/slices/catalogueSlice";
import { fetchProducts } from "@/lib/api";
import { ProductType } from "@/types/product";
import { useAppSelector, useAppDispatch } from "@/lib/hooks/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

function renderSkeletons(count: number) {
  return Array.from({ length: count }).map((_, i) => (
    <div
      key={i}
      className="flex flex-col rounded-2xl overflow-hidden p-3 border border-gray-200 shadow-sm"
    >
      <Skeleton className="aspect-[4/3] w-full rounded-xl" />
      <div className="mt-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-8 w-full mt-2" />
      </div>
    </div>
  ));
}

export default function ProductGrid() {
  const dispatch = useAppDispatch();

  const selectedCategory = useAppSelector(
    (state) => state.catalogue.selectedCategory
  );
  const sortOption = useAppSelector((state) => state.catalogue.sortOption);
  const searchTerm = useAppSelector((state) => state.catalogue.searchTerm);
  const currentPage = useAppSelector((state) => state.catalogue.currentPage);

  const [itemsPerPage, setItemsPerPage] = useState(24); // default

  // ✅ Визначення кількості колонок по розміру екрану
  useEffect(() => {
    const updateItemsPerPage = () => {
      const width = window.innerWidth;
      let columns = 1;

      if (width >= 1280)
        columns = 6; // xl
      else if (width >= 1024)
        columns = 5; // lg
      else if (width >= 768)
        columns = 4; // md
      else if (width >= 640)
        columns = 3; // sm
      else if (width >= 350)
        columns = 2; // xs
      else columns = 1;

      const rows = 5; // можна змінити, якщо потрібно більше/менше
      setItemsPerPage(columns * rows);
    };

    updateItemsPerPage(); // при першому рендері
    window.addEventListener("resize", updateItemsPerPage);
    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

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

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const visibleProducts = filteredProducts.slice(start, end);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  if (isLoading) {
    return (
      <div
        className="
        grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6
        justify-center gap-x-3 gap-y-5 mt-4
      "
      >
        {renderSkeletons(itemsPerPage)}
      </div>
    );
  }

  if (error) return <div>Помилка при завантаженні даних</div>;

  return (
    <div className="flex flex-col items-center gap-6 mt-4 z-2">
      <div
        className="
        grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6
        justify-center gap-x-3 gap-y-5
      "
      >
        {visibleProducts.map((product) => (
          <Link
            key={product.id}
            href={`/store/${product.id}`}
            prefetch
            className="relative z-0 md:hover:z-10 md:transition-transform md:duration-300 md:hover:scale-110 md:hover:shadow-lg"
          >
            <ProductCard
              id={product.id}
              title={product.title}
              price={product.price}
              wholesale_price={product.wholesale_price}
              preview={product.preview}
              description={product.description}
            />
          </Link>
        ))}
      </div>

      <SmartPagination
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={(page) => dispatch(setCurrentPage(page))}
      />
    </div>
  );
}
