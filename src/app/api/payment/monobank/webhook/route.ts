import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { updateRedisOrderStatus } from "@/lib/redisOrder";

const MONOBANK_PUBLIC_KEY_BASE64 = process.env.MONOBANK_PUBLIC_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signatureBase64 = req.headers.get("x-sign");

    if (!signatureBase64 || !rawBody) {
      return NextResponse.json(
        { error: "Missing signature or body" },
        { status: 400 }
      );
    }

    const publicKeyBuffer = Buffer.from(MONOBANK_PUBLIC_KEY_BASE64, "base64");
    const signatureBuffer = Buffer.from(signatureBase64, "base64");

    const verify = crypto.createVerify("SHA256");
    verify.update(rawBody);
    verify.end();

    const isValid = verify.verify(publicKeyBuffer, signatureBuffer);

    if (!isValid) {
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
