"use client";

import { useState } from "react";
import Menu from "./Header/Menu";
import Logo from "./Header/Logo";
import Basket from "./Header/Basket";
import BasketModal from "./Basket/BasketModal";

export default function Header() {
  const [isBasketOpen, setIsBasketOpen] = useState(false);

  return (
    <header className="box grid grid-cols-3 grid-rows-2 gap-4 border-2 h-40 relative">
      <Menu />
      <Logo />
      <Basket onOpen={() => setIsBasketOpen(true)} />
      {isBasketOpen && <BasketModal onClose={() => setIsBasketOpen(false)} />}
    </header>
  );
}
