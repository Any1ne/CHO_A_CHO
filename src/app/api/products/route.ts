import { NextRequest, NextResponse } from "next/server";
import { getAllProducts } from "@/lib/redisCatalog";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let products = await getAllProducts();

    console.log(`Category ${category}`);

    if (category && category !== "All") {
      products = products.filter((p) => p.category === category);
    }

    return NextResponse.json(products);
  } catch (err) {
    console.error("🔴 Error fetching products:", err);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
