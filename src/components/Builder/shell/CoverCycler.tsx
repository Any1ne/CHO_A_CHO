// src/components/Builder/shell/CoverCycler.tsx
//
// /branded selector card cover with auto-cycling images. Replaces the
// per-shape one-off animation components (the greeting-card-specific
// outer/inner crossfade in particular). Two stacked `<Image>` slots —
// one currently shown, one queued — toggle visibility on each tick so
// every cycle is a true 1s crossfade between the previous and next
// image without preloading the entire src list at once.
//
// Modes:
//   • `sequential` — walks the srcs array in order, looping at the
//     end. Used for the greeting card so the buyer sees a deliberate
//     outer → inner → other-example progression.
//   • `random` — picks a random src that differs from the current
//     visible one. Used for the chocolate shapes so each visitor sees a
//     fresh flavour combination, advertising the breadth of the range.
//
// Client component because it owns timers + state. Imported from the
// /branded page (server component) — Next.js wraps the boundary
// automatically.

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export interface CoverCyclerProps {
  srcs: string[];
  alt: string;
  /** Default 5000. Time each src stays at full opacity before the next
   *  swap kicks in. The crossfade itself runs in parallel with the
   *  next interval tick. */
  cycleMs?: number;
  /** Default 800. Opacity-transition duration applied to both slots. */
  transitionMs?: number;
  /** Cycle order — `sequential` walks the array in order; `random`
   *  picks a fresh src each tick avoiding the current one. */
  mode?: "sequential" | "random";
}

function pickNext(
  srcs: string[],
  current: string,
  mode: "sequential" | "random"
): string {
  if (srcs.length <= 1) return srcs[0] ?? current;
  if (mode === "sequential") {
    const i = srcs.indexOf(current);
    return srcs[(i + 1) % srcs.length];
  }
  // random — reroll until we land on a different src.
  let next = current;
  for (let i = 0; i < 8; i += 1) {
    next = srcs[Math.floor(Math.random() * srcs.length)];
    if (next !== current) break;
  }
  return next;
}

export default function CoverCycler({
  srcs,
  alt,
  cycleMs = 5000,
  transitionMs = 800,
  mode = "sequential",
}: CoverCyclerProps) {
  // Two slots: A is the currently visible image; B is queued. On each
  // tick we update whichever slot is currently HIDDEN with the next
  // src, then flip `showA` so the previously-hidden slot fades in
  // while the previously-visible one fades out.
  const [aSrc, setASrc] = useState(srcs[0] ?? "");
  const [bSrc, setBSrc] = useState(srcs[1] ?? srcs[0] ?? "");
  const [showA, setShowA] = useState(true);

  // Track which src is currently on-screen via a ref so the interval
  // closure stays cheap and doesn't restart on every render.
  const visibleRef = useRef(srcs[0] ?? "");
  visibleRef.current = showA ? aSrc : bSrc;

  useEffect(() => {
    if (srcs.length <= 1) return;
    const id = window.setInterval(() => {
      const next = pickNext(srcs, visibleRef.current, mode);
      // Push next into the HIDDEN slot, then flip.
      if (showA) {
        setBSrc(next);
      } else {
        setASrc(next);
      }
      setShowA((prev) => !prev);
    }, cycleMs);
    return () => window.clearInterval(id);
    // showA inclusion is intentional — when it flips we want the next
    // tick to write into the opposite slot.
  }, [srcs, cycleMs, mode, showA]);

  if (srcs.length === 0) return null;

  return (
    <div className="relative h-full w-full" aria-label={alt} role="img">
      <CoverImage src={aSrc} visible={showA} transitionMs={transitionMs} />
      <CoverImage src={bSrc} visible={!showA} transitionMs={transitionMs} />
    </div>
  );
}

function CoverImage({
  src,
  visible,
  transitionMs,
}: {
  src: string;
  visible: boolean;
  transitionMs: number;
}) {
  if (!src) return null;
  // Next/image rejects SVG by default; the SVG-path guard mirrors what
  // /branded did before this refactor.
  const isSvg = src.toLowerCase().endsWith(".svg");
  return (
    <Image
      src={src}
      alt=""
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      unoptimized={isSvg}
      className={[
        "object-contain transition-opacity ease-in-out",
        visible ? "opacity-100" : "opacity-0",
      ].join(" ")}
      style={{ transitionDuration: `${transitionMs}ms` }}
    />
  );
}
