import { NextResponse } from "next/server";
import { getRedisOrder } from "@/lib/redisOrder";
import { createMonoInvoice } from "@/lib/monobank";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Invoice is built from the order already saved in Redis (amount + basket for
// fiscalization), so the client only sends the orderId.
export async function POST(request: Request) {
  const { orderId, redirectUrl } = await request.json();

  if (!orderId || !redirectUrl) {
    return NextResponse.json(
      { error: "Missing orderId or redirectUrl" },
      { status: 400 }
    );
  }

  try {
    const order = await getRedisOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const webHookUrl = `${siteUrl}/api/payment/monobank/webhook?orderId=${orderId}`;
    const data = await createMonoInvoice(order, redirectUrl, webHookUrl);

    return NextResponse.json({
      paymentUrl: data.pageUrl,
      invoiceId: data.invoiceId,
    });
  } catch (error: unknown) {
    console.error("[MONO INVOICE] Error:", error);
    const message = error instanceof Error ? error.message : "Невідома помилка";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
