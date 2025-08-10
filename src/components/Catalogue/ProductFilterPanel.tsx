"use client";

import { useAppDispatch, useAppSelector } from "@/lib/hooks/hooks";
import {
  setSortOption,
  setSearchTerm,
  setSelectedCategory,
} from "@/store/slices/catalogueSlice";
import { categories } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function ProductFilterPanel() {
  const dispatch = useAppDispatch();
  const sortOption = useAppSelector((state) => state.catalogue.sortOption);
  const searchTerm = useAppSelector((state) => state.catalogue.searchTerm);
  const selectedCategory = useAppSelector(
    (state) => state.catalogue.selectedCategory
  );

  const handleCategoryClick = (category: string) => {
    dispatch(setSelectedCategory(category));
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      {/* Categories */}
      <div className="flex flex-wrap gap-2 md:gap-3 border-b md:border-b-0 pb-2 md:pb-0">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size={"sm"}
            className={`rounded-full text-sm ${
              selectedCategory === category ? "font-semibold" : ""
            }`}
            onClick={() => handleCategoryClick(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full md:w-auto">
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => dispatch(setSearchTerm(e.target.value))}
          placeholder="Пошук шоколаду..."
          className="w-full sm:w-64 h-[2rem]"
        />

        <Select
          value={sortOption}
          onValueChange={(value) => dispatch(setSortOption(value))}
        >
          <SelectTrigger className="w-full sm:w-64 h-[2rem]">
            <SelectValue placeholder="Сортувати" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Сортування за замовчуванням</SelectItem>
            <SelectItem value="low">Ціна: від нижчої</SelectItem>
            <SelectItem value="high">Ціна: від вищої</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
