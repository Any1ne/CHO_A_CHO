import axiosInstance from "@/lib/axios";
import { ProductType, OrderSummary } from "@/types";
import { toast } from "sonner";
import { AppDispatch } from "@/store";
import { clearBasket } from "@/store/slices/basketSlice";
import { resetCheckout } from "@/store/slices/checkoutSlice";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import axios from "axios";

// Продукти
export async function fetchProducts(category?: string): Promise<ProductType[]> {
  try {
    const res = await axiosInstance.get("/products", {
      params: category && category !== "All" ? { category } : {},
    });
    return res.data;
  } catch (error) {
    console.error("🔴 fetchProducts error:", error);
    throw new Error("Не вдалося отримати продукти");
  }
}

export async function fetchProductById(id: string): Promise<ProductType> {
  try {
    const res = await axiosInstance.get(`/products/${id}`);
    return res.data;
  } catch (error) {
    console.error("🔴 fetchProductById error:", error);
    throw new Error("Не вдалося отримати продукт");
  }
}

export async function fetchFlavoursByCategory(category: string): Promise<{ id: string; flavour: string }[]> {
  try {
    const res = await axiosInstance.get(`/products/flavours/${encodeURIComponent(category)}`);
    return res.data;
  } catch (error) {
    console.error("🔴 fetchFlavoursByCategory error:", error);
    throw new Error("Не вдалося отримати смаки");
  }
}

// Статус замовлення
export async function fetchOrderStatus(orderId: string): Promise<{
  isPaid: boolean;
  orderData: OrderSummary | null;
}> {
  try {
    const res = await axiosInstance.get("/orders", { params: { orderId } });

    console.log("--fetchOrderStatus --", res)
    if (!res.data.success || !res.data.order) {
      return {
        isPaid: false,
        orderData: null,
      };
    }

    return {
      isPaid: res.data.order.status === "paid",
      orderData: res.data.order,
    };
  } catch (error) {
    console.error("🔴 fetchOrderStatus error:", error);
    return {
      isPaid: false,
      orderData: null,
    };
  }
}

// Зберегти замовлення в БД
export async function submitOrder(order: OrderSummary) {
  try {
    const res = await axiosInstance.post("/orders", order);
    return res.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || "Помилка оформлення замовлення");
    }
    throw new Error("Невідома помилка оформлення замовлення");
  }
}


// Nova Poshta
export async function fetchCities() {
  try {
    const res = await axiosInstance.get("/delivery/nova-poshta/cities");
    return res.data.cities;
  } catch (error) {
    console.error("🔴 fetchCities error:", error);
    throw new Error("Не вдалося завантажити міста");
  }
}

export async function fetchWarehouses(cityRef: string) {
  try {
    const res = await axiosInstance.get("/delivery/nova-poshta/warehouses", {
      params: { cityRef },
    });
    return res.data.warehouses;
  } catch (error) {
    console.error("🔴 fetchWarehouses error:", error);
    throw new Error("Не вдалося завантажити відділення");
  }
}

export async function fetchStreets(cityRef: string) {
  try {
    const res = await axiosInstance.get("/delivery/nova-poshta/streets", {
      params: { cityRef },
    });
    return res.data.streets;
  } catch (error) {
    console.error("🔴 fetchStreets error:", error);
    throw new Error("Не вдалося завантажити вулиці");
  }
}

// Контактна форма
export async function sendContactRequest(data: { name: string; email: string; message: string }) {
  try {
    const res = await axiosInstance.post("/contact", data);
    return res.data;
  } catch (error: unknown) {
  if (axios.isAxiosError(error)) {
    throw new Error(error.response?.data?.error || "Помилка ...");
  }
  throw new Error("Невідома помилка ...");
}

}

// Redis — збереження замовлення
export async function saveRedisOrderToServer(orderData: OrderSummary) {
  try {
    const res = await axiosInstance.post("/orders/redis-order", {
      orderData,
      status: orderData.status,
    });
    return res.data;
  } catch (error) {
    console.error("🔴 saveRedisOrderToServer error:", error);
    throw new Error("Не вдалося зберегти замовлення у Redis");
  }
}

// Redis — отримання замовлення
export async function fetchRedisOrder(orderId: string): Promise<OrderSummary> {
  try {
    const res = await axiosInstance.get("/orders/redis-order", {
      params: { orderId },
    });
    return res.data.orderData;
  } catch (error) {
    console.error("🔴 fetchRedisOrder error:", error);
    throw new Error("Не вдалося отримати замовлення з Redis");
  }
}

//Check Invoice - перевірка статусу оплати
export const checkInvoiceStatus = async (invoiceId: string) => {
  const apiToken = process.env.MONOBANK_API_TOKEN;
  const response = await fetch(
    `https://api.monobank.ua/api/merchant/invoice/status?invoiceId=${invoiceId}`,
    {
      headers: {
        "X-Token": apiToken!,
      },
    }
  );

  console.log("--STATUS--", response.json);
  if (!response.ok) {
    throw new Error("Не вдалося перевірити статус платежу");
  }

  return await response.json(); // буде обʼєкт з полем `status`
};

export const confirmOrderOnServer = async (orderId: string) => {
  try {
    const response = await axiosInstance.post(`/orders/confirm?orderId=${orderId}`);
    return response.data;
  } catch (error: unknown) {
  if (axios.isAxiosError(error)) {
    throw new Error(error.response?.data?.error || "Помилка ...");
  }
  throw new Error("Невідома помилка ...");
}

};

export const handleOrderConfirmation = async (
  orderId: string,
  dispatch: AppDispatch,
  router: AppRouterInstance
) => {
  const result = await confirmOrderOnServer(orderId);

  if (result?.success || result?.alreadyExists) {
    dispatch(clearBasket());
    dispatch(resetCheckout());
    toast.success("Замовлення підтверджено!");
    router.replace(`/checkout/success?orderId=${orderId}`);
  } else {
    toast.error(result?.error || "Помилка під час підтвердження.");
    router.replace("/");
  }
};
