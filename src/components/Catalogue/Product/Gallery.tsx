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

interface Props {
  images?: string[];
  title: string;
}

export default function Gallery({ images, title }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel();
  const [selectedIndex, setSelectedIndex] = React.useState(0);

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
    <div className="box h-full w-full md:w-1/2 flex flex-col gap-4">
      <Carousel opts={{ loop: true }}>
        <CarouselContent ref={emblaRef}>
          {images.map((src, index) => (
            <CarouselItem
              key={index}
              className="flex justify-center max-h-[70vh] md:max-h-[55vh]"
            >
              <Image
                src={src}
                alt={`${title} - ${index + 1}`}
                width={300}
                height={200}
                className="rounded object-cover w-full h-auto"
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2" />
        <CarouselNext className="right-2" />
      </Carousel>

      <div className="flex box gap-2 justify-center">
        {images.map((src, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={`w-16 h-16 border rounded overflow-hidden transition ring-offset-2 ring-2 ring-transparent hover:ring-gray-400 ${
              selectedIndex === index ? "ring-gray-800" : ""
            }`}
          >
            <Image
              src={src}
              alt={`Preview ${index + 1}`}
              width={64}
              height={64}
              className="object-cover w-full h-full"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
