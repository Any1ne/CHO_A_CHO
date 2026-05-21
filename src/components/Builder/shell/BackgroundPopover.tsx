// src/components/Builder/shell/BackgroundPopover.tsx
//
// Single wrapper-colour picker. Drops the dual Тло / Папір split — the
// chocolate's wrapper is one surface, so the user picks one colour.
// Renders as a floating round trigger at the top-right of the canvas;
// click opens a leftward-anchored popover with preset swatches + a
// custom hex ColorRow (no alpha — wrapper colour is always opaque).

"use client";

import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ColorRow } from "./ColorRow";

// Phase 32 Subtask 2: relative luminance approximation. Lets us pick a
// readable icon colour on top of any hex bg. Threshold tuned so the
// stone-700 icon stays visible on the default crème palette (#F5EAD0)
// and the white icon kicks in on graphite / black. Pure white bg
// keeps the stone-700 icon (lum ~1.0 > 0.55).
function isLightHex(hex: string | null | undefined): boolean {
  if (!hex) return true;
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return true;
  const v = parseInt(m[1], 16);
  const r = (v >> 16) & 0xff;
  const g = (v >> 8) & 0xff;
  const b = v & 0xff;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55;
}

const PRESETS: { hex: string; label: string }[] = [
  { hex: "#FFFFFF", label: "Білий" },
  { hex: "#F5EAD0", label: "Крем" },
  { hex: "#F3D6D6", label: "Рожевий" },
  { hex: "#E0A3A3", label: "Пильна троянда" },
  { hex: "#C8D5B9", label: "Шавлія" },
  { hex: "#BBD7E8", label: "Небесний" },
  { hex: "#D6CCE6", label: "Лаванда" },
  { hex: "#E8DFCB", label: "Беж" },
  { hex: "#3F3F46", label: "Графіт" },
  { hex: "#1A1A1A", label: "Чорний" },
];

export interface BackgroundPopoverProps {
  value: string | null;
  onChange: (next: string) => void;
}

export default function BackgroundPopover({
  value,
  onChange,
}: BackgroundPopoverProps) {
  // Match a preset by case-insensitive hex (parseColor returns lowercase).
  const normalisedValue = value ? value.toLowerCase() : null;
  // Phase 32 Subtask 2: trigger bg mirrors the active colour so the
  // button reads as a swatch, not a generic icon. White / null falls
  // back to bg-white + stone-700 icon. Dark picks flip to white icon.
  const triggerBg = value ?? "#FFFFFF";
  const triggerIconTone = isLightHex(value)
    ? "text-stone-700"
    : "text-white";
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          title="Колір тла"
          aria-label="Колір тла"
          // Phase 25 Subtask 5 + Phase 32 Subtask 2: size classes match
          // FloatingActionButton; trigger background reflects active
          // colour via inline style so the button reads as the current
          // selection rather than a generic icon.
          style={{ backgroundColor: triggerBg }}
          className={[
            "pointer-events-auto h-9 w-9 rounded-full border border-stone-300 shadow-md hover:opacity-90 sm:h-10 sm:w-10 xl:h-12 xl:w-12 2xl:h-14 2xl:w-14 [&>svg]:xl:h-5 [&>svg]:xl:w-5 [&>svg]:2xl:h-6 [&>svg]:2xl:w-6",
            triggerIconTone,
          ].join(" ")}
        >
          <Palette className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        // Bottom-left cluster: open upward + align-start so popover
        // appears above the trigger and extends rightward into canvas.
        side="top"
        align="start"
        sideOffset={8}
        className="w-72 space-y-3 p-3"
      >
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Колір тла
          </h3>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {PRESETS.map((p) => {
            const isActive = normalisedValue === p.hex.toLowerCase();
            return (
              <button
                key={p.hex}
                type="button"
                onClick={() => onChange(p.hex.toLowerCase())}
                title={p.label}
                aria-label={p.label}
                aria-pressed={isActive}
                className={[
                  "h-8 w-full rounded-md border transition-shadow",
                  isActive
                    ? "border-stone-900 ring-2 ring-stone-900 ring-offset-1"
                    : "border-stone-200 hover:border-stone-400",
                ].join(" ")}
                style={{ backgroundColor: p.hex }}
              />
            );
          })}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-stone-500">Свій колір</label>
          <ColorRow
            value={value}
            fallbackHex="#FFFFFF"
            showAlpha={false}
            onChange={onChange}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
