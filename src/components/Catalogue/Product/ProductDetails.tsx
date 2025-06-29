"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Truck, CreditCard } from "lucide-react";

import BasketControls from "@/components/Catalogue/BasketControls";
import FlavourSelect from "./FlavourSelect";
import { Skeleton } from "@/components/ui/skeleton"; // ✅ імпортуй Skeleton
import { useState, useEffect } from "react";

type Props = {
  title: string;
  description: string;
  price: number;
  id: string;
  preview: string;
};

export default function ProductDetails({
  title,
  description,
  price,
  id,
  preview,
}: Props) {
  const [isLoading, setIsLoading] = useState(true); // ✅ стан для завантаження

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800); // 800ms для прикладу
    return () => clearTimeout(timer);
  }, []);

  const finalDescription =
    description ||
    `Шоколад CHO A CHO - плитка бельгійського шоколаду, яка стане ідеальним вибором для любителів солодких смакових поєднань.`;

  return (
    <div className="flex flex-col shrink w-full md:w-1/2 rounded overflow-hidden">

      {/* Вибір смаку */}
      <div className="p-4 border-b min-h-[3.5rem]">
        {isLoading ? (
          <Skeleton className="h-10 w-full rounded-md" />
        ) : (
          <FlavourSelect />
        )}
      </div>

      {/* Ціна + кнопка */}
      <div className="p-4 border-b grid grid-cols-[auto_1fr] items-center gap-4 overflow-x-scroll">
        <p className="text-xl font-semibold">₴{price.toFixed(2)}</p>
        <BasketControls id={id} title={title} price={price} preview={preview} />
      </div>

      {/* Опис */}
      <div className="p-4">
        <p className="text-gray-700">{finalDescription}</p>
      </div>

      {/* Додаткова інформація */}
      <div className="p-4 border-t">
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="delivery">
            <AccordionTrigger className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Доставка
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                <li>Доставка протягом 1–3 робочих днів</li>
                <li>Доставка кур&rsquo;єром по Києву</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="payment">
            <AccordionTrigger className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Спосіб оплати
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                <li>Оплата Monobank Pay</li>
                <li>Оплата Google Pay</li>
                <li>Оплата Apple Pay</li>
                <li>Оплата готівкою або переказом</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
