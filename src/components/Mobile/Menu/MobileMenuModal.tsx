"use client";

import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Menu from "@/components/Mobile/MobileMenu";
import Contacts from "@/components/Header/Contacts";

type Props = {
  onClose: () => void;
};

export default function MobileMenuModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-20 bg-black/40">
      <div className="fixed top-0 left-0 h-full w-64 bg-white shadow-lg flex flex-col justify-between">
        {/* Header with close button */}
        <div className="p-2 flex justify-end">
          <Button
            variant="ghost"
            className="p-2"
            onClick={onClose}
            aria-label="Close menu"
          >
            <XIcon />
          </Button>
        </div>

        {/* Title */}
        <div className="px-4 pb-2 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Меню</h2>
        </div>

        {/* Menu */}
        <div className="flex-1 overflow-auto">
          <Menu onClose={onClose} />
        </div>

        {/* Contacts at the bottom */}
        <div className="border-t border-gray-200">
          <Contacts />
        </div>
      </div>
    </div>
  );
}
