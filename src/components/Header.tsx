"use client";

import Menu from "./Header/Menu";
import Logo from "./Header/Logo";
import Control from "./Header/Control";
import { useState } from "react";
import { MenuIcon, XIcon } from "lucide-react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="box border-2 relative px-4 py-2 bg-white">
      {/* Desktop layout */}
      <div className="hidden md:grid grid-cols-3 items-center gap-4 h-24">
        <Menu />
        <Logo />
        <Control />
      </div>

      {/* Mobile layout */}
      <div className="md:hidden flex flex-col">
        <div className="flex justify-between items-center h-16">
          <Logo />
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="flex flex-col gap-2 mt-2">
            <Menu />
            <Control />
          </div>
        )}
      </div>
    </header>
  );
}
