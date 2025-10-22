import Catalogue from "@/components/Catalogue/Catalogue";
import ModalInitializer from "@/components/Catalogue/ModalInitializer";
import { fetchProductById } from "@/lib/api";
import { notFound } from "next/navigation";
import type { ProductType } from "@/types/product";
import { getProductMetadata } from "@/lib/product-metadata";
import type { Metadata } from "next";

type PageParams = { productId: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { productId } = await params;

  try {
    return await getProductMetadata(productId);
  } catch {
    return {
      title: "Товар не знайдено",
      description: "Цей товар не існує або був видалений",
    };
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { productId } = await params;

  const product: ProductType | null = await fetchProductById(productId);

  if (!product) return notFound();

  const images = product.images?.length
    ? product.images
    : product.preview
    ? [product.preview]
    : [];

  return (
    <>
      <main className="mt-[6rem] md:mt-[8rem] min-h-[85vh]">
        <Catalogue />
      </main>

      {/* Client component that initializes Redux modal with product data */}
      <ModalInitializer productId={productId} product={product} />

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            name: product.title,
            image: images,
            description: product.shortDescription || product.description,
            sku: product.sku || undefined,
            brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
            offers: {
              "@type": "Offer",
              priceCurrency: product.currency || "UAH",
              price: product.price?.toString() ?? undefined,
              availability: product.inStock
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
              url: `https://${process.env.DOMAIN}/store/${productId}`,
            },
          }),
        }}
      />
    </>
  );
}
