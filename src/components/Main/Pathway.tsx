"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Package, Percent } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

const featuredProducts = [
  {
    id: "1",
    title: "Dark Delight",
    image:
      "https://petrovka-horeca.com.ua/images/thumbnails/530/530/detailed/22/4979868177_w1280_h1280_shokolad_cho_a_cho_chernyj_15g.png",
  },
  {
    id: "2",
    title: "Mint Magic",
    image:
      "https://petrovka-horeca.com.ua/images/thumbnails/530/530/detailed/22/4979868177_w1280_h1280_shokolad_cho_a_cho_chernyj_15g.png",
  },
  {
    id: "3",
    title: "Berry Bliss",
    image:
      "https://petrovka-horeca.com.ua/images/thumbnails/530/530/detailed/22/4979868177_w1280_h1280_shokolad_cho_a_cho_chernyj_15g.png",
  },
  {
    id: "4",
    title: "Nutty Crunch",
    image:
      "https://petrovka-horeca.com.ua/images/thumbnails/530/530/detailed/22/4979868177_w1280_h1280_shokolad_cho_a_cho_chernyj_15g.png",
  },
];

export default function Pathway() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi>();

  const handleDotClick = (index: number) => {
    if (api) api.scrollTo(index);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[90vh] px-0 md:px-10 lg:px-30 py-10 bg-white rounded-lg overflow-hidden shadow-md justify-center">
      {/* Left Section */}
      <div className="md:w-1/2 w-full p-10 md:px-10 flex flex-col justify-center">
        <h2 className="text-4xl font-bold mb-4">Choose Your Chocolate Path</h2>
        <p className="text-gray-700 mb-6">
          Whether you're looking for your next sweet favorite or custom branded
          treats for your event — we’ve got you covered.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Link href="/store">
            <Button className="w-full sm:w-auto px-6 py-3 text-lg">
              Go to Store
            </Button>
          </Link>
          <Link href="/branded">
            <Button
              variant="outline"
              className="w-full sm:w-auto px-6 py-3 text-lg border-gray-400"
            >
              Branded Offer
            </Button>
          </Link>
        </div>

        <div className="space-y-4 mt-6">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-primary" />
            <p className="text-sm text-left">
              Безкоштовна доставка по Україні при замовленні від 1000 грн*
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Percent className="w-6 h-6 text-primary" />
            <p className="text-sm text-left">Знижки до 30% для партнерів</p>
          </div>
        </div>
      </div>

      {/* Right Section - Carousel */}
      <div className="md:w-1/2 w-full p-10 px-0 md:px-10 group">
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
          <CarouselContent className="transition-transform duration-100 ease-in-out">
            {featuredProducts.map((product) => (
              <CarouselItem
                key={product.id}
                className="flex items-center justify-center"
              >
                <div className="flex flex-col items-center justify-center border gap-4 w-70 p-4 rounded-2xl bg-gray-50">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="h-60 w-60 object-cover rounded-xl shadow-md bg-gray-200"
                  />
                  <h3 className="text-lg font-semibold">{product.title}</h3>
                  <Link href={`/store?id=${product.id}`}>
                    <Button className="px-4 py-2">View Product</Button>
                  </Link>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Prev / Next Buttons */}
          <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Carousel>

        {/* Dot Navigation */}
        <div className="flex justify-center mt-4 space-x-2">
          {featuredProducts.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all ${
                index === selectedIndex ? "bg-black" : "bg-gray-400"
              }`}
              onClick={() => handleDotClick(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
