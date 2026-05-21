// src/components/Builder/shell/FloatingFlavorBubbles.tsx
//
// Setup-stage flavor selector. Floats over the canvas as a transparent
// horizontal carousel of round thumbnails. Hover reveals the flavor
// name in a small dark pill rendered just below the hovered bubble.
// Tooltip lives OUTSIDE the scroll container — `overflow-x: auto` on
// the scroll wrapper forces `overflow-y: auto` per CSS spec, which
// would clip a per-bubble tooltip. Workaround: render a single tooltip
// element as a sibling of the scroll container, positioned per-bubble
// via getBoundingClientRect math.
//
// The selected bubble auto-scrolls into the centre on mount + selection
// change.

"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import type { FlavorConfig } from "@/types/builder";

export interface FloatingFlavorBubblesProps {
  flavors: FlavorConfig[];
  activeFlavor: FlavorConfig;
  onSelect: (flavor: FlavorConfig) => void;
}

const DRAG_THRESHOLD_PX = 5;
const TOOLTIP_GAP_PX = 6;

export default function FloatingFlavorBubbles({
  flavors,
  activeFlavor,
  onSelect,
}: FloatingFlavorBubblesProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);
  const bubbleRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Drag-to-scroll state. Refs (not state) so reads inside pointer
  // handlers don't fire renders. `movedRef` is checked from each bubble
  // click to suppress accidental selects after a drag.
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollStartRef = useRef(0);
  const movedRef = useRef(false);
  const [isGrabbing, setIsGrabbing] = useState(false);

  // Hovered flavor + computed tooltip position in wrapper-local coords.
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{
    left: number;
    top: number;
  } | null>(null);

  // Centre the selected bubble in the viewport on mount + when the
  // selection changes from outside (e.g. flavor change via API).
  useEffect(() => {
    const el = activeRef.current;
    if (!el) return;
    el.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [activeFlavor.id]);

  // Recompute tooltip position whenever the hovered bubble or its
  // layout changes (carousel scroll). useLayoutEffect to avoid the
  // visible flicker of the tooltip drifting in after paint.
  useLayoutEffect(() => {
    if (!hoveredId) {
      setTooltipPos(null);
      return;
    }
    function compute() {
      const bubble = bubbleRefs.current.get(hoveredId!);
      const wrapper = wrapperRef.current;
      if (!bubble || !wrapper) {
        setTooltipPos(null);
        return;
      }
      const bRect = bubble.getBoundingClientRect();
      const wRect = wrapper.getBoundingClientRect();
      setTooltipPos({
        left: bRect.left - wRect.left + bRect.width / 2,
        top: bRect.bottom - wRect.top + TOOLTIP_GAP_PX,
      });
    }
    compute();
    // Re-anchor on carousel scroll so the tooltip tracks the bubble.
    const scrollEl = scrollRef.current;
    scrollEl?.addEventListener("scroll", compute);
    return () => scrollEl?.removeEventListener("scroll", compute);
  }, [hoveredId]);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    movedRef.current = false;
    startXRef.current = e.clientX;
    scrollStartRef.current = el.scrollLeft;
    setIsGrabbing(true);
  }
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    const dx = e.clientX - startXRef.current;
    if (Math.abs(dx) > DRAG_THRESHOLD_PX) movedRef.current = true;
    e.currentTarget.scrollLeft = scrollStartRef.current - dx;
  }
  function endDrag(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsGrabbing(false);
    const wasTap = !movedRef.current;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    // Pointer capture suppresses the inner button's native click event, so
    // dispatch the select manually on a clean tap. Skip on pointercancel /
    // pointerleave (the gesture didn't end with a deliberate release).
    if (!wasTap || e.type !== "pointerup") return;
    const target = document.elementFromPoint(e.clientX, e.clientY);
    const button = (target as HTMLElement | null)?.closest<HTMLElement>(
      "[data-flavor-id]"
    );
    const id = button?.dataset.flavorId;
    if (!id) return;
    const flavor = flavors.find((f) => f.id === id);
    if (flavor) onSelect(flavor);
  }

  const hoveredFlavor = hoveredId
    ? flavors.find((f) => f.id === hoveredId) ?? null
    : null;

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div
        ref={scrollRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        // Outer scroll container. Full width of its positioning context;
        // hides scrollbar across browsers. Cursor flips to "grabbing"
        // during drag.
        className={[
          "w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          isGrabbing ? "cursor-grabbing" : "cursor-grab",
        ].join(" ")}
      >
        {/* Inner row uses inline-flex + min-w-full so it shrinks to content
            when bubbles don't fill the row (centred via justify-center)
            and overflows past parent width when they do (parent scrolls).
            flex-shrink-0 on each bubble keeps thumbnails at their full
            size during overflow. */}
        <div
          className="inline-flex min-w-full justify-center gap-3 px-2 py-1"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {flavors.map((f) => {
            const isActive = f.id === activeFlavor.id;
            return (
              <div
                key={f.id}
                ref={(el) => {
                  if (el) bubbleRefs.current.set(f.id, el);
                  else bubbleRefs.current.delete(f.id);
                  if (isActive && el) activeRef.current = el;
                }}
                onMouseEnter={() => setHoveredId(f.id)}
                onMouseLeave={() =>
                  setHoveredId((prev) => (prev === f.id ? null : prev))
                }
                className="relative shrink-0"
              >
                <button
                  type="button"
                  data-flavor-id={f.id}
                  aria-label={f.name}
                  aria-pressed={isActive}
                  className="block focus:outline-none"
                  style={{ scrollSnapAlign: "center" }}
                >
                  <span
                    className={[
                      "relative flex h-16 w-16 select-none items-center justify-center overflow-hidden rounded-full bg-white transition-transform",
                      isActive
                        ? "ring-2 ring-stone-900 ring-offset-2 ring-offset-white"
                        : "ring-1 ring-stone-200 hover:scale-105 hover:ring-stone-400",
                    ].join(" ")}
                  >
                    {f.imageSrc ? (
                      <Image
                      src={f.imageSrc}
                      alt={f.name}
                      fill
                      sizes="64px"
                      draggable={false}
                      // SVG sources (greeting card) need `unoptimized`
                      // — Next image-optimization rejects SVG by
                      // default. Raster sources (Mini / Popular)
                      // still go through optimization.
                      unoptimized={f.imageSrc.toLowerCase().endsWith(".svg")}
                      // Disable browser's native drag-image preview + text
                      // selection. pointer-events:none lets the parent button
                      // own clicks; pointer events on the scroll container
                      // still bubble for drag-to-scroll.
                      className="pointer-events-none object-cover select-none [-webkit-user-drag:none]"
                    />
                    ) : (
                      // No-photo flavors (greeting card sides) get a
                      // placeholder bubble with the flavor name's first
                      // letter on a warm-paper background.
                      <span
                        aria-hidden
                        className="text-lg font-semibold text-stone-700"
                        style={{ backgroundColor: "#F8F4ED" }}
                      >
                        {f.name.charAt(0)}
                      </span>
                    )}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Single tooltip rendered relative to the wrapper (sibling of the
          scroll container). Positioned per-hovered-bubble via JS to dodge
          the overflow-y clip the spec forces on `overflow-x: auto`. */}
      {hoveredFlavor && tooltipPos && (
        <div
          role="tooltip"
          style={{ left: tooltipPos.left, top: tooltipPos.top }}
          className="pointer-events-none absolute z-30 -translate-x-1/2 whitespace-nowrap rounded-md bg-stone-900 px-2 py-1 text-[11px] font-medium text-white shadow-md"
        >
          {hoveredFlavor.name}
        </div>
      )}
    </div>
  );
}
