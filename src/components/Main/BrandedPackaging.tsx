"use client";

import { Button } from "../ui/button";
import { useState } from "react";
import RequestModal from "@/components/Main/Request/RequestModal";
// import Image from "next/image";

export default function BrandedPackaging() {
  const [isRequestOpen, setIsRequestOpen] = useState(false);

  return (
    <section className="min-h-[65vh] w-full flex flex-col md:flex-row align-center px-4 py-10 md:px-16 lg:px-24 bg-white">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center max-w-7xl mx-auto">
        {/* Текстова частина */}
        <div className="space-y-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            Брендоване пакування для вашого бізнесу
          </h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            Зробіть ваш бренд впізнаваним з першого погляду. Замовте
            індивідуальне пакування з вашим дизайном.
          </p>
          <Button onClick={() => setIsRequestOpen(true)}>Залишити запит</Button>
        </div>

        {/* Зображення або плашка */}
        <div className="w-full h-64 sm:h-80 md:h-full rounded-xl overflow-hidden relative">
          <div className="flex items-center justify-center h-full bg-primary rounded-lg cursor-pointer">
            <span className="text-2xl md:text-3xl text-white font-bold text-center">
              Брендоване пакування
            </span>
          </div>

          {/*
          <Image
            src="/images/branded-packaging.jpg"
            alt="Брендоване пакування"
            fill
            className="object-cover rounded-xl"
          />
          */}
        </div>
      </div>

      {isRequestOpen && (
        <RequestModal onClose={() => setIsRequestOpen(false)} />
      )}
    </section>
  );
}
