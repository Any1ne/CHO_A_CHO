import { redis } from "@/db/redis/client";
import dotenv from "dotenv";
import { createClient } from "@/db/supabase/server";
import pool from "@/db/postgres/client";
import { ProductType } from "@/types";

dotenv.config();

const LOCAL_MODE = process.env.LOCAL_MODE === "true";
const REDIS_KEY_ALL = "products:all";
const CACHE_TTL = 60 * 60; // 1 година

// 🔁 Отримати всі продукти з PostgreSQL
async function fetchAllProductsFromDB(): Promise<ProductType[]> {
  let data: ProductType[] = [];

  if (!LOCAL_MODE) {
    // console.log("🟢 Використовується Supabase RPC");

    const supabase = await createClient();

    const { data: rpcData, error } = await supabase.rpc("get_all_products");

    if (error || !rpcData) {
      console.error("🔴 RPC помилка:", error?.message);
      return [];
    }
    data = rpcData;
  }
  else {
    console.log("🧩 Використовуєzться локальний Postgres через Pool");
    const result = await pool.query("SELECT * FROM public.get_all_products();");
    data = result.rows;
  }

  // node-postgres returns `numeric` columns as strings ("19.50"); keep
  // wholesale_price a number on both the Supabase and local paths.
  data = data.map((p) => ({ ...p, wholesale_price: Number(p.wholesale_price) }));

  // Кешування в Redis
  await redis.set(REDIS_KEY_ALL, JSON.stringify(data), "EX", CACHE_TTL);
  // console.log(`🧩 ${JSON.stringify(data)}`);
  return data;
}

// 🧠 Отримати всі продукти з Redis або БД (якщо Redis порожній)
export async function getAllProducts(): Promise<ProductType[]> {
  try {
    const cached = await redis.get(REDIS_KEY_ALL);

    if (cached) {
      const products = JSON.parse(cached);
      return products;
    }
  } catch (err) {
    console.warn("⚠️ Redis недоступний або помилка парсингу:", err);
  }

  // Redis порожній або недоступний
  return await fetchAllProductsFromDB();
}

export async function getProductById(id: string): Promise<ProductType | null> {
  const products = await getAllProducts();
  return products.find((p) => p.id.toString() === id) || null;
}

export async function getProductsByCategory(
  category: string
): Promise<ProductType[]> {
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
  return flavours;
}
