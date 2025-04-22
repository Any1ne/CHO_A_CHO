"use client";
type Props = {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
};

export default function CategoryList({
  selectedCategory,
  onCategoryChange,
}: Props) {
  const categories = [
    "All",
    "Mini",
    "Popular",
    "Nutty",
    "Hearts",
    "Shugar free",
    "Big",
  ];

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
