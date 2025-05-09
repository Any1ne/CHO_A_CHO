import { NextResponse } from "next/server";
import { getCities } from "@/lib/redisDelivery";

export async function GET() {
  try {
    const cities = await getCities();
    return NextResponse.json({ cities });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch cities" },
      { status: 500 }
    );
  }
}
