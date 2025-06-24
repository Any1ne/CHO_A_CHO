import { NextRequest, NextResponse } from "next/server";
import { getWarehouses } from "@/lib/redisDelivery";

export async function GET(req: NextRequest) {
  const cityRef = req.nextUrl.searchParams.get("cityRef");

  if (!cityRef) {
    return NextResponse.json({ error: "Missing cityRef" }, { status: 400 });
  }

  try {
    const warehouses = await getWarehouses(cityRef);
    return NextResponse.json({ warehouses });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch warehouses" },
      { status: 500 }
    );
  }
}
