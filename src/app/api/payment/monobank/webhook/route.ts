import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { updateRedisOrderStatus } from "@/lib/redisOrder";

const MONOBANK_SECRET = process.env.MONOBANK_WEBHOOK_SECRET || "";

export async function POST(req: NextRequest) {
  try {
    //console.log("## MONOBANK WEBHOOK HIT ##")
    const rawBody = await req.text();
    const signature = req.headers.get("x-sign");

    if (!signature || !rawBody) {
      return NextResponse.json({ error: "Missing signature or body" }, { status: 400 });
    }

    const expectedSign = crypto
      .createHmac("sha256", MONOBANK_SECRET)
      .update(rawBody)
      .digest("base64");

    if (signature !== expectedSign) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const { invoiceId, status } = body;

    if (status === "success") {
      await updateRedisOrderStatus(invoiceId, "paid");
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Monobank Webhook Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
