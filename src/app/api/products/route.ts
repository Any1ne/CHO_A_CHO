import { NextResponse, NextRequest } from "next/server";
import { redis } from "@/db/redis/client";
import { Pool } from "pg";
import { ProductType } from "@/types/products";
import dotenv from "dotenv";

dotenv.config();

const REDIS_KEY_ALL = "products:all";

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: Number(process.env.POSTGRES_PORT),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  let redisConnected = false;

  try {
    try {
      await redis.ping();
      redisConnected = true;
      console.log("✅ Connected to Redis");
    } catch (err) {
      console.warn("⚠️ Could not connect to Redis");
    }

    let products: ProductType[] = [];

    const ids = redisConnected ? await redis.lrange(REDIS_KEY_ALL, 0, -1) : [];

    if (ids.length > 0) {
      const cached = await Promise.all(
        ids.map((id) => redis.get(`product:${id}`))
      );
      products = cached.map((p) => p && JSON.parse(p)).filter(Boolean);
      console.log(`📦 Loaded ${products.length} products from Redis`);
    } else {
      console.log("🌐 Fetching products from PostgreSQL");

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
        products = result.rows;

        console.log(`✅ Fetched ${products.length} products from PostgreSQL`);

        if (redisConnected) {
          await redis.del(REDIS_KEY_ALL);
          for (const product of products) {
            await redis.set(`product:${product.id}`, JSON.stringify(product));
            await redis.rpush(REDIS_KEY_ALL, product.id);
          }
          console.log("💾 Saved products to Redis");
        }
      } finally {
        client.release();
      }
    }

    if (category && category !== "All") {
      products = products.filter((p) => p.category === category);
      console.log(
        `🔎 Filtered products by category "${category}", left ${products.length}`
      );
    }

    return NextResponse.json(products);
  } catch (error) {
    console.error("🔴 Error handling request:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
