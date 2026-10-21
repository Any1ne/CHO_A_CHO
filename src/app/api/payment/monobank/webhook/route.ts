import { NextRequest, NextResponse } from "next/server";
import { confirmOrderOnServer } from "@/lib/api";
import { updateRedisOrderStatus } from "@/lib/redisOrder";
import {
  acceptWebhookEvent,
  verifyMonoSignature,
  type MonoWebhookPayload,
} from "@/lib/monobank";

// Mono retries the webhook on any non-200 response, so transient failures
// (DB, Redis) return 500 on purpose. Signature / payload errors return 4xx.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const xSign = req.headers.get("x-sign");

  if (!xSign || !rawBody) {
    return NextResponse.json({ error: "Missing signature or body" }, { status: 400 });
  }

  try {
    const isValid = await verifyMonoSignature(rawBody, xSign);
    if (!isValid) {
      console.warn("[MONO WEBHOOK] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as MonoWebhookPayload;
    const orderId = payload.reference || req.nextUrl.searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json({ error: "Missing order reference" }, { status: 400 });
    }

    if (!(await acceptWebhookEvent(payload))) {
      console.log(`[MONO WEBHOOK] Stale event ${payload.status} for ${orderId}, skipped`);
      return NextResponse.json({ received: true, stale: true });
    }

    console.log(`[MONO WEBHOOK] ${orderId} → ${payload.status}`);

    switch (payload.status) {
      case "success":
        await updateRedisOrderStatus(orderId, "paid");
        // Idempotent: confirm route skips orders already saved in DB.
        // If the client redirect is confirming right now, fail with 500 so
        // mono retries — otherwise a failed redirect confirm would lose the order.
        if ((await confirmOrderOnServer(orderId))?.inProgress) {
          throw new Error(`Confirm in progress for ${orderId}, retry later`);
        }
        break;
      case "failure":
      case "expired":
      case "reversed":
        await updateRedisOrderStatus(orderId, "failed");
        break;
      default:
        // created / processing / hold — nothing to do yet.
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[MONO WEBHOOK] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
