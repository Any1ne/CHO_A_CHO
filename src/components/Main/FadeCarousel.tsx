"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSwipeable } from "react-swipeable";
import { useRouter } from "next/navigation";

type Slide = {
  src: string;
  href: string;
};

type Props = {
  slides: Slide[];
  /**
   * Skip next/image optimization. Needed when slides carry data-URLs or
   * arbitrary remote URLs not whitelisted in next.config `remotePatterns`
   * (e.g. the /banner-preview review tool feeding in an uploaded image).
   * Homepage usage omits this → optimized as before.
   */
  unoptimized?: boolean;
  /**
   * CSS object-position for the slide image (e.g. "50% 30%"). Lets the
   * preview tool test off-ratio cropping. Undefined → next/image default
   * (centered), so the homepage carousel is unaffected.
   */
  objectPosition?: string;
  /**
   * When true, clicking a slide does NOT navigate to its href. Used by the
   * banner-preview "on-device" stage where we only want to preview slide
   * transitions / layout, not leave the page. Arrows + swipe still work.
   */
  disableNav?: boolean;
};

export default function FadeCarousel({
  slides,
  unoptimized,
  objectPosition,
  disableNav,
}: Props) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const paginate = useCallback(
    (newDirection: number) => {
      if (slides.length === 0) return;
      setDirection(newDirection);
      setIndex((prev) => (prev + newDirection + slides.length) % slides.length);
    },
    [slides.length]
  );

  // Keep index in range when the set shrinks (e.g. a slide is deleted in the
  // banner-preview tool). Without this, `slides[index]` becomes undefined and
  // an empty src reaches next/image → runtime errors.
  useEffect(() => {
    if (index > slides.length - 1) setIndex(Math.max(0, slides.length - 1));
  }, [slides.length, index]);

  useEffect(() => {
    if (isPaused) return;
    timeoutRef.current = setTimeout(() => paginate(1), 5000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [index, paginate, isPaused]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") paginate(-1);
      if (e.key === "ArrowRight") paginate(1);
      if (["ArrowLeft", "ArrowRight"].includes(e.key)) setIsPaused(true);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [paginate]);

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
      className={`relative w-full h-full overflow-hidden group ${
        disableNav ? "" : "cursor-pointer"
      }`}
      onClick={() => {
        if (disableNav) return;
        router.push(slides[index]?.href || "/");
      }}
    >
      <AnimatePresence initial={false} custom={direction}>
        {slides[index]?.src && (
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
              sizes="100vw"
              className="object-cover"
              style={objectPosition ? { objectPosition } : undefined}
              unoptimized={unoptimized}
              priority
            />
          </motion.div>
        )}
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
