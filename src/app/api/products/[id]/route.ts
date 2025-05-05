import { NextResponse } from "next/server";
import { redis } from "@/db/redis/client";
import { ProductType } from "@/types/products";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop(); // Отримуємо `id` з URL

    if (!id) {
      return NextResponse.json(
        { error: "Missing product ID" },
        { status: 400 }
      );
    }

    const cached = await redis.get(`product:${id}`);
    if (!cached) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product: ProductType = JSON.parse(cached);
    console.log("🟢 GET /api/products/[id]:");
    return NextResponse.json(product);
  } catch (error) {
    console.error("🔴 Error fetching product by ID:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
