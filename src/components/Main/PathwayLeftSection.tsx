"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Package, TruckIcon } from "lucide-react";

export default function PathwayLeftSection() {
  return (
    <div className="p-10 md:px-10 flex flex-col justify-center md:w-1/2 w-full">
      <h2 className="text-4xl font-bold mb-4">Обери свій шоколадний шлях</h2>
      <p className="text-gray-700 mb-6">
        Незалежно від того, чи шукаєте ви наступні улюблені солодощі в звичайному
        чи в брендованому пакуванні на замовлення — ми вас забезпечимо.
      </p>

      <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-6">
        <Link href="/store">
          <Button className="w-full sm:w-auto px-4 py-3 text-md">
            Перейти в каталог
          </Button>
        </Link>
        <Link href="/branded">
          <Button
            variant="outline"
            className="w-full sm:w-auto px-4 py-3 text-md border-gray-400"
          >
            Брендоване пакування
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
          <TruckIcon className="w-6 h-6 text-primary" />
          <p className="text-sm text-left">Доставка кур'єром по Києву</p>
        </div>
      </div>
    </div>
  );
}
