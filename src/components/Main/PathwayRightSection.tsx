"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { fetchProductById } from "@/lib/api";
import { ProductType } from "@/types";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/lib/hooks/hooks";
import { openProductModalAsync } from "@/store/slices/productModalSlice";
import { Skeleton } from "@/components/ui/skeleton";


const featuredProductIds = ["1-005", "3-004", "6-002", "2-001"];

export default function PathwayRightSection() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi>();
  const [products, setProducts] = useState<ProductType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        const result = await Promise.all(
          featuredProductIds.map((id) => fetchProductById(id))
        );
        setProducts(result);
      } catch (error) {
        console.error("Помилка при завантаженні продуктів:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeaturedProducts();
  }, []);

  const router = useRouter();
const dispatch = useAppDispatch();

const handleViewClick = async (productId: string) => {
  router.push("/store");
  setTimeout(() => {
    dispatch(openProductModalAsync(productId));
  }, 300);
};

  const handleDotClick = (index: number) => {
    if (api) api.scrollTo(index);
  };

  return (
    <div className="p-10 px-0 md:px-10 group flex flex-col items-center justify-center md:w-1/2 w-full">
      {isLoading ? (
      <div className="flex flex-col items-center gap-4 p-4 border rounded-2xl bg-gray-50 w-70">
        <Skeleton className="w-60 h-60 rounded-xl" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-10 w-32" />
      </div>
) : (
        <>
          <Carousel
            plugins={[
              Autoplay({
                delay: 4000,
                stopOnInteraction: false,
                stopOnMouseEnter: true,
              }),
            ]}
            opts={{ loop: false }}
            setApi={(emblaApi) => {
              setApi(emblaApi);
              if (emblaApi) {
                setSelectedIndex(emblaApi.selectedScrollSnap());
                emblaApi.on("select", () => {
                  setSelectedIndex(emblaApi.selectedScrollSnap());
                });
              }
            }}
          >
            <CarouselContent className="transition-transform duration-100 ease-in-out md:w-[40vw]">
              {products.map((product) => (
                <CarouselItem
                  key={product.id}
                  className="flex items-center justify-center"
                >
                  <div className="flex flex-col items-center justify-center border gap-4 w-70 p-4 rounded-2xl bg-gray-50">
                   
<Image
  src={product.preview || "/preview.jpg"}
  alt={product.title}
  width={240}
  height={240}
  className="h-60 w-60 object-cover rounded-xl shadow-md bg-gray-200"
/>
                    <h3 className="text-lg font-semibold text-center">{product.title}</h3>
                    <Button className="px-4 py-2" onClick={() => handleViewClick(product.id)}>
  Переглянути
</Button>

                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Carousel>

          <div className="flex justify-center mt-4 space-x-2">
            {products.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === selectedIndex ? "bg-black" : "bg-gray-400"
                }`}
                onClick={() => handleDotClick(index)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
