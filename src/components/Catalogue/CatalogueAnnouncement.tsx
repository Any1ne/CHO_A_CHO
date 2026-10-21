"use client";

import { WHOLESALE_THRESHOLD_LABEL } from "@/config/pricing";

export default function CatalogueAnnouncement() {
  return (
    <div className="w-full bg-primary border border-primary rounded-xl p-4 text-center text-primary-foreground shadow-md">
      <p className="text-lg md:text-xl font-bold tracking-wide">
        Безкоштовна доставка від{" "}
        <span className="font-bold">{WHOLESALE_THRESHOLD_LABEL} ₴</span> оптової ціни
      </p>
      <p className="text-sm md:text-base text-gray-100 mt-2">
        Зробіть замовлення зараз і отримайте приємні бонуси ✨
      </p>
    </div>
  );
}
