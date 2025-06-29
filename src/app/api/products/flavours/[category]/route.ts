import { getFlavoursByCategory } from "@/lib/redisCatalog";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const category = decodeURIComponent(url.pathname.split("/").pop() || "");

    if (!category) {
      return NextResponse.json({ error: "Missing category" }, { status: 400 });
    }

    const flavours = await getFlavoursByCategory(category);

    return NextResponse.json(flavours);
  } catch (error) {
    console.error("🔴 Error fetching flavours by category:", error);
    return NextResponse.json(
      { error: "Failed to fetch flavours" },
      { status: 500 }
    );
  }
}
