import crypto from "crypto";
import { redis } from "@/db/redis/client";
import type { OrderSummary } from "@/types";

// Server-only helpers for Monobank acquiring. Never import from client code —
// they read MONOBANK_API_TOKEN.

const MONO_API = "https://api.monobank.ua/api/merchant";

export type MonoInvoiceStatus =
  | "created"
  | "processing"
  | "hold"
  | "success"
  | "failure"
  | "reversed"
  | "expired";

export type MonoWebhookPayload = {
  invoiceId: string;
  status: MonoInvoiceStatus;
  amount: number;
  ccy: number;
  reference?: string;
  modifiedDate: string;
  failureReason?: string;
};

export type MonoBasketItem = {
  name: string;
  qty: number;
  sum: number; // unit price, kopecks
  total: number; // sum * qty, kopecks
  code: string;
  unit: string;
};

export type MonoFiscalCheck = {
  id: string;
  type: string;
  status: "new" | "process" | "done" | "failed";
  statusDescription?: string;
  taxUrl?: string;
  file?: string; // base64 PDF
  fiscalizationSource?: string;
};

function getToken() {
  const token = process.env.MONOBANK_API_TOKEN;
  if (!token) throw new Error("MONOBANK_API_TOKEN missing");
  return token;
}

async function monoFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${MONO_API}${path}`, {
    ...init,
    headers: {
      "X-Token": getToken(),
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Monobank ${path} ${res.status}: ${text}`);
  }
  return JSON.parse(text) as T;
}

// Basket lines go to the PRRO (Checkbox) as fiscal receipt positions.
// Mono rejects the invoice unless amount === Σ(sum * qty), so the invoice
// amount is derived from the basket, not from the client-side total.
export function buildBasketOrder(order: OrderSummary): MonoBasketItem[] {
  const isWholesale = order.checkoutSummary.isWholesale;
  return order.items.map((item) => {
    const unitPrice = isWholesale ? item.wholesale_price : item.price;
    const sum = Math.round(unitPrice * 100);
    return {
      name: item.title,
      qty: item.quantity,
      sum,
      total: sum * item.quantity,
      code: String(item.id),
      unit: "шт.",
    };
  });
}

export async function createMonoInvoice(
  order: OrderSummary,
  redirectUrl: string,
  webHookUrl: string
) {
  const basketOrder = buildBasketOrder(order);
  const amount = basketOrder.reduce((acc, line) => acc + line.total, 0);

  if (amount !== Math.round(order.total * 100)) {
    console.warn(
      `[MONO] Basket sum ${amount} != order total ${order.total * 100} for ${order.orderId}`
    );
  }

  const email = order.checkoutSummary.contactInfo?.email;

  return monoFetch<{ invoiceId: string; pageUrl: string }>("/invoice/create", {
    method: "POST",
    body: JSON.stringify({
      amount,
      ccy: 980,
      redirectUrl,
      webHookUrl,
      merchantPaymInfo: {
        reference: order.orderId,
        destination: `Оплата замовлення ${order.orderId}`,
        // Mono forwards the PRRO fiscal receipt to these addresses.
        customerEmails: email ? [email] : [],
        basketOrder,
      },
    }),
  });
}

export async function getMonoInvoiceStatus(invoiceId: string) {
  return monoFetch<MonoWebhookPayload>(
    `/invoice/status?invoiceId=${encodeURIComponent(invoiceId)}`
  );
}

export async function getMonoFiscalChecks(invoiceId: string) {
  const data = await monoFetch<{ checks: MonoFiscalCheck[] }>(
    `/invoice/fiscal-checks?invoiceId=${encodeURIComponent(invoiceId)}`
  );
  return data.checks ?? [];
}

// ---------- Webhook signature ----------

let cachedPubKey: string | null = null;

async function fetchMonoPubKey(): Promise<string> {
  const data = await monoFetch<{ key: string }>("/pubkey");
  return data.key;
}

function verifyWithKey(pubKeyBase64: string, rawBody: string, xSign: string) {
  const verify = crypto.createVerify("SHA256");
  verify.update(rawBody);
  verify.end();
  return verify.verify(
    Buffer.from(pubKeyBase64, "base64"),
    Buffer.from(xSign, "base64")
  );
}

// Mono rotates the key occasionally: on a failed check, refetch once and retry.
export async function verifyMonoSignature(rawBody: string, xSign: string) {
  if (!cachedPubKey) {
    cachedPubKey = process.env.MONOBANK_PUBLIC_KEY || (await fetchMonoPubKey());
  }
  if (verifyWithKey(cachedPubKey, rawBody, xSign)) return true;

  const fresh = await fetchMonoPubKey();
  if (fresh === cachedPubKey) return false;
  cachedPubKey = fresh;
  return verifyWithKey(fresh, rawBody, xSign);
}

// ---------- Webhook ordering ----------

// Mono does not guarantee delivery order; a late "processing" must not
// override an earlier-delivered "success". Returns false for stale events.
export async function acceptWebhookEvent(payload: MonoWebhookPayload) {
  const key = `mono:invoice:${payload.invoiceId}:modified`;
  const incoming = Date.parse(payload.modifiedDate);
  const previous = Number(await redis.get(key)) || 0;

  if (incoming && incoming < previous) return false;

  await redis.set(key, String(incoming || Date.now()), "EX", 60 * 60 * 24 * 7);
  return true;
}
