import { NextRequest, NextResponse } from "next/server";
import { getStreets } from "@/lib/redisDelivery";

export async function GET(req: NextRequest) {
  const cityRef = req.nextUrl.searchParams.get("cityRef");

  if (!cityRef) {
    return NextResponse.json({ error: "Missing cityRef" }, { status: 400 });
  }

  try {
    const streets = await getStreets(cityRef);
    return NextResponse.json({ streets });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch streets" },
      { status: 500 }
    );
  }
}
