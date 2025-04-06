"use client";
import Basket from "./Basket";
import BasketModal from "../Basket/BasketModal";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Control() {
  const pathname = usePathname();
  const [isBasketOpen, setIsBasketOpen] = useState(false);

  const isStorePage = pathname === "/store";

  return (
    <section className="box px-4 row-start-2 flex items-center justify-end">
      <p className="px-4">Account</p>

      {isStorePage && (
        <>
          <Basket onOpen={() => setIsBasketOpen(true)} />
          {isBasketOpen && (
            <BasketModal onClose={() => setIsBasketOpen(false)} />
          )}
        </>
      )}
    </section>
  );
}
