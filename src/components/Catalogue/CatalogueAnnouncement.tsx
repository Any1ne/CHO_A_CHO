"use client";

export default function CatalogueAnnouncement() {
  return (
    <div className="w-full bg-primary border border-primary rounded-xl p-4 text-center text-primary-foreground shadow-md">
      <p className="text-lg md:text-xl font-bold tracking-wide">
        Безкоштовна доставка та оптові ціни від{" "}
        <span className="font-bold">1350 ₴</span>
      </p>
      <p className="text-sm md:text-base text-gray-100 mt-2">
        Зробіть замовлення зараз і отримайте приємні бонуси ✨
      </p>
    </div>
  );
}
