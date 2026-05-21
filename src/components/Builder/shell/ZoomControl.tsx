// src/components/Builder/shell/ZoomControl.tsx
"use client";

import { Maximize2, Minus, Plus, RotateCcw } from "lucide-react";

export const ZOOM_MIN = 0.25;
export const ZOOM_MAX = 4;
const ZOOM_STEP = 0.05;
const ZOOM_BUTTON_FACTOR = 1.25;

export interface ZoomControlProps {
  /** Current zoom level (1 = 100%). */
  zoom: number;
  onZoomChange: (next: number) => void;
  /** Reset zoom to 1 AND restore identity viewportTransform on the canvas. */
  onReset: () => void;
}

function clampZoom(n: number): number {
  return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, n));
}

/**
 * Floating zoom slider. Designed to be positioned absolute-bottom-right by
 * the parent (BuilderShell positions it inside the canvas frame).
 *
 * Mobile users see {@link ZoomButtonsControl} instead — sliders are fiddly
 * on touch.
 */
export default function ZoomControl({
  zoom,
  onZoomChange,
  onReset,
}: ZoomControlProps) {
  const pct = Math.round(zoom * 100);

  return (
    <div
      role="group"
      aria-label="Масштаб"
      className="flex items-center gap-2 rounded-full border border-stone-200 bg-white/95 px-3 py-1.5 shadow-md backdrop-blur"
    >
      <input
        type="range"
        min={ZOOM_MIN}
        max={ZOOM_MAX}
        step={ZOOM_STEP}
        value={zoom}
        onChange={(e) => onZoomChange(Number(e.target.value))}
        aria-label="Масштаб"
        title={`${pct}%`}
        className="h-1 w-32 cursor-pointer appearance-none bg-stone-200 accent-amber-600"
      />
      <span className="w-12 text-right font-mono text-xs tabular-nums text-stone-600">
        {pct}%
      </span>
      <button
        type="button"
        onClick={onReset}
        aria-label="Скинути масштаб"
        title="Скинути масштаб"
        className="flex h-6 w-6 items-center justify-center rounded text-stone-500 hover:bg-stone-100 hover:text-stone-800"
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/**
 * Three-button zoom control. Phase 14 Subtask 4: gains a `vertical` prop
 * that stacks the buttons top-to-bottom (Plus / Reset / Minus) for the
 * bottom-right cluster. Phase 15 Subtask 3: in vertical mode the three
 * buttons are wrapped in a single white pill (bg + rounded-full +
 * shadow-sm) with tight 4 px gaps so they read as one grouped element,
 * separated from the standalone settings button above by the cluster's
 * own gap. Default horizontal stays valid for legacy callers.
 * Each press multiplies / divides current zoom by 1.25, clamped to
 * [ZOOM_MIN, ZOOM_MAX]; Reset restores 1× plus identity viewport
 * transform via `onReset`.
 */
export function ZoomButtonsControl({
  zoom,
  onZoomChange,
  onReset,
  vertical = false,
}: ZoomControlProps & { vertical?: boolean }) {
  const atMax = zoom >= ZOOM_MAX - 1e-6;
  const atMin = zoom <= ZOOM_MIN + 1e-6;
  const buttons = (
    <>
      <ZoomRoundButton
        onClick={() => onZoomChange(clampZoom(zoom * ZOOM_BUTTON_FACTOR))}
        disabled={atMax}
        label="Збільшити масштаб"
        bare={vertical}
      >
        <Plus className="h-4 w-4" />
      </ZoomRoundButton>
      <ZoomRoundButton
        onClick={onReset}
        label="Скинути масштаб"
        bare={vertical}
      >
        <Maximize2 className="h-4 w-4" />
      </ZoomRoundButton>
      <ZoomRoundButton
        onClick={() => onZoomChange(clampZoom(zoom / ZOOM_BUTTON_FACTOR))}
        disabled={atMin}
        label="Зменшити масштаб"
        bare={vertical}
      >
        <Minus className="h-4 w-4" />
      </ZoomRoundButton>
    </>
  );
  if (vertical) {
    return (
      <div
        role="group"
        aria-label="Масштаб"
        className="flex flex-col items-center gap-1 rounded-full border border-stone-200 bg-white p-1 shadow-sm"
      >
        {buttons}
      </div>
    );
  }
  return (
    <div
      role="group"
      aria-label="Масштаб"
      className="flex items-center gap-2"
    >
      {buttons}
    </div>
  );
}

function ZoomRoundButton({
  onClick,
  disabled,
  label,
  children,
  bare = false,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
  /** When true, drop the button's own border / bg / shadow — caller
   *  (vertical cluster) supplies a single shared wrapper. */
  bare?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={[
        // Phase 23 Subtask 6: bump button size at xl:/2xl: so the
        // zoom cluster stays usable on 1440p+ desktops.
        "flex h-8 w-8 items-center justify-center rounded-full text-stone-700 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 xl:h-10 xl:w-10 2xl:h-12 2xl:w-12 [&>svg]:xl:h-5 [&>svg]:xl:w-5 [&>svg]:2xl:h-6 [&>svg]:2xl:w-6",
        bare
          ? "hover:bg-stone-100"
          : "border border-stone-200 bg-white shadow-sm hover:bg-stone-50 disabled:hover:bg-white h-9 w-9",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
