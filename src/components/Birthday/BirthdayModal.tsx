"use client";

import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function BirthdayModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Показати лише 1 раз
    const wasShown = localStorage.getItem("birthdayShown");
    if (!wasShown) {
      setIsOpen(true);
      localStorage.setItem("birthdayShown", "true");
    }

    // Оновлення розміру вікна для конфеті
    const handleResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <Confetti width={windowSize.width} height={windowSize.height} />

      <div className="relative bg-white rounded-lg p-6 w-[90%] max-w-md shadow-lg text-center animate-bounce-in">
        <Button
          onClick={() => setIsOpen(false)}
          className="absolute top-2 right-2 p-2"
          variant="ghost"
        >
          <XIcon />
        </Button>

        {/* 🎁 Анімація подарунка */}
        <div className="w-32 mx-auto mb-4 relative">
          <Image
            src="/gift-closed.png"
            alt="Gift"
            width={128} // set width explicitly, e.g., 128px for 32rem container width
            height={128} // set height explicitly (keep aspect ratio)
            className="gift-box mx-auto mb-4 relative"
          />
        </div>

        <h2 className="text-2xl font-bold mb-2">З Днем народження! 🥳</h2>
        <p className="text-gray-600">
          Бажаємо щастя, здоров&rsquo;я та гарного настрою!
        </p>
      </div>
    </div>
  );
}
