import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  const url =
    category && category !== "All"
      ? `http://localhost:3001/products?category=${category}`
      : `http://localhost:3001/products`;

  const res = await fetch(url);
  const products = await res.json();

  return NextResponse.json(products);
}
