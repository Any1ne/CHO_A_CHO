import { redis } from "@/db/redis/client";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const REDIS_KEY_ALL = "products:all";
const CACHE_TTL = 60 * 60; // 1 година

type Product = {
  id: number | string;
  title: string;
  price: number;
  category: string;
  flavour: string;
};

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: Number(process.env.POSTGRES_PORT),
});

// 🔁 Отримати всі продукти з PostgreSQL
async function fetchAllProductsFromDB() {
  const client = await pool.connect();
  try {
    const query = `
      SELECT 
        p.id, p.title, p.price, 
        c.name AS category, 
        f.name AS flavour
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN flavours f ON p.flavour_id = f.id
    `;
    const result = await client.query(query);
    const products = result.rows;

    // Зберегти всі продукти одним масивом у Redis з TTL
    await redis.set(REDIS_KEY_ALL, JSON.stringify(products), "EX", CACHE_TTL);

    console.log("🟢 Завантажено продукти з БД та кешовано в Redis");
    return products;
  } finally {
    client.release();
  }
}

// 🧠 Отримати всі продукти з Redis або БД (якщо Redis порожній)
export async function getAllProducts(): Promise<Product[]>{
  try {
    const cached = await redis.get(REDIS_KEY_ALL);

    if (cached) {
      const products = JSON.parse(cached);
      console.log(`📦 Отримано ${products.length} продуктів з Redis`);
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

export async function getProductsByCategory(category: string): Promise<Product[]> {
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

  console.log("🟢 Redis getFlavoursByCategory");
  return flavours;
}
