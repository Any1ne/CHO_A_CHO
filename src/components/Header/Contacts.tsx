"use client";

import { useState } from "react";
import RequestModal from "@/components/Main/Request/RequestModal";
import { Button } from "@/components/ui/button";

export default function Contacts() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row gap-4 md:justify-end text-sm px-4 pb-2 bg-white md:bg-primary md:text-white md:border-b border-gray-200">
      <div className="flex flex-col md:flex-row gap-2 items-center text-gray-700 md:text-gray-300">
        <span >+38 (067) 138-5282</span>
        <span >info@choacho.com</span>
      </div>

      <div className="flex flex-col md:flex-row gap-2 items-center">
        <Button
          size="sm"
          className="hover:bg-dark hover:text-white md:bg-accent md:text-black h-[1.5rem] w-fit"
          onClick={() => setIsOpen(true)}
        >
          Зв'язатися з нами
        </Button>
        <span className="text-xs text-gray-700 md:text-gray-200">Пн-нд 08:00 - 19:00</span>
      </div>

      {isOpen && <RequestModal onClose={() => setIsOpen(false)} />}
    </div>
  );
}
