import { Product } from "@/types/products";

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch("http://localhost:3001/products");

  if (!res.ok) {
    throw new Error("Помилка при завантаженні продуктів");
  }

  return res.json();
}
