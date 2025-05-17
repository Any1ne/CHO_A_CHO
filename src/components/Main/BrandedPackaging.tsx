"use client";

import { Button } from "../ui/button";
import { useState } from "react";
import RequestModal from "@/components/Main/Request/RequestModal";
import Image from "next/image";

export default function BrandedPackaging() {
  const [isRequestOpen, setIsRequestOpen] = useState(false);

  return (
    <section className="relative w-full h-[calc(100vh-10vh)] flex flex-col md:flex-row items-center justify-between p-6 md:p-12 bg-gray-100 overflow-hidden">
      <div className="max-w-xl z-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Брендоване пакування для вашого бізнесу
        </h1>
        <p className="text-lg mb-6 text-gray-700">
          Зробіть ваш бренд впізнаваним з першого погляду. Замовте індивідуальне
          пакування з вашим дизайном.
        </p>
        <Button onClick={() => setIsRequestOpen(true)}>Залишити запит</Button>
      </div>

      <div className="absolute md:relative right-0 bottom-0 md:w-1/2 w-full h-64 md:h-full z-0">
        <Image
          src="/images/branded-packaging.jpg"
          alt="Брендоване пакування"
          layout="fill"
          objectFit="cover"
          className="rounded-lg shadow-lg"
        />
      </div>

      {isRequestOpen && (
        <RequestModal onClose={() => setIsRequestOpen(false)} />
      )}
    </section>
  );
}
