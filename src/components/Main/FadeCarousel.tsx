"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSwipeable } from "react-swipeable";
import { useRouter } from "next/navigation";

const slides = [
  { src: "/webbanner/4.jpg", href: "/" },
  { src: "/webbanner/1.jpg", href: "/" },
  { src: "/webbanner/2.jpg", href: "/" },
  { src: "/webbanner/3.jpg", href: "/" },
];

export default function FadeCarousel() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const paginate = useCallback((newDirection: number) => {
    setDirection(newDirection);
    setIndex((prev) => (prev + newDirection + slides.length) % slides.length);
  }, []);

  // Autoplay
  useEffect(() => {
    if (isPaused) return;
    timeoutRef.current = setTimeout(() => paginate(1), 5000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [index, paginate, isPaused]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") paginate(-1);
      if (e.key === "ArrowRight") paginate(1);
      if (["ArrowLeft", "ArrowRight"].includes(e.key)) setIsPaused(true);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [paginate]);

  // Swipe handling
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      paginate(1);
      setIsPaused(true);
    },
    onSwipedRight: () => {
      paginate(-1);
      setIsPaused(true);
    },
    trackMouse: true,
  });

  return (
    <div
      {...swipeHandlers}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPaused(false);
      }}
      className="relative w-full aspect-[16/9] max-h-[calc(100vh-15rem)] md:min-h-[17rem] overflow-hidden group cursor-pointer"
      onClick={() => router.push(slides[index].href)} // перехід на посилання слайду
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={index}
          custom={direction}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 w-full h-full"
        >
          <Image
            src={slides[index].src}
            alt={`Слайд ${index + 1}`}
            fill
            className="object-cover"
            priority
          />
        </motion.div>
      </AnimatePresence>

      {/* Arrows */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          paginate(-1);
          setIsPaused(true);
        }}
        className={`absolute left-4 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white transition p-2 rounded-full shadow-md z-10 
          ${isHovered ? "opacity-100" : "opacity-0"} group-hover:opacity-100 focus:opacity-100`}
      >
        <ChevronLeft className="w-6 h-6 text-primary" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          paginate(1);
          setIsPaused(true);
        }}
        className={`absolute right-4 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white transition p-2 rounded-full shadow-md z-10 
          ${isHovered ? "opacity-100" : "opacity-0"} group-hover:opacity-100 focus:opacity-100`}
      >
        <ChevronRight className="w-6 h-6 text-primary" />
      </button>
    </div>
  );
}
