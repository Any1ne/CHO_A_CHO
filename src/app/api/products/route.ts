import { NextResponse, NextRequest } from "next/server";
import { redis } from "@/db/redis/client";
import { ProductType } from "@/types/products";

const REDIS_KEY_ALL = "products:all";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  let redisConnected = false;

  try {
    // Перевірка підключення до Redis
    try {
      await redis.ping();
      redisConnected = true;
      console.log("✅ Connected to Redis");
    } catch (err) {
      console.warn("⚠️ Could not connect to Redis");
    }

    const ids = redisConnected ? await redis.lrange(REDIS_KEY_ALL, 0, -1) : [];

    console.log(`🔍 Redis contains ${ids.length} product IDs`);

    let products: ProductType[] = [];

    if (ids.length > 0) {
      const cached = await Promise.all(
        ids.map((id) => redis.get(`product:${id}`))
      );
      products = cached.map((p) => p && JSON.parse(p)).filter(Boolean);
      console.log(`📦 Loaded ${products.length} products from Redis`);
    } else {
      const url =
        category && category !== "All"
          ? `http://localhost:3000/api/json/products?category=${category}`
          : `http://localhost:3000/api/json/products`;

      console.log(`🌐 Fetching products from JSON API: ${url}`);
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch from JSON server");
      products = await res.json();
      console.log(`✅ Fetched ${products.length} products from API`);

      if (redisConnected) {
        await redis.del(REDIS_KEY_ALL);
        for (const product of products) {
          await redis.set(`product:${product.id}`, JSON.stringify(product));
          await redis.rpush(REDIS_KEY_ALL, product.id);
        }
        console.log("💾 Saved products to Redis");
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
    console.error("🔴 Redis/API handler error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
