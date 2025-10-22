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
import { useSelector } from "react-redux";
import { RootState } from "@/store/types";


type Props = {
  title: string;
  description: string;
  price: number;
  wholesale_price: number;
  id: string;
  preview: string;
};

export default function ProductDetails({
  title,
  description,
  price,
  wholesale_price,
  id,
  preview,
}: Props) {
  const [isLoading, setIsLoading] = useState(true); // ✅ стан для завантаження

    const isWholesale = useSelector((state: RootState) => state.checkout.checkoutSummary.isWholesale);
    const displayPrice = isWholesale ? wholesale_price : price;
    const isDiscounted = isWholesale && wholesale_price !== price;
  

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800); // 800ms для прикладу
    return () => clearTimeout(timer);
  }, []);

  const finalDescription =
    description ||
    `Шоколад CHO A CHO - плитка шоколаду, яка стане ідеальним вибором для любителів солодких смакових поєднань.`;

  return (
    <div className="flex flex-col shrink w-full md:w-1/2 rounded overflow-hidden">

      {/* Вибір смаку */}
      <div className="p-4 border-b min-h-[3.5rem]">
        {isLoading ? (
          <div className="flex flex-col gap-4 flex-1">
          <Skeleton className="h-18 w-full rounded-md" />
          <Skeleton className="h-12 w-[50%]" />
          </div>
        ) : (
          <FlavourSelect />
        )}
      </div>

      {/* Ціна + кнопка */}
      <div className="p-4 border-b flex flex-wrap items-center gap-4">
  <div className="text-xl font-medium text-gray-700">
          {isDiscounted && (
            <span className=" text-gray-400 line-through mr-1">
              ₴{price.toFixed(2)}
            </span>
          )}
          <span className={`font-bold ${isDiscounted ? "text-green-600" : ""}`}>
            ₴{displayPrice.toFixed(2)}
          </span>
        </div>
  <div className="w-full sm:w-auto">
    <BasketControls id={id} title={title} price={price} wholesale_price={wholesale_price} preview={preview} />
  </div>
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
