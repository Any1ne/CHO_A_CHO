// src/lib/email/generateBuilderOrderEmailHtml.ts
//
// Email body for the builder submission flow. Sent to the admin recipient
// whenever a buyer hits "Надіслати запит" with a finished design. Includes
// the rendered canvas preview (linked, since Resend strips embedded images
// over a few hundred KB), the customer's contact info, and order metadata.
//
// Mirrors the simple inline-style format used by `generateContactEmailHtml`
// — no template engine, no MJML — because the existing Resend integration
// has been stable with that approach.

import type { SubmissionDesignElement } from "@/lib/builder/designElements";

export interface BuilderOrderEmailFields {
  customer: {
    name: string;
    email: string;
    phone: string;
    company?: string;
    notes?: string;
  };
  order: {
    shapeName: string;
    flavorName: string;
    quantity: number;
    unitPriceUah: number;
    totalUahUah: number;
    /** Phase 23: matched price-tier threshold (100 / 500 / 1000). */
    pricingTierMinQuantity?: number;
    /** Greeting card only — outer / inner; surfaces in the order summary. */
    cardSide?: "outer" | "inner";
  };
  assets: {
    /** Public URL of the buyer's uploaded logo (may be absent if they only
     *  added text). */
    logoUrl: string | null;
    /** Public URL of the rendered canvas preview PNG (mockup-on-product). */
    previewUrl: string;
    /**
     * Public URL of the print-ready flat design PNG. Currently unused —
     * the field is tolerated on the payload for forward-compat but the
     * email omits the flat row entirely until perspective unwarp ships.
     */
    flatUrl?: string | null;
    /** Phase 29: greeting-card per-side mockup PNGs. */
    previewUrlOuter?: string | null;
    previewUrlInner?: string | null;
  };
  /** Structured per-object handoff for the designer. Empty / absent = order
   *  has no user-placed objects (background-only customisation). */
  designElements?: SubmissionDesignElement[];
  /**
   * Greeting card per-side payload. When present, the email renders two
   * "Елементи дизайну" sections (Зовнішня / Внутрішня) and `designElements`
   * above is ignored — it carries a redundant snapshot of the currently-
   * active side only.
   */
  designElementsBySide?: {
    outer: SubmissionDesignElement[];
    inner: SubmissionDesignElement[];
  };
  /** Phase 25 Subtask 9: paper / wrapper colour (hex). Null = default. */
  backgroundColor?: string | null;
  submittedAt: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatUah(n: number): string {
  return `${Math.round(n).toLocaleString("uk-UA")} ₴`;
}

function renderDesignElements(
  elements: SubmissionDesignElement[] | undefined,
  heading: string = "Елементи дизайну"
): string {
  if (!elements || elements.length === 0) {
    return `
    <div style="padding:0 24px 8px;">
      <h2 style="margin:20px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:0.05em;color:#777;">${escapeHtml(heading)}</h2>
      <p style="margin:0;padding:6px 12px;font-size:13px;color:#999;">Без елементів — лише фон та вибір смаку.</p>
    </div>`;
  }

  const rows = elements
    .map((el, idx) => {
      const num = idx + 1;
      if (el.kind === "text") {
        const props: string[] = [];
        if (el.fontFamily) props.push(escapeHtml(el.fontFamily));
        if (el.fontSize) props.push(`${el.fontSize}px`);
        if (el.fontWeight && el.fontWeight !== "normal") {
          props.push(escapeHtml(String(el.fontWeight)));
        }
        if (el.fontStyle && el.fontStyle !== "normal") {
          props.push(escapeHtml(el.fontStyle));
        }
        const alignLabels: Record<string, string> = {
          left: "ліворуч",
          center: "центр",
          right: "праворуч",
        };
        props.push(alignLabels[el.textAlign] ?? el.textAlign);
        if (el.fillColor) props.push(escapeHtml(el.fillColor));
        if (el.strokeWidth > 0 && el.strokeColor) {
          props.push(`обведення ${escapeHtml(el.strokeColor)} ${el.strokeWidth}px`);
        }
        if (el.objectOpacity < 1) {
          props.push(`opacity ${Math.round(el.objectOpacity * 100)}%`);
        }
        // Only mention lineHeight/charSpacing when the user moved them
        // off the fabric defaults — keeps the line concise for the
        // common case.
        if (Math.abs(el.lineHeight - 1.16) > 0.01) {
          props.push(`line-height ${el.lineHeight.toFixed(2)}`);
        }
        if (el.charSpacing !== 0) {
          props.push(`letter-spacing ${el.charSpacing}`);
        }
        const propsLine = props.join(" · ");
        return `
        <tr>
          <td style="padding:8px 12px;color:#777;width:24px;vertical-align:top;">${num}.</td>
          <td style="padding:8px 12px;vertical-align:top;">
            <div style="font-size:14px;color:#1a1a1a;">«${escapeHtml(el.content)}»</div>
            <div style="margin-top:2px;font-size:12px;color:#777;">${propsLine}</div>
          </td>
        </tr>`;
      }
      // image
      const imgProps: string[] = [];
      if (el.rotation && Math.round(el.rotation) !== 0) {
        imgProps.push(`поворот ${Math.round(el.rotation)}°`);
      }
      if (el.objectOpacity < 1) {
        imgProps.push(`opacity ${Math.round(el.objectOpacity * 100)}%`);
      }
      const imgPropsLine = imgProps.length
        ? `<div style="margin-top:2px;font-size:12px;color:#777;">${imgProps.join(" · ")}</div>`
        : "";
      return `
        <tr>
          <td style="padding:8px 12px;color:#777;width:24px;vertical-align:top;">${num}.</td>
          <td style="padding:8px 12px;vertical-align:top;">
            <a href="${escapeHtml(el.url)}" style="display:inline-block;color:#b25d00;">
              <img src="${escapeHtml(el.url)}" alt="Photo ${num}" style="max-width:120px;max-height:120px;border:1px solid #e7e5e0;border-radius:6px;display:block;" />
            </a>
            ${imgPropsLine}
          </td>
        </tr>`;
    })
    .join("");

  return `
    <div style="padding:0 24px 8px;">
      <h2 style="margin:20px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:0.05em;color:#777;">${escapeHtml(heading)}</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${rows}
      </table>
    </div>`;
}

export function generateBuilderOrderEmailHtml(
  fields: BuilderOrderEmailFields
): string {
  const {
    customer,
    order,
    assets,
    designElements,
    designElementsBySide,
    submittedAt,
  } = fields;
  const companyRow = customer.company
    ? `<tr><td style="padding:6px 12px;color:#777;">Компанія</td><td style="padding:6px 12px;">${escapeHtml(customer.company)}</td></tr>`
    : "";
  const notesRow = customer.notes
    ? `<tr><td style="padding:6px 12px;color:#777;vertical-align:top;">Примітки</td><td style="padding:6px 12px;white-space:pre-wrap;">${escapeHtml(customer.notes)}</td></tr>`
    : "";
  const logoRow = assets.logoUrl
    ? `<tr><td style="padding:6px 12px;color:#777;">Логотип</td><td style="padding:6px 12px;"><a href="${escapeHtml(assets.logoUrl)}" style="color:#b25d00;">Завантажити оригінал</a></td></tr>`
    : `<tr><td style="padding:6px 12px;color:#777;">Логотип</td><td style="padding:6px 12px;color:#999;">Не завантажено</td></tr>`;
  // Phase 25 Subtask 9: bg colour swatch + hex. Swatch box uses the
  // colour itself as backgroundColor + a thin border for legibility on
  // light email clients. Hex shown next to the swatch in monospace so
  // the designer can copy-paste exactly.
  const bgColorRow = fields.backgroundColor
    ? `<tr><td style="padding:6px 12px;color:#777;vertical-align:middle;">Колір тла</td><td style="padding:6px 12px;"><span style="display:inline-block;width:18px;height:18px;border:1px solid #e7e5e0;border-radius:4px;vertical-align:middle;background:${escapeHtml(fields.backgroundColor)};"></span> <span style="font-family:monospace;font-size:13px;color:#1a1a1a;vertical-align:middle;">${escapeHtml(fields.backgroundColor)}</span></td></tr>`
    : "";
  const tierNote = order.pricingTierMinQuantity
    ? ` <span style="color:#1a6b3a;font-size:12px;">(тариф від ${order.pricingTierMinQuantity} шт)</span>`
    : "";
  const sideLabel =
    order.cardSide === "outer"
      ? "Зовнішня"
      : order.cardSide === "inner"
        ? "Внутрішня"
        : null;
  const cardSideRow = sideLabel
    ? `<tr><td style="padding:6px 12px;color:#777;">Активна сторона</td><td style="padding:6px 12px;">${escapeHtml(sideLabel)} <span style="color:#999;font-size:12px;">(обидві сторони у дизайні нижче)</span></td></tr>`
    : "";

  // Greeting-card path: two sections (Зовнішня / Внутрішня) instead of
  // the single section. Falls back to the flat `designElements` field
  // for chocolates.
  const designSection = designElementsBySide
    ? renderDesignElements(designElementsBySide.outer, "Елементи дизайну — Зовнішня") +
      renderDesignElements(designElementsBySide.inner, "Елементи дизайну — Внутрішня")
    : renderDesignElements(designElements);

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;background:#f5f4f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif;color:#1a1a1a;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e0;border-radius:12px;overflow:hidden;">
    <div style="padding:20px 24px;border-bottom:1px solid #e7e5e0;">
      <h1 style="margin:0;font-size:18px;color:#1a1a1a;">Новий запит на брендовану шоколадку</h1>
      <p style="margin:4px 0 0;font-size:12px;color:#999;">${escapeHtml(submittedAt)}</p>
    </div>

    <div style="padding:0 24px 8px;">
      <h2 style="margin:20px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:0.05em;color:#777;">Замовлення</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 12px;color:#777;">Форма</td><td style="padding:6px 12px;">${escapeHtml(order.shapeName)}</td></tr>
        <tr><td style="padding:6px 12px;color:#777;">Смак</td><td style="padding:6px 12px;">${escapeHtml(order.flavorName)}</td></tr>
        ${cardSideRow}
        <tr><td style="padding:6px 12px;color:#777;">Кількість</td><td style="padding:6px 12px;">${order.quantity} шт</td></tr>
        <tr><td style="padding:6px 12px;color:#777;">За одиницю</td><td style="padding:6px 12px;">${formatUah(order.unitPriceUah)}${tierNote}</td></tr>
        <tr><td style="padding:6px 12px;color:#777;font-weight:600;">Разом</td><td style="padding:6px 12px;font-weight:600;">${formatUah(order.totalUahUah)}</td></tr>
      </table>
    </div>

    <div style="padding:0 24px 8px;">
      <h2 style="margin:20px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:0.05em;color:#777;">Контакт</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 12px;color:#777;">Імʼя</td><td style="padding:6px 12px;">${escapeHtml(customer.name)}</td></tr>
        <tr><td style="padding:6px 12px;color:#777;">Email</td><td style="padding:6px 12px;"><a href="mailto:${escapeHtml(customer.email)}" style="color:#b25d00;">${escapeHtml(customer.email)}</a></td></tr>
        <tr><td style="padding:6px 12px;color:#777;">Телефон</td><td style="padding:6px 12px;"><a href="tel:${escapeHtml(customer.phone.replace(/\s+/g, ""))}" style="color:#b25d00;">${escapeHtml(customer.phone)}</a></td></tr>
        ${companyRow}
        ${notesRow}
      </table>
    </div>

    <div style="padding:0 24px 8px;">
      <h2 style="margin:20px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:0.05em;color:#777;">Дизайн</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${logoRow}
        ${bgColorRow}
        ${
          assets.previewUrlOuter || assets.previewUrlInner
            ? [
                assets.previewUrlOuter
                  ? `<tr><td style="padding:6px 12px;color:#777;vertical-align:top;">Прев&apos;ю — Зовнішня</td><td style="padding:6px 12px;"><a href="${escapeHtml(assets.previewUrlOuter)}" style="color:#b25d00;display:block;margin-bottom:8px;">Відкрити повний розмір</a><img src="${escapeHtml(assets.previewUrlOuter)}" alt="Outer preview" style="max-width:100%;border:1px solid #e7e5e0;border-radius:6px;display:block;" /></td></tr>`
                  : "",
                assets.previewUrlInner
                  ? `<tr><td style="padding:6px 12px;color:#777;vertical-align:top;">Прев&apos;ю — Внутрішня</td><td style="padding:6px 12px;"><a href="${escapeHtml(assets.previewUrlInner)}" style="color:#b25d00;display:block;margin-bottom:8px;">Відкрити повний розмір</a><img src="${escapeHtml(assets.previewUrlInner)}" alt="Inner preview" style="max-width:100%;border:1px solid #e7e5e0;border-radius:6px;display:block;" /></td></tr>`
                  : "",
              ].join("")
            : `<tr><td style="padding:6px 12px;color:#777;vertical-align:top;">Прев&apos;ю</td><td style="padding:6px 12px;"><a href="${escapeHtml(assets.previewUrl)}" style="color:#b25d00;display:block;margin-bottom:8px;">Відкрити повний розмір</a><img src="${escapeHtml(assets.previewUrl)}" alt="Preview" style="max-width:100%;border:1px solid #e7e5e0;border-radius:6px;display:block;" /></td></tr>`
        }
      </table>
    </div>

    ${designSection}

    <div style="padding:16px 24px;background:#f5f4f1;font-size:12px;color:#999;border-top:1px solid #e7e5e0;">
      Згенеровано конструктором CHO A CHO
    </div>
  </div>
</body>
</html>`;
}
