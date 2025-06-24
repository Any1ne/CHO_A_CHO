import { NextRequest, NextResponse } from "next/server";
import { saveRedisOrder, getRedisOrder } from "@/lib/redisOrder";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderData, status } = body;

    if (!orderData) {
      return NextResponse.json({ message: "Missing order data" }, { status: 400 });
    }

    const orderId = orderData.orderId;
    await saveRedisOrder(orderId, { ...orderData, status });

    return NextResponse.json({ orderId }, { status: 200 });
  } catch (error) {
    console.error("Redis order error (POST):", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  //console.log("--Server GET ORDER REQUEST--");

  try {
    const orderId = request.nextUrl.searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json({ message: "Missing orderId" }, { status: 400 });
    }

    const orderData = await getRedisOrder(orderId);

    if (!orderData) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ orderData }, { status: 200 });
  } catch (error) {
    console.error("Redis order error (GET):", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
