"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Heart, Leaf, Sparkles, Truck } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";

export default function WebBanner() {
  return (
    <div className="grid gap-4 grid-cols-4 grid-rows-[65vh_10vh] p-10 px-30 text-center">
      <div className="col-span-4">
        <Carousel
          plugins={[
            Autoplay({
              delay: 5000,
            }),
          ]}
          className="w-full h-full"
        >
          <CarouselContent>
            <CarouselItem className="flex justify-center items-center h-[65vh] bg-red-400">
              <span className="text-4xl text-white font-bold">Slide 1</span>
            </CarouselItem>
            <CarouselItem className="flex justify-center items-center h-[65vh] bg-green-400">
              <span className="text-4xl text-white font-bold">Slide 2</span>
            </CarouselItem>
            <CarouselItem className="flex justify-center items-center h-[65vh] bg-blue-400">
              <span className="text-4xl text-white font-bold">Slide 3</span>
            </CarouselItem>
          </CarouselContent>
        </Carousel>
      </div>

      <div className="box flex items-center gap-4 justify-center">
        <Heart className="w-6 h-6 text-pink-500 mb-1" />
        <p className="text-sm font-medium">Crafted with love</p>
      </div>
      <div className="box flex  items-center gap-4 justify-center">
        <Leaf className="w-6 h-6 text-green-600 mb-1" />
        <p className="text-sm font-medium">Natural & sustainable</p>
      </div>
      <div className="box flex  items-center gap-4 justify-center">
        <Sparkles className="w-6 h-6 text-yellow-500 mb-1" />
        <p className="text-sm font-medium">Everyday magic</p>
      </div>
      <div className="box flex  items-center gap-4 justify-center">
        <Truck className="w-6 h-6 text-blue-500 mb-1" />
        <p className="text-sm font-medium">Fast shipping</p>
      </div>
    </div>
  );
}
