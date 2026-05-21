// src/components/Builder/onboarding/TourPopover.tsx
//
// Phase 29: fixed-position popover anchored to a tour step's target
// element. Reads the anchor's bbox via `getBoundingClientRect`, picks a
// position based on the step's preferred `side` (with mobile auto-flip
// to top/bottom when the anchor sits below the viewport's left/right
// edge), highlights the anchor with a pulsing outline, and emits next/
// skip callbacks. Skips the step automatically if the anchor isn't in
// the DOM at mount time.

"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TourStep } from "@/lib/builder/onboarding";

interface TourPopoverProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  isMobile: boolean;
  onNext: () => void;
  onSkip: () => void;
}

interface PopoverPos {
  top: number;
  left: number;
  /** Effective side after mobile fall-back. */
  side: "top" | "right" | "bottom" | "left";
}

const POPOVER_WIDTH = 288; // matches w-72
const POPOVER_GAP = 12;

export default function TourPopover({
  step,
  stepIndex,
  totalSteps,
  isMobile,
  onNext,
  onSkip,
}: TourPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [pos, setPos] = useState<PopoverPos | null>(null);

  // Find the anchor element. If missing, skip the step so the tour
  // doesn't dead-end on an unmounted target.
  useEffect(() => {
    const el = document.querySelector<HTMLElement>(step.targetSelector);
    if (!el) {
      // Defer to next tick so the parent's setState doesn't re-render
      // mid-effect.
      const id = window.setTimeout(() => onNext(), 0);
      return () => window.clearTimeout(id);
    }
    setAnchor(el);
    el.classList.add("tour-highlight");
    // Scroll the anchor into view so the popover is visible even when
    // the target sits below the fold on a narrow viewport.
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    return () => {
      el.classList.remove("tour-highlight");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id]);

  // Compute the popover position from the anchor's bbox + the chosen
  // side. Recompute on scroll / resize so the popover tracks the
  // anchor while the highlight pulses.
  useLayoutEffect(() => {
    if (!anchor) return;
    function compute() {
      if (!anchor) return;
      const a = anchor.getBoundingClientRect();
      const popH = popoverRef.current?.offsetHeight ?? 160;
      const popW = popoverRef.current?.offsetWidth ?? POPOVER_WIDTH;

      // Mobile horizontal sides auto-flip — there's no room for a
      // left/right popover on a narrow viewport.
      let side = step.side;
      if (isMobile && (side === "left" || side === "right")) {
        side = a.top > window.innerHeight / 2 ? "top" : "bottom";
      }

      let top = 0;
      let left = 0;
      switch (side) {
        case "top":
          top = a.top - popH - POPOVER_GAP;
          left = a.left + a.width / 2 - popW / 2;
          break;
        case "bottom":
          top = a.bottom + POPOVER_GAP;
          left = a.left + a.width / 2 - popW / 2;
          break;
        case "left":
          top = a.top + a.height / 2 - popH / 2;
          left = a.left - popW - POPOVER_GAP;
          break;
        case "right":
          top = a.top + a.height / 2 - popH / 2;
          left = a.right + POPOVER_GAP;
          break;
      }

      // Clamp inside viewport.
      const margin = 8;
      top = Math.max(margin, Math.min(window.innerHeight - popH - margin, top));
      left = Math.max(margin, Math.min(window.innerWidth - popW - margin, left));
      setPos({ top, left, side });
    }
    compute();
    window.addEventListener("scroll", compute, true);
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute, true);
      window.removeEventListener("resize", compute);
    };
  }, [anchor, step.side, isMobile]);

  if (!anchor || !pos) return null;
  const isLast = stepIndex >= totalSteps - 1;

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label={step.title}
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        width: POPOVER_WIDTH,
        zIndex: 100,
      }}
      className="max-w-[90vw] rounded-lg border border-stone-200 bg-white p-4 shadow-lg"
    >
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-stone-500">
          {stepIndex + 1} / {totalSteps}
        </span>
        <button
          type="button"
          onClick={onSkip}
          aria-label="Закрити підказку"
          className="text-stone-400 transition-colors hover:text-stone-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <h3 className="mb-1 text-sm font-semibold text-stone-900">{step.title}</h3>
      <p className="text-sm leading-snug text-stone-600">{step.description}</p>
      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onSkip}
          className="text-xs text-stone-500 underline-offset-2 hover:underline"
        >
          Пропустити
        </button>
        <Button size="sm" onClick={onNext} className="h-8 px-4 text-sm">
          {isLast ? "Готово" : "Далі"}
        </Button>
      </div>
    </div>
  );
}
