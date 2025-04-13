import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch("http://localhost:3001/products");
  const products = await res.json();

  return NextResponse.json(products);
}
