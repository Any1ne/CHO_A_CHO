import { redis } from "@/db/redis/client";
import type { OrderSummary } from "@/types";

export async function saveRedisOrder(orderId: string, data: OrderSummary) {
  await redis.set(orderId, JSON.stringify(data)); // should expire in 1 hour
}

export async function updateRedisOrder(orderId: string, updates: Partial<OrderSummary>) {
  const data = await redis.get(orderId);
  if (!data) return;

  const parsed: OrderSummary = JSON.parse(data);
  const updated = { ...parsed, ...updates };

  await redis.set(orderId, JSON.stringify(updated));
  return updated;
}

export async function updateRedisOrderStatus(
  orderId: string,
  status: "paid" | "failed" | "confirmed"
) {
  return updateRedisOrder(orderId, { status });
}

export async function getRedisOrder(orderId: string): Promise<OrderSummary | null> {
  const data = await redis.get(orderId);
  if (!data) return null;
  return JSON.parse(data) as OrderSummary;
}
