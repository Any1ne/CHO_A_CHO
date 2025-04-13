export default function Filters() {
  return (
    <div className="flex items-center gap-4">
      <select className="border p-1 rounded">
        <option>Sort by</option>
        <option>Price: Low to High</option>
        <option>Price: High to Low</option>
      </select>
      <input
        type="text"
        placeholder="Search products..."
        className="border p-1 rounded flex-1"
      />
    </div>
  );
}
