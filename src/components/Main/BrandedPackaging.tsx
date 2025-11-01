"use client";

import { Button } from "../ui/button";
import { useState } from "react";
import RequestModal from "@/components/Main/Request/RequestModal";
import FadeCarousel from "@/components/Main/FadeCarousel"; // імпорт нового слайдера

export default function BrandedPackaging() {
  const [isRequestOpen, setIsRequestOpen] = useState(false);

  const slides = [
    {
      src: "https://9qy6ktzgsu2nlgvi.public.blob.vercel-storage.com/branded/1.jpg",
      href: "#",
    },
    {
      src: "https://9qy6ktzgsu2nlgvi.public.blob.vercel-storage.com/branded/2.jpg",
      href: "#",
    },
    {
      src: "https://9qy6ktzgsu2nlgvi.public.blob.vercel-storage.com/branded/3.jpg",
      href: "#",
    },
  ];

  return (
    <section className="min-h-[82vh] w-full flex flex-col md:flex-row align-center px-4 py-10 md:px-16 lg:px-24 bg-white">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center max-w-7xl mx-auto">
        {/* Текстова частина */}
        <div className="space-y-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            Брендовані для вашого бізнесу
          </h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            Зробіть ваш бренд впізнаваним з першого погляду. Замовте
            індивідуальне пакування з вашим дизайном.
          </p>
          <Button onClick={() => setIsRequestOpen(true)}>Залишити запит</Button>
        </div>

        {/* Слайдер зображень */}
        <div className="w-full h-64 sm:h-80 md:h-full rounded-xl overflow-hidden relative">
          <FadeCarousel slides={slides} />
        </div>
      </div>

      {isRequestOpen && (
        <RequestModal onClose={() => setIsRequestOpen(false)} />
      )}
    </section>
  );
}
