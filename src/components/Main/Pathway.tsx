"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Package, Percent } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const featuredProducts = [
  {
    id: "1",
    title: "Dark Delight",
    image: "/images/dark.jpg",
  },
  {
    id: "2",
    title: "Mint Magic",
    image: "/images/mint.jpg",
  },
  {
    id: "3",
    title: "Berry Bliss",
    image: "/images/berry.jpg",
  },
  {
    id: "4",
    title: "Nutty Crunch",
    image: "/images/nutty.jpg",
  },
];

export default function Pathway() {
  const [selectedProduct, setSelectedProduct] = useState(null);

  return (
    <div className="flex flex-col md:flex-row h-[90vh] p-20 bg-white rounded-lg overflow-hidden shadow-md justify-center">
      {/* Left Section */}
      <div className="md:w-1/2 w-full p-10 flex flex-col justify-center">
        <div>
          <h2 className="text-4xl font-bold mb-4">
            Choose Your Chocolate Path
          </h2>
          <p className="text-gray-700 mb-6">
            Whether you're looking for your next sweet favorite or custom
            branded treats for your event — we’ve got you covered.
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
        </div>

        {/* PURCHASE DETAILS */}
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
      <div className="md:w-1/2 w-full p-6">
        <Carousel className="h-full flex items-center">
          <CarouselContent>
            {featuredProducts.map((product) => (
              <CarouselItem
                key={product.id}
                className=" flex items-center justify-center"
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
        </Carousel>
      </div>
    </div>
  );
}
