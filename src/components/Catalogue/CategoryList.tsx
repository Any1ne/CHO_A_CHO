"use client";
import { categories } from "@/types";

type Props = {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
};

export default function CategoryList({
  selectedCategory,
  onCategoryChange,
}: Props) {
  return (
    <div className="border-b">
      <ul className="flex gap-3 flex-wrap">
        {categories.map((category) => (
          <li
            key={category}
            className={`cursor-pointer hover:underline whitespace-nowrap ${
              selectedCategory === category ? "font-bold underline" : ""
            }`}
            onClick={() => onCategoryChange(category)}
          >
            {category}
          </li>
        ))}
      </ul>
    </div>
  );
}
