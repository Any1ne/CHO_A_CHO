"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Truck, CreditCard } from "lucide-react";

import BasketControls from "@/components/Catalogue/BasketControls";
import { RootState } from "@/store";
import { useSelector } from "react-redux";
import { useState } from "react";
import { useRouter } from "next/navigation";

import FlavourSelect from "./FlavourSelect";

type Props = {
  title: string;
  description: string;
  price: number;
  id: string;
};

export default function ProductDetails({
  title,
  description,
  price,
  id,
}: Props) {
  const itemInBasket = useSelector((state: RootState) =>
    state.basket.items.find((item) => item.id === id)
  );

if (!description){
  description = `Шоколад CHO A CHO - мініатюрна плитка бельгійського шоколаду, яка стане ідеальним вибором для любителів солодких смакових поєднань.`
}

  return (
    <div className="flex flex-col shrink w-full md:w-1/2 rounded overflow-hidden">

      {/* Вибір смаку */}
      <div className="p-4 border-b">
        <FlavourSelect currentId={id} />
      </div>

      {/* Ціна + кнопка */}
      <div className="p-4 border-b grid grid-cols-[auto_1fr] items-center gap-4 overflow-x-scroll">
        <p className="text-xl font-semibold">₴{price.toFixed(2)}</p>
        <BasketControls id={id} title={title} price={price} />
      </div>

      {/* Опис */}
      <div className="p-4">
        <p className="text-gray-700">{description}</p>
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
      <li>Доставка кур'єром по Києву</li>
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
