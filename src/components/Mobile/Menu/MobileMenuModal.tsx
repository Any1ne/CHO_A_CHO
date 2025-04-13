"use client";

import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Menu from "@/components/Mobile/MobileMenu";

type Props = {
  onClose: () => void;
};

export default function MobileMenuModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40">
      <div className="fixed top-0 left-0 h-full w-64 bg-white p-4 shadow-lg flex flex-col">
        <div className="flex justify-end">
          <Button
            variant="ghost"
            className="p-2"
            onClick={onClose}
            aria-label="Close menu"
          >
            <XIcon />
          </Button>
        </div>
        <Menu />
      </div>
    </div>
  );
}
