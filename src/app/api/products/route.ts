import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  const url =
    category && category !== "All"
      ? `http://localhost:3000/api/json/products?category=${category}`
      : `http://localhost:3000/api/json/products`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error("API responded with error");
    }

    const products = await res.json();
    return NextResponse.json(products);
  } catch (error) {
    console.error("🔴 Error fetching from JSON server:", error);
    return NextResponse.json(
      { error: "Error on accessing server" },
      { status: 500 }
    );
  }
}
