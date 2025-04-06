export default function CategoryList() {
  const categories = [
    "All",
    "Mini",
    "Popular",
    "Nuts",
    "Hearts",
    "Shugar free",
    "Big",
  ];

  return (
    <div className="border-b pb-2">
      <h2 className="text-lg font-semibold mb-2">Categories</h2>
      <ul className="flex gap-3 flex-wrap">
        {categories.map((category) => (
          <li
            key={category}
            className="cursor-pointer hover:underline whitespace-nowrap"
          >
            {category}
          </li>
        ))}
      </ul>
    </div>
  );
}
