export default function ProductGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {[...Array(8)].map((_, index) => (
        <div key={index} className="border p-3 rounded shadow">
          <div className="bg-gray-200 h-32 mb-2" />
          <h3 className="font-medium">Product {index + 1}</h3>
          <p className="text-sm text-gray-600">$29.99</p>
        </div>
      ))}
    </div>
  );
}
