"use client";
import Basket from "./BasketButton";
import BasketModal from "../Basket/BasketModal";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";

export default function Control() {
  const pathname = usePathname();
  const [isBasketOpen, setIsBasketOpen] = useState(false);

  const isStorePage = pathname === "/store";

  return (
    <section className="flex ">
      <p className="hidden px-4">
        <User />
      </p>

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
