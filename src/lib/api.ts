import { ProductType, FormData } from "@/types/products";

export async function fetchProducts(category?: string): Promise<ProductType[]> {
  const url = new URL("http://localhost/api/products");

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

type OrderPayload = {
  total: number;
  items: any[];
  data: {
    contact: any;
    delivery: any;
    payment: any;
  };
};

export const submitOrder = async ({ total, items, data }: OrderPayload) => {
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

  const json = await response.json();

  if (response.ok && json.orderId) {
    return json; // Повертаємо обʼєкт з orderId
  } else {
    throw new Error(json.error || "Помилка оформлення замовлення");
  }
};

export async function fetchCities() {
  const res = await fetch("/api/nova_poshta/cities");
  if (!res.ok) throw new Error("Failed to fetch cities");
  const data = await res.json();
  return data.cities;
}

export async function fetchWarehouses(cityRef: string) {
  const res = await fetch(`/api/nova_poshta/warehouses?cityRef=${cityRef}`);
  if (!res.ok) throw new Error("Failed to fetch warehouses");
  const data = await res.json();
  return data.warehouses;
}

export async function fetchStreets(cityRef: string) {
  const res = await fetch(`/api/nova_poshta/streets?cityRef=${cityRef}`);
  if (!res.ok) throw new Error("Failed to fetch streets");
  const data = await res.json();
  return data.streets;
}
