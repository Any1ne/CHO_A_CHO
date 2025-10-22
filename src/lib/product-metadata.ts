import type { ProductType } from "@/types/product";
import { fetchProductById } from "./api";
import type { Metadata } from "next";

export async function getProductMetadata(productId: string): Promise<Metadata> {
    const product: ProductType | null = await fetchProductById(productId);

    if (!product) {
        return {
            title: "Товар не знайдено",
            description: "Товар не знайдено",
            twitter: {
                card: "summary",
                title: "Товар не знайдено",
                description: "Товар не знайдено",
            },
        };
    }

    const images =
        product.images?.length
            ? product.images
            : product.preview
                ? [product.preview]
                : [];

    const firstImage = images.length ? images[0] : undefined;
    const title = `${product.title} — Магазин`;
    const description =
        product.shortDescription ||
        product.description?.slice(0, 150) ||
        "";

    return {
        title,
        description,
        openGraph: {
            title: product.title,
            description: description,
            images: images.length
                ? images.map((u) => ({ url: u, alt: product.title }))
                : undefined,
            url: `https://${process.env.DOMAIN}/store/${productId}`,
        },
        twitter: {
            card: firstImage ? "summary_large_image" : "summary",
            title: product.title,
            description: description,
            images: firstImage ? [firstImage] : undefined,
        },
        alternates: {
            canonical: `https://${process.env.DOMAIN}/store/${productId}`,
        },
    };
}
