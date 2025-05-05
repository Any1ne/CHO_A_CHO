"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Heart, Leaf, Sparkles, Truck } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";

export default function WebBanner() {
  return (
    <div className="grid gap-8 grid-cols-1 px-0 md:px-10 lg:px-30 py-10 text-center border-b">
      {/* Carousel */}
      <div className="relative group w-full h-full p-0.5">
        <Carousel
          plugins={[
            Autoplay({
              delay: 5000,
              stopOnInteraction: false,
              stopOnMouseEnter: true,
            }),
          ]}
          opts={{ loop: false }}
        >
          <CarouselContent className="transition-transform duration-100 ease-in-out">
            <CarouselItem className="">
              <div className="flex items-center justify-center h-[40vh] md:h-[65vh] bg-red-400 rounded-lg cursor-pointer">
                <span className="text-3xl md:text-4xl text-white font-bold">
                  Slide 1
                </span>
              </div>
            </CarouselItem>
            <CarouselItem className=" ">
              <div className="flex items-center justify-center h-[40vh] md:h-[65vh] bg-green-400 rounded-lg cursor-pointer ">
                <span className="text-3xl md:text-4xl text-white font-bold">
                  Slide 2
                </span>
              </div>
            </CarouselItem>
            <CarouselItem className=" ">
              <div className="flex items-center justify-center h-[40vh] md:h-[65vh] bg-blue-400 rounded-lg cursor-pointer">
                <span className="text-3xl md:text-4xl text-white font-bold">
                  Slide 3
                </span>
              </div>
            </CarouselItem>
          </CarouselContent>

          {/* Hover arrows */}
          <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Carousel>
      </div>

      {/* Brand advantages */}
      <div className="flex flex-col md:flex-row items-stretch gap-0">
        <div className="box flex flex-col md:flex-row items-center gap-2 justify-center grow shadow-2xs h-20">
          <Heart className="w-6 h-6 text-pink-500" />
          <p className="text-sm font-medium">Crafted with love</p>
        </div>
        <div className="box flex flex-col md:flex-row items-center gap-2 justify-center grow shadow-2xs h-20">
          <Leaf className="w-6 h-6 text-green-600" />
          <p className="text-sm font-medium">Natural & sustainable</p>
        </div>
        <div className="box flex flex-col md:flex-row items-center gap-2 justify-center grow shadow-2xs h-20">
          <Sparkles className="w-6 h-6 text-yellow-500" />
          <p className="text-sm font-medium">Everyday magic</p>
        </div>
        <div className="box flex flex-col md:flex-row items-center gap-2 justify-center grow shadow-2xs h-20">
          <Truck className="w-6 h-6 text-blue-500" />
          <p className="text-sm font-medium">Fast shipping</p>
        </div>
      </div>
    </div>
  );
}
