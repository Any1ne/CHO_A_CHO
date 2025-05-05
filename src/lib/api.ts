import { ProductType, FormData } from "@/types/products";

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

export async function fetchProductById(id: string): Promise<ProductType> {
  try {
    const res = await fetch(`/api/products/${id}`);

    if (!res.ok) {
      throw new Error("Failed to fetch product");
    }

    const data = await res.json();
    console.log("🟢 fetchProductById result:", data);
    return data;
  } catch (error) {
    console.error("🔴 fetchProductById error:", error);
    throw new Error("Product fetch error");
  }
}

export async function fetchFlavoursByCategory(
  category: string
): Promise<{ id: string; flavour: string }[]> {
  const res = await fetch(`/api/flavours/${encodeURIComponent(category)}`);
  if (!res.ok) {
    throw new Error("Failed to fetch flavours");
  }

  const data = await res.json();
  console.log("🟢Api fetchFlavoursByCategory result:", data);
  return data;
}

export interface OrderData {
  total: number;
  items: any[];
  data: FormData;
  generateOrderNumber: () => string;
  clearBasket: () => void;
  toast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
  };
  router: {
    push: (path: string) => void;
  };
}

export const submitOrder = async ({
  total,
  items,
  data,
  clearBasket,
  toast,
  router,
}: Omit<OrderData, "generateOrderNumber">) => {
  const orderData = {
    ...data,
    total,
    items,
  };

  const response = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData),
  });

  if (response.ok) {
    clearBasket();
    toast.success("Замовлення успішно оформлено!");
    router.push("/checkout/success");
  } else {
    toast.error("Помилка при створенні замовлення.");
  }
};
