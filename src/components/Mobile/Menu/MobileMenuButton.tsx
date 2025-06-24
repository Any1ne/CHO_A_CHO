"use client";

import { useState } from "react";
import { MenuIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import MobileMenuModal from "./MobileMenuModal";

export default function MobileMenuButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div >
      <Button
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-2 bg-background text-black"
        aria-label="Toggle menu"
      >
        {isOpen ? <XIcon size={24} /> : <MenuIcon size={80} />}
      </Button>

      {isOpen && <MobileMenuModal onClose={() => setIsOpen(false)} />}
    </div>
  );
}
