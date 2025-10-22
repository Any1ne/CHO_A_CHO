import { NextResponse } from "next/server";
import type { ProductType } from "@/types/product";
import { getAllProducts } from "@/lib/redisCatalog";

function escapeXml(str?: string) {
  if (!str) return "";
  return str
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatPrice(value?: number | string) {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  // Google Merchant дозволяє формат "123.45 UAH"
  return `${n.toFixed(2)} UAH`;
}

function makeAbsoluteUrl(url?: string, domain = "www.choacho.com.ua") {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  // Ensure leading slash
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `https://${domain}${path}`;
}

export async function GET() {
  try {
    const products: ProductType[] = (await getAllProducts()) || [];
    const domain = process.env.DOMAIN || "www.choacho.com.ua";

    const items = products.filter((p) => p.id && p.title && (p.price ?? p.wholesale_price) != null);

    const itemsXml = items
      .map((p) => {
        const id = escapeXml(p.id);
        const title = escapeXml(p.title);
        const description = escapeXml(p.description ?? p.shortDescription ?? p.title);
        // unique product link
        const link = escapeXml(`https://${domain}/store/${encodeURIComponent(String(p.id))}`);
        const imageUrl = makeAbsoluteUrl(p.preview || (p.images?.[0] ?? ""), domain);
        const image = imageUrl ? escapeXml(imageUrl) : "";
        const price = formatPrice(p.price ?? p.wholesale_price ?? 0);
        const availability = p.inStock === false ? "out_of_stock" : "in_stock";

        return `
<item>
  <g:id>${id}</g:id>
  <title>${title}</title>
  <description>${description}</description>
  <link>${link}</link>
  ${image ? `<g:image_link>${image}</g:image_link>` : ""}
  <g:availability>${availability}</g:availability>
  <g:price>${price}</g:price>
  <g:condition>new</g:condition>
  <g:brand>${escapeXml("CHO A CHO")}</g:brand>
  ${p.category ? `<g:google_product_category>${escapeXml(p.category)}</g:google_product_category>` : ""}
  ${p.weight ? `<g:shipping_weight>${escapeXml(String(p.weight))} g</g:shipping_weight>` : ""}
  ${(!p.gtin && !p.mpn) ? `<g:identifier_exists>false</g:identifier_exists>` : ""}
</item>
        `.trim();
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>CHO A CHO — Products</title>
    <link>https://${domain}/</link>
    <description>Product feed for Google Merchant</description>
    ${itemsXml}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=900, s-maxage=900",
      },
    });
  } catch (err) {
    console.error("Error generating google feed:", err);
    return new NextResponse("<error>failed</error>", {
      status: 500,
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }
}
