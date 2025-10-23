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
  return `${n.toFixed(2)} UAH`;
}

function makeAbsoluteUrl(url?: string, domain = "www.choacho.com.ua") {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `https://${domain}${path}`;
}

function wrapCdataSafe(str?: string) {
  if (!str) return "";
  return `<![CDATA[${str.replace(/\]\]>/g, "]]]]><![CDATA[>")}]]>`;
}

export async function GET() {
  try {
    const products: ProductType[] = (await getAllProducts()) || [];
    const domain = process.env.DOMAIN || "www.choacho.com.ua";

    const items = products.filter((p) => p.id && p.title && (p.price ?? p.wholesale_price) != null);

    console.log(`[google-feed] products total=${products.length} exported=${items.length}`);

    const itemsXml = items
      .map((p) => {
        const id = escapeXml(String(p.id));
        const title = escapeXml(p.title);
        const descriptionRaw = p.description ?? p.shortDescription ?? p.title ?? "";
        const description = wrapCdataSafe(descriptionRaw);
        const link = `https://${domain}/store/${encodeURIComponent(String(p.id))}`;
        const linkEsc = escapeXml(link);
        const imageUrl = makeAbsoluteUrl(p.preview || (p.images?.[0] ?? ""), domain);
        const image = imageUrl ? escapeXml(imageUrl) : "";
        const price = formatPrice(p.price ?? p.wholesale_price ?? 0);
        const availability = p.inStock === false ? "out of stock" : "in stock";

        return `
  <item>
    <g:id>${id}</g:id>
    <g:title>${title}</g:title>
    <g:description>${description}</g:description>
    <g:link>${linkEsc}</g:link>
    ${image ? `<g:image_link>${image}</g:image_link>` : ""}
    <g:availability>${availability}</g:availability>
    <g:price>${price}</g:price>
    <g:condition>new</g:condition>
    <g:brand>${escapeXml("cho a cho")}</g:brand>
    <g:google_product_category>499972</g:google_product_category>
    ${p.weight ? `<g:shipping_weight>${escapeXml(String(p.weight))} g</g:shipping_weight>` : ""}
    <g:mpn>${id}</g:mpn>
    <g:identifier_exists>false</g:identifier_exists>
  </item>`.trim();
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