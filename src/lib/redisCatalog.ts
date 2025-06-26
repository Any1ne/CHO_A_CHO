import { redis } from "@/db/redis/client";
import dotenv from "dotenv";
import { createClient } from "@/db/supabase/server";

dotenv.config();

const REDIS_KEY_ALL = "products:all";
const CACHE_TTL = 60 * 60; // 1 година

type Product = {
  id: string;
  title: string;
  price: number;
  category: string;
  flavour: string;
  weight: number;
};


// 🔁 Отримати всі продукти з PostgreSQL
async function fetchAllProductsFromDB(): Promise<Product[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_all_products");

  if (error || !data) {
    console.error("🔴 RPC помилка при отриманні продуктів:", error?.message);
    return [];
  }

  // Кешування в Redis
  await redis.set(REDIS_KEY_ALL, JSON.stringify(data), "EX", CACHE_TTL);

  //console.log("🟢 Отримано продукти через Supabase RPC та кешовано в Redis");
  return data;
}

// 🧠 Отримати всі продукти з Redis або БД (якщо Redis порожній)
export async function getAllProducts(): Promise<Product[]> {
  try {
    const cached = await redis.get(REDIS_KEY_ALL);

    if (cached) {
      const products = JSON.parse(cached);
      //console.log(`📦 Отримано ${products.length} продуктів з Redis`);
      return products;
    }
  } catch (err) {
    console.warn("⚠️ Redis недоступний або помилка парсингу:", err);
  }

  // Redis порожній або недоступний
  return await fetchAllProductsFromDB();
}

export async function getProductById(id: string): Promise<Product | null> {
  const products = await getAllProducts();
  return products.find((p) => p.id.toString() === id) || null;
}

export async function getProductsByCategory(
  category: string
): Promise<Product[]> {
  const products = await getAllProducts();
  const filtered = products.filter((p) => p.category === category);
  return filtered;
}

// 🧠 Отримати смаки за категорією
export async function getFlavoursByCategory(category: string) {
  const products = await getProductsByCategory(category);
  const flavours: { id: string; flavour: string }[] = [];
  const seen = new Set<string>();

  for (const product of products) {
    const flavour = product.flavour;
    if (flavour && !seen.has(flavour)) {
      seen.add(flavour);
      flavours.push({ id: product.id.toString(), flavour });
    }
  }

  //console.log("🟢 Redis getFlavoursByCategory");
  return flavours;
}
