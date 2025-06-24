import { NextResponse } from "next/server";
import { getProductById } from "@/lib/redisCatalog";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return NextResponse.json(
        { error: "Missing product ID" },
        { status: 400 }
      );
    }

    const product = await getProductById(id);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    //console.log("🟢 GET /api/products/[id]:", product);
    return NextResponse.json(product);
  } catch (error) {
    console.error("🔴 Error fetching product by ID:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
