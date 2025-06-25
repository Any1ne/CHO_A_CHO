import { redis } from "@/db/redis/client";
import type { OrderSummary } from "@/types"; // 👈 Підключаємо тип

export async function saveRedisOrder(orderId: string, data: OrderSummary) {
  await redis.set(orderId, JSON.stringify(data), "EX", 3600); // expires in 1 hour
}

export async function updateRedisOrderStatus(orderId: string, status: "paid" | "failed") {
  const data = await redis.get(orderId);
  if (!data) return;

  const parsed: OrderSummary = JSON.parse(data);
  parsed.status = status;
  await redis.set(orderId, JSON.stringify(parsed));
}

export async function getRedisOrder(orderId: string): Promise<OrderSummary | null> {
  const data = await redis.get(orderId);
  if (!data) return null;
  return JSON.parse(data) as OrderSummary;
}
