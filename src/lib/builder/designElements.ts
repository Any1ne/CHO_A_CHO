// src/lib/builder/designElements.ts
//
// Designer-handoff payload. The customer's designer recreates the final
// printed design from this list — they need every user object's identifying
// properties. Exact pixel positions are deliberately omitted; the goal is
// representation, not pixel-perfect recreation.
//
// Single source of truth for the type, the color-format helper, and the
// "is this image element wired with a usable source URL" semantics. Imported
// by ConstructorCanvas (the getter that builds the list), BuilderShell (POST
// payload), the /api/builder-orders route (validation), and the email
// template (rendering).

export type SubmissionDesignElement =
  | {
      kind: "text";
      content: string;
      fontFamily: string;
      fontSize: number;             // px in canvas space, scale-adjusted
      fontWeight: string | number;  // "normal" | "bold" | numeric
      fontStyle: string;            // "normal" | "italic"
      textAlign: "left" | "center" | "right";
      fillColor: string | null;     // "#RRGGBBAA" — null when fabric reports a non-string fill (gradient/pattern)
      strokeColor: string | null;
      strokeWidth: number;          // 0 when no stroke
      objectOpacity: number;        // 0..1
      lineHeight: number;           // multiplier (fabric default 1.16)
      charSpacing: number;          // 1/1000 em (fabric units)
    }
  | {
      kind: "image";
      url: string;                  // public Supabase Storage URL
      objectOpacity: number;        // 0..1
      rotation: number;             // degrees, 0..360
    };

/**
 * Convert a fabric color value into a uniform `#RRGGBBAA` string. Handles
 * the three shapes fabric typically returns: 6-digit hex, 8-digit hex, and
 * `rgba(...)`. Returns null for falsy / unparseable inputs (e.g. when the
 * fill is actually a pattern or gradient — printable design only cares
 * about flat colors).
 */
export function colorToHexAlpha(
  value: string | null | undefined
): string | null {
  if (!value) return null;
  const s = String(value).trim();

  const hex6 = s.match(/^#?([0-9a-fA-F]{6})$/);
  if (hex6) return `#${hex6[1].toUpperCase()}FF`;

  const hex8 = s.match(/^#?([0-9a-fA-F]{8})$/);
  if (hex8) return `#${hex8[1].toUpperCase()}`;

  const hex3 = s.match(/^#?([0-9a-fA-F]{3})$/);
  if (hex3) {
    const [r, g, b] = hex3[1].split("");
    return `#${r}${r}${g}${g}${b}${b}FF`.toUpperCase();
  }

  const rgb = s.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)$/
  );
  if (rgb) {
    const r = clampByte(parseInt(rgb[1], 10));
    const g = clampByte(parseInt(rgb[2], 10));
    const b = clampByte(parseInt(rgb[3], 10));
    const a =
      rgb[4] !== undefined
        ? clampByte(Math.round(parseFloat(rgb[4]) * 255))
        : 255;
    return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}${toHex2(a)}`;
  }

  return null;
}

function clampByte(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(255, Math.round(n)));
}

function toHex2(n: number): string {
  return n.toString(16).padStart(2, "0").toUpperCase();
}

/**
 * Convert a list of serialized fabric objects (the JSON shape produced by
 * `fabric.Object.toObject`) into SubmissionDesignElement[]. Used for
 * greeting-card side buckets, where the non-active side lives only as
 * serialized JSON and never as a live fabric object on the canvas.
 *
 * Mirrors the logic in `ConstructorCanvas.getDesignElements` but reads
 * raw JSON instead of fabric instances. Skips images that lost their
 * `sourceUrl` during serialization (defensive — `getUserObjects` includes
 * `sourceUrl` in the toObject prop list so this rarely fires).
 */
export function serializedToDesignElements(
  serialized: unknown[]
): SubmissionDesignElement[] {
  const out: SubmissionDesignElement[] = [];
  for (const raw of serialized) {
    if (!raw || typeof raw !== "object") continue;
    const o = raw as Record<string, unknown>;
    if (o.type === "textbox") {
      const scale = typeof o.scaleX === "number" ? o.scaleX : 1;
      const baseFontSize = typeof o.fontSize === "number" ? o.fontSize : 32;
      const fillRaw = typeof o.fill === "string" ? o.fill : null;
      const strokeRaw = typeof o.stroke === "string" ? o.stroke : null;
      const align = o.textAlign;
      const textAlign: "left" | "center" | "right" =
        align === "center" || align === "right" ? align : "left";
      out.push({
        kind: "text",
        content: typeof o.text === "string" ? o.text : "",
        fontFamily: typeof o.fontFamily === "string" ? o.fontFamily : "",
        fontSize: Math.round(baseFontSize * scale),
        fontWeight:
          typeof o.fontWeight === "string" || typeof o.fontWeight === "number"
            ? (o.fontWeight as string | number)
            : "normal",
        fontStyle: typeof o.fontStyle === "string" ? o.fontStyle : "normal",
        textAlign,
        fillColor: colorToHexAlpha(fillRaw),
        strokeColor: colorToHexAlpha(strokeRaw),
        strokeWidth: typeof o.strokeWidth === "number" ? o.strokeWidth : 0,
        objectOpacity: typeof o.opacity === "number" ? o.opacity : 1,
        lineHeight: typeof o.lineHeight === "number" ? o.lineHeight : 1.16,
        charSpacing: typeof o.charSpacing === "number" ? o.charSpacing : 0,
      });
      continue;
    }
    if (o.type === "image") {
      const url = typeof o.sourceUrl === "string" ? o.sourceUrl : null;
      if (!url) continue;
      out.push({
        kind: "image",
        url,
        objectOpacity: typeof o.opacity === "number" ? o.opacity : 1,
        rotation: typeof o.angle === "number" ? o.angle : 0,
      });
    }
  }
  return out;
}
