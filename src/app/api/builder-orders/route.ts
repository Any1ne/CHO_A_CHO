// API endpoint for builder submission flow.
//
// Accepts the assembled order payload (customer + order metadata + asset
// URLs that the client already uploaded to Supabase Storage) and dispatches
// an admin email via Resend. No DB persistence yet — `builder_orders`
// Postgres table is a follow-up; the email contains everything needed to
// fulfil an order in the meantime.
//
// Recipient is hardcoded for the development phase — see ADMIN_RECIPIENT
// below. Swap to ADMIN_EMAIL env var once the staging value is settled.

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { generateBuilderOrderEmailHtml } from "@/lib/email/generateBuilderOrderEmailHtml";
import type { SubmissionDesignElement } from "@/lib/builder/designElements";

// TODO: replace with ADMIN_EMAIL env var once the staging value is set.
const ADMIN_RECIPIENT = "anytguy@gmail.com";

const LOCAL_MODE = process.env.LOCAL_MODE === "true";

interface BuilderOrderPayload {
  customer: {
    name: string;
    email: string;
    phone: string;
    company?: string;
    notes?: string;
  };
  order: {
    shapeId: string;
    shapeName: string;
    flavorId: string;
    flavorName: string;
    quantity: number;
    unitPriceUah: number;
    totalUahUah: number;
    /**
     * Phase 23: minQuantity threshold of the matched price tier (e.g. 100,
     * 500, 1000). Surfaces in the email so the fulfilment team sees which
     * tier rate the buyer locked in.
     */
    pricingTierMinQuantity?: number;
    /**
     * Greeting-card-only: which side the buyer was viewing at submit time.
     * Designer reads both sides via `designElementsBySide`; this is purely
     * informational (e.g. surfaces in the order summary as a breadcrumb).
     */
    cardSide?: "outer" | "inner";
  };
  assets: {
    logoUrl: string | null;
    previewUrl: string;
    /**
     * Raw user design on transparent background (print-ready). Currently
     * disabled — re-enable once perspective unwarp ships. Validation keeps
     * the field optional so older clients still send a null without 4xx.
     */
    flatUrl?: string | null;
    /**
     * Phase 29: greeting-card per-side mockup PNGs. Both sides
     * rendered separately and uploaded so the designer sees the buyer's
     * outer + inner artwork in the same email. Absent for chocolates.
     */
    previewUrlOuter?: string | null;
    previewUrlInner?: string | null;
  };
  /**
   * Structured list of every user-placed element (text + uploaded photos).
   * Drives the designer-handoff section of the admin email. Optional so
   * older clients keep working; absent payloads are treated as zero
   * elements.
   */
  designElements?: SubmissionDesignElement[];
  /**
   * Greeting card only — per-side design elements (outer + inner). When
   * present, the email renders both sides as separate sections and the
   * flat `designElements` field is treated as a redundant snapshot of
   * the currently-active side.
   */
  designElementsBySide?: {
    outer: SubmissionDesignElement[];
    inner: SubmissionDesignElement[];
  };
  /**
   * Phase 25 Subtask 9: paper / wrapper colour the buyer picked via the
   * floating Тло popover. Null = no override (default wrapper). The
   * email surfaces this as a swatch + hex so the designer can match it
   * exactly on the printed asset.
   */
  backgroundColor?: string | null;
}

function isNonEmpty(s: unknown): s is string {
  return typeof s === "string" && s.trim().length > 0;
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function validatePayload(input: unknown): BuilderOrderPayload | string {
  if (!input || typeof input !== "object") return "Invalid payload";
  const p = input as Record<string, unknown>;
  const c = p.customer as Record<string, unknown> | undefined;
  const o = p.order as Record<string, unknown> | undefined;
  const a = p.assets as Record<string, unknown> | undefined;
  if (!c || !o || !a) return "Missing customer / order / assets";
  if (!isNonEmpty(c.name)) return "Missing customer.name";
  if (!isNonEmpty(c.email)) return "Missing customer.email";
  if (!isNonEmpty(c.phone)) return "Missing customer.phone";
  if (!isNonEmpty(o.shapeId) || !isNonEmpty(o.shapeName)) return "Missing shape";
  if (!isNonEmpty(o.flavorId) || !isNonEmpty(o.flavorName)) return "Missing flavor";
  if (!isFiniteNumber(o.quantity) || o.quantity < 1) return "Invalid quantity";
  if (!isFiniteNumber(o.unitPriceUah)) return "Invalid unit price";
  if (!isFiniteNumber(o.totalUahUah)) return "Invalid total price";
  if (!isNonEmpty(a.previewUrl)) return "Missing previewUrl";
  return {
    customer: {
      name: c.name.trim(),
      email: c.email.trim(),
      phone: c.phone.trim(),
      company: isNonEmpty(c.company) ? c.company.trim() : undefined,
      notes: isNonEmpty(c.notes) ? c.notes.trim() : undefined,
    },
    order: {
      shapeId: o.shapeId,
      shapeName: o.shapeName,
      flavorId: o.flavorId,
      flavorName: o.flavorName,
      quantity: Math.round(o.quantity),
      unitPriceUah: o.unitPriceUah,
      totalUahUah: o.totalUahUah,
      pricingTierMinQuantity: isFiniteNumber(o.pricingTierMinQuantity)
        ? Math.round(o.pricingTierMinQuantity)
        : undefined,
      cardSide:
        o.cardSide === "outer" || o.cardSide === "inner"
          ? o.cardSide
          : undefined,
    },
    assets: {
      logoUrl: isNonEmpty(a.logoUrl) ? a.logoUrl : null,
      previewUrl: a.previewUrl,
      // Tolerated for forward-compat — the field is currently unused.
      flatUrl: isNonEmpty(a.flatUrl) ? a.flatUrl : null,
      previewUrlOuter: isNonEmpty(a.previewUrlOuter) ? a.previewUrlOuter : null,
      previewUrlInner: isNonEmpty(a.previewUrlInner) ? a.previewUrlInner : null,
    },
    designElements: sanitiseDesignElements(p.designElements),
    designElementsBySide: sanitiseDesignElementsBySide(p.designElementsBySide),
    backgroundColor: sanitiseColor(p.backgroundColor),
  };
}

/** Accept #RGB / #RRGGBB / #RRGGBBAA (case-insensitive). Anything else
 *  → null so the email omits the row. */
function sanitiseColor(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) return trimmed.toUpperCase();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toUpperCase();
  if (/^#[0-9a-fA-F]{8}$/.test(trimmed)) return trimmed.toUpperCase();
  return null;
}

/**
 * Greeting-card per-side bucket sanitiser. Each side is run through the
 * flat-array sanitiser; missing sides default to empty arrays. Returns
 * undefined for non-objects so chocolates (which never set this field)
 * keep emitting the single-section email.
 */
function sanitiseDesignElementsBySide(
  raw: unknown
): { outer: SubmissionDesignElement[]; inner: SubmissionDesignElement[] } | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  return {
    outer: sanitiseDesignElements(r.outer) ?? [],
    inner: sanitiseDesignElements(r.inner) ?? [],
  };
}

/**
 * Filter incoming design elements to a known-shape array. Per-field
 * validation is kept loose — the email is read by humans, missing or
 * unexpected fields just render as blank rather than 4xx-ing the whole
 * submission. Anything that's not an array becomes [].
 */
function sanitiseDesignElements(
  raw: unknown
): SubmissionDesignElement[] | undefined {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw)) return [];
  const out: SubmissionDesignElement[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    if (e.kind === "text") {
      out.push({
        kind: "text",
        content: typeof e.content === "string" ? e.content : "",
        fontFamily: typeof e.fontFamily === "string" ? e.fontFamily : "",
        fontSize: isFiniteNumber(e.fontSize) ? e.fontSize : 0,
        fontWeight:
          typeof e.fontWeight === "string" || isFiniteNumber(e.fontWeight)
            ? (e.fontWeight as string | number)
            : "normal",
        fontStyle: typeof e.fontStyle === "string" ? e.fontStyle : "normal",
        textAlign:
          e.textAlign === "center" || e.textAlign === "right"
            ? e.textAlign
            : "left",
        fillColor: typeof e.fillColor === "string" ? e.fillColor : null,
        strokeColor: typeof e.strokeColor === "string" ? e.strokeColor : null,
        strokeWidth: isFiniteNumber(e.strokeWidth) ? e.strokeWidth : 0,
        objectOpacity: isFiniteNumber(e.objectOpacity) ? e.objectOpacity : 1,
        lineHeight: isFiniteNumber(e.lineHeight) ? e.lineHeight : 1.16,
        charSpacing: isFiniteNumber(e.charSpacing) ? e.charSpacing : 0,
      });
      continue;
    }
    if (e.kind === "image") {
      if (!isNonEmpty(e.url)) continue;
      out.push({
        kind: "image",
        url: e.url,
        objectOpacity: isFiniteNumber(e.objectOpacity) ? e.objectOpacity : 1,
        rotation: isFiniteNumber(e.rotation) ? e.rotation : 0,
      });
      continue;
    }
  }
  return out;
}

export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const validated = validatePayload(raw);
  if (typeof validated === "string") {
    return NextResponse.json(
      { ok: false, error: validated },
      { status: 400 }
    );
  }

  const html = generateBuilderOrderEmailHtml({
    ...validated,
    submittedAt: new Date().toISOString(),
  });
  const subject = `Новий запит на брендовану шоколадку — ${validated.order.shapeName} × ${validated.order.quantity}`;

  if (LOCAL_MODE) {
    // Dump the validated payload so the dev can inspect what would be sent
    // in production (especially the Phase 3 designElements array). Grep for
    // "LOCAL_MODE payload" in the dev server output.
    console.log(
      "[builder-orders] LOCAL_MODE payload:",
      JSON.stringify(validated, null, 2)
    );
    console.log("[builder-orders] LOCAL_MODE=true — skipping email send", {
      to: ADMIN_RECIPIENT,
      subject,
    });
    return NextResponse.json({ ok: true, local: true });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[builder-orders] RESEND_API_KEY not set — order will be lost"
    );
    return NextResponse.json(
      { ok: false, error: "Email service not configured" },
      { status: 500 }
    );
  }

  try {
    const resend = new Resend(apiKey);
    const fromAddress = process.env.SEND_EMAIL
      ? `CHO A CHO Builder <${process.env.SEND_EMAIL}>`
      : "CHO A CHO Builder <onboarding@resend.dev>";
    const response = await resend.emails.send({
      from: fromAddress,
      to: [ADMIN_RECIPIENT],
      replyTo: validated.customer.email,
      subject,
      html,
    });
    if ((response as unknown as { error?: unknown }).error) {
      const err = (response as unknown as { error: unknown }).error;
      console.error("[builder-orders] Resend error:", err);
      return NextResponse.json(
        { ok: false, error: "Email send failed" },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[builder-orders] Resend throw:", err);
    return NextResponse.json(
      { ok: false, error: "Email send failed" },
      { status: 502 }
    );
  }
}
