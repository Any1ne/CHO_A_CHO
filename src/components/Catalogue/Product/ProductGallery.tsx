"use client";

import * as React from "react";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import useEmblaCarousel from "embla-carousel-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  images?: string[];
  title: string;
}

export default function ProductGallery({ images, title }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel();
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [loadedImages, setLoadedImages] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", () =>
      setSelectedIndex(emblaApi.selectedScrollSnap())
    );
  }, [emblaApi]);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-[400px] bg-gray-200 rounded flex items-center justify-center text-gray-500 text-lg">
        Немає зображень
      </div>
    );
  }

  return (
    <div className="md:h-full w-full md:w-1/2 flex flex-col gap-4">
      {/* Слайдер */}
      <Carousel opts={{ loop: true }}>
        <CarouselContent ref={emblaRef}>
          {images.map((src, index) => (
            <CarouselItem
              key={index}
              className="flex justify-center max-h-[70vh] md:max-h-[55vh]"
            >
              <div className="relative w-full h-auto max-h-[55vh]">
                {!loadedImages[index] && (
                  <Skeleton className="absolute inset-0 w-full h-full rounded" />
                )}
                <Image
                  src={src}
                  alt={`${title} - ${index + 1}`}
                  width={800}
                  height={600}
                  className={`rounded aspect-square md:aspect-4/3 object-cover w-full h-full transition-opacity duration-500 ${
                    loadedImages[index] ? "opacity-100" : "opacity-0"
                  }`}
                  onLoad={() =>
                    setLoadedImages((prev) => ({ ...prev, [index]: true }))
                  }
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden left-2" />
        <CarouselNext className="hidden right-2" />
      </Carousel>

      {/* Прев’ю */}
      <div className="flex box gap-2 justify-center">
        {images.map((src, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={`w-16 h-16 border rounded overflow-hidden transition ring-offset-2 ring-2 ring-transparent hover:ring-gray-400 ${
              selectedIndex === index ? "ring-gray-800" : ""
            }`}
          >
            <div className="relative w-full h-full">
              {!loadedImages[`thumb-${index}`] && (
                <Skeleton className="absolute inset-0 w-full h-full rounded" />
              )}
              <Image
                src={src}
                alt={`Preview ${index + 1}`}
                width={64}
                height={64}
                className={`object-cover w-full h-full transition-opacity duration-300 ${
                  loadedImages[`thumb-${index}`] ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() =>
                  setLoadedImages((prev) => ({ ...prev, [`thumb-${index}`]: true }))
                }
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
