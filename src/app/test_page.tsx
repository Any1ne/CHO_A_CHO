import { useEffect, useState } from "react";

export default function Home() {
  interface Product {
    id: number;
    name: string;
    price: number;
  }

  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/products")
      .then((res) => res.json())
      .then((data: Product[]) => setProducts(data))
      .catch((error) => console.error("Error fetching products:", error));
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Chocolate Shop</h1>
      <ul>
        {products.map((product) => (
          <li key={product.id} className="border p-2 my-2">
            {product.name} - ${product.price}
          </li>
        ))}
      </ul>
    </div>
  );
}
