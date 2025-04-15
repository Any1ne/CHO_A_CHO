import { ProductType } from "@/types/products";

export async function fetchProducts(category?: string): Promise<ProductType[]> {
  const url = new URL("http://localhost:3000/api/products");

  if (category && category !== "All") {
    url.searchParams.set("category", category);
  }

  const res = await fetch(url.toString());

  if (!res.ok) {
    throw new Error("Помилка при завантаженні продуктів");
  }

  return res.json();
}
