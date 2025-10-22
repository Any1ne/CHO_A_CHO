import type { ProductType } from "@/types/product";
import { fetchProductById } from "./api";
import type { Metadata } from "next";

export async function getProductMetadata(productId: string): Promise<Metadata> {
    const product: ProductType = await fetchProductById(productId);

    if (!product) {
        return {
            title: "Товар не знайдено",
            description: "Товар не знайдено",
        };
    }

    const images = product.images?.length ? product.images : (product.preview ? [product.preview] : []);

    return {
        title: `${product.title} — Магазин`,
        description: product.shortDescription || product.description?.slice(0, 150) || "",
        openGraph: {
            title: product.title,
            description: product.shortDescription || product.description,
            images: images.length ? images.map((u) => ({ url: u, alt: product.title })) : undefined,
            url: `https://${process.env.DOMAIN}/store/${productId}`,
        },
        alternates: { canonical: `https://${process.env.DOMAIN}/store/${productId}` },
    };
}
