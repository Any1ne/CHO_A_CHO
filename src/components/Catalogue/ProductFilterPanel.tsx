"use client";

import { useAppDispatch, useAppSelector } from "@/lib/hooks/hooks";
import {
  setSortOption,
  setSearchTerm,
  setSelectedCategory,
} from "@/store/slices/catalogueSlice";

export default function ProductFilterPanel() {
  const dispatch = useAppDispatch();
  const sortOption = useAppSelector((state) => state.catalogue.sortOption);
  const searchTerm = useAppSelector((state) => state.catalogue.searchTerm);
  const selectedCategory = useAppSelector(
    (state) => state.catalogue.selectedCategory
  );

  const categories = [
    "All",
    "Mini",
    "Popular",
    "Nutty",
    "Hearts",
    "Shugar Free",
    "Big",
  ];

  const handleCategoryClick = (category: string) => {
    dispatch(setSelectedCategory(category));
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      {/* Categories */}
      <div className="flex flex-wrap gap-2 md:gap-3 border-b md:border-b-0 pb-2 md:pb-0">
        {categories.map((category) => (
          <button
            key={category}
            className={`px-3 py-1 rounded-full text-sm transition-colors duration-200
              ${
                selectedCategory === category
                  ? "bg-black text-white font-semibold"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }
            `}
            onClick={() => handleCategoryClick(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full md:w-auto">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => dispatch(setSearchTerm(e.target.value))}
          placeholder="Пошук шоколаду..."
          className="border border-gray-300 rounded px-3 py-1 w-full sm:w-64"
        />
        <select
          value={sortOption}
          onChange={(e) => dispatch(setSortOption(e.target.value))}
          className="border border-gray-300 rounded px-3 py-1"
        >
          <option value="">Сортувати</option>
          <option value="low">Ціна: від нижчої</option>
          <option value="high">Ціна: від вищої</option>
        </select>
      </div>
    </div>
  );
}
