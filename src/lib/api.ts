import { ProductType } from "@/types/products";

export async function fetchProducts(category?: string): Promise<ProductType[]> {
  const url = new URL("http://134.249.60.9:3000/api/products");

  if (category && category !== "All") {
    url.searchParams.set("category", category);
  }

  try {
    const res = await fetch(url.toString());

    if (!res.ok) {
      throw new Error("Error on API handler");
    }

    return await res.json();
  } catch (error) {
    console.error("🔴 fetchProducts error:", error);
    throw new Error("Error on API handler or Error on accessing server");
  }
}
