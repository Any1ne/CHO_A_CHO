// src/components/Builder/shell/FloatingTypographyToolbar.tsx
//
// Mobile-only floating toolbar shown next to the selected text object on
// the canvas. Lets the buyer toggle bold / italic / alignment / fill
// without leaving the canvas to scroll down to the stacked RightPanel.
// The `md:hidden` class hides it on tablet/desktop, where RightPanel is
// the typography surface.
//
// Positioning: anchored to the active text's bounding rect via fabric's
// `getBoundingRect(true, true)`. Updates on `after:render` so it follows
// move / scale / pan / zoom. Auto-flips below the text when the default
// above-the-text position would slip off the top of the screen.

"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
} from "lucide-react";
import type { fabric } from "fabric";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type {
  ActiveObjectInfo,
  ActiveTextProps,
} from "../ConstructorCanvas";
import { ColorRow } from "./ColorRow";

const FILL_DEFAULT_COLOR = "#1a1a1a";
const FALLBACK_TOOLBAR_WIDTH_PX = 280;
const FALLBACK_TOOLBAR_HEIGHT_PX = 40;
// Clearance above the text's top edge when the toolbar sits above the text.
// Fabric draws the rotation handle ~40 px above the bbox top (its default
// `rotatingPointOffset`, in screen px regardless of zoom) plus the corner /
// rotation handle radius (touch hit area up to ~16 px) — a 12 px gap put the
// toolbar right on top of the rotation + close controls. Sit clear above them.
const ABOVE_CLEARANCE_PX = 56;
// When flipped below the text, only the bottom corner handles intrude — half
// the touch hit area — so a smaller clearance is enough.
const BELOW_CLEARANCE_PX = 24;
const SCREEN_EDGE_GAP_PX = 8;

export interface FloatingTypographyToolbarProps {
  active: ActiveObjectInfo | null;
  canvas: fabric.Canvas | null;
  onUpdateText: (patch: Partial<ActiveTextProps>) => void;
}

export default function FloatingTypographyToolbar({
  active,
  canvas,
  onUpdateText,
}: FloatingTypographyToolbarProps) {
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvas || !active || active.kind !== "text") {
      setPos(null);
      return;
    }
    const fabricObj = canvas.getActiveObject();
    if (!fabricObj) return;

    function reposition() {
      const obj = fabricObj as fabric.Object;
      // Phase 12 Subtask 4: bbox MUST be in viewport-space (absolute=false)
      // so canvas zoom + pan are baked into bbox.left/top — passing
      // absolute=true returned canvas-space coords and the toolbar drifted
      // off the text whenever the user zoomed in.
      const bbox = obj.getBoundingRect(false, true);
      // `lowerCanvasEl` is exposed at runtime by Fabric ≥ 4 but missing
      // from @types/fabric ^5.3. Cast through unknown to reach the DOM node
      // for getBoundingClientRect.
      const canvasEl = (canvas as unknown as {
        lowerCanvasEl: HTMLCanvasElement;
      }).lowerCanvasEl;
      const cRect = canvasEl.getBoundingClientRect();
      const toolbarW =
        toolbarRef.current?.offsetWidth ?? FALLBACK_TOOLBAR_WIDTH_PX;
      const toolbarH =
        toolbarRef.current?.offsetHeight ?? FALLBACK_TOOLBAR_HEIGHT_PX;

      const textTopScreen = cRect.top + bbox.top;
      const textBottomScreen = cRect.top + bbox.top + bbox.height;
      const desiredTop = textTopScreen - toolbarH - ABOVE_CLEARANCE_PX;
      const flipBelow = desiredTop < SCREEN_EDGE_GAP_PX;
      const top = flipBelow
        ? textBottomScreen + BELOW_CLEARANCE_PX
        : desiredTop;

      const centerScreen = cRect.left + bbox.left + bbox.width / 2;
      const half = toolbarW / 2;
      const minLeft = SCREEN_EDGE_GAP_PX + half;
      const maxLeft = window.innerWidth - SCREEN_EDGE_GAP_PX - half;
      const clamped =
        minLeft <= maxLeft
          ? Math.max(minLeft, Math.min(maxLeft, centerScreen))
          : window.innerWidth / 2;
      setPos({ left: clamped, top });
    }

    reposition();
    canvas.on("after:render", reposition);
    canvas.on("object:moving", reposition);
    canvas.on("object:scaling", reposition);
    canvas.on("object:rotating", reposition);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      canvas.off("after:render", reposition);
      canvas.off("object:moving", reposition);
      canvas.off("object:scaling", reposition);
      canvas.off("object:rotating", reposition);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [active, canvas]);

  if (!active || active.kind !== "text" || !pos) return null;

  const props = active.text;
  const fontWeight = props?.fontWeight ?? "normal";
  const fontStyle = props?.fontStyle ?? "normal";
  const isBold =
    fontWeight === "bold" ||
    fontWeight === 700 ||
    (typeof fontWeight === "number" && fontWeight >= 600);
  const isItalic = fontStyle === "italic";
  const textAlign = props?.textAlign ?? "left";
  const fill = props?.fill ?? FILL_DEFAULT_COLOR;

  return (
    <div
      ref={toolbarRef}
      role="toolbar"
      aria-label="Типографія"
      style={{ left: pos.left, top: pos.top }}
      // Stop pointerdown from bubbling so the canvas's pan / selection
      // handlers don't see toolbar taps as canvas interactions. Touch on
      // a fixed, body-level element doesn't normally reach fabric, but
      // some layout chains (toolbar overlapping canvas DOM) can leak.
      onPointerDown={(e) => e.stopPropagation()}
      className="pointer-events-auto fixed z-30 flex -translate-x-1/2 items-center gap-1 rounded-md border border-stone-200 bg-white p-1.5 shadow-md md:hidden"
    >
      <ToolbarButton
        active={isBold}
        onClick={() => onUpdateText({ fontWeight: isBold ? "normal" : "bold" })}
        label="Жирний"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        active={isItalic}
        onClick={() =>
          onUpdateText({ fontStyle: isItalic ? "normal" : "italic" })
        }
        label="Курсив"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <Divider />
      <ToolbarButton
        active={textAlign === "left"}
        onClick={() => onUpdateText({ textAlign: "left" })}
        label="Зліва"
      >
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        active={textAlign === "center"}
        onClick={() => onUpdateText({ textAlign: "center" })}
        label="По центру"
      >
        <AlignCenter className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        active={textAlign === "right"}
        onClick={() => onUpdateText({ textAlign: "right" })}
        label="Зправа"
      >
        <AlignRight className="h-4 w-4" />
      </ToolbarButton>
      <Divider />
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            title="Колір"
            aria-label="Колір"
            className="flex h-8 w-8 items-center justify-center rounded border border-stone-300 hover:bg-stone-50"
          >
            <span
              aria-hidden
              className="block h-4 w-4 rounded-sm border border-stone-300"
              style={{ backgroundColor: fill }}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="center" className="w-auto p-2">
          <ColorRow
            value={fill}
            fallbackHex={FILL_DEFAULT_COLOR}
            onChange={(next) => onUpdateText({ fill: next })}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface ToolbarButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}

function ToolbarButton({ active, onClick, label, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={[
        "flex h-8 w-8 items-center justify-center rounded transition-colors",
        active
          ? "bg-stone-900 text-white"
          : "text-stone-700 hover:bg-stone-100",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span aria-hidden className="mx-0.5 h-5 w-px bg-stone-200" />;
}
