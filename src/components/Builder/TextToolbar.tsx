// src/components/Builder/TextToolbar.tsx
"use client";

import { useEffect, useState } from "react";
import { Trash2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUILDER_FONTS } from "./fonts";
import type { ActiveTextProps } from "./ConstructorCanvas";

const PRESET_COLORS = [
  "#1a1a1a",
  "#ffffff",
  "#b25d00",
  "#2456b4",
  "#1a6b3a",
  "#b51a1a",
];

const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 120;
const FONT_STEP = 2;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

interface TextToolbarProps {
  value: ActiveTextProps;
  onChange: (patch: Partial<ActiveTextProps>) => void;
  onDelete: () => void;
}

export default function TextToolbar({ value, onChange, onDelete }: TextToolbarProps) {
  // Local draft for the hex input so the user can type partial values
  // without us spamming onChange / fabric on every keystroke.
  const [hexDraft, setHexDraft] = useState(value.fill);
  useEffect(() => {
    setHexDraft(value.fill);
  }, [value.fill]);

  const setSize = (n: number) =>
    onChange({ fontSize: clamp(n, MIN_FONT_SIZE, MAX_FONT_SIZE) });

  return (
    <div className="space-y-5 p-5">
      <h3 className="text-sm font-semibold text-stone-700">Текст</h3>

      {/* Font family */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-stone-500">
          Шрифт
        </label>
        <select
          value={value.fontFamily}
          onChange={(e) => onChange({ fontFamily: e.target.value })}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
        >
          {BUILDER_FONTS.map((f) => (
            <option key={f.id} value={f.family} style={{ fontFamily: f.family }}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {/* Font size */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-stone-500">
          Розмір
        </label>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSize((value.fontSize ?? 32) - FONT_STEP)}
            disabled={(value.fontSize ?? 32) <= MIN_FONT_SIZE}
            aria-label="Зменшити шрифт"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="flex-1 text-center text-sm tabular-nums text-stone-700">
            {Math.round(value.fontSize ?? 32)} px
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSize((value.fontSize ?? 32) + FONT_STEP)}
            disabled={(value.fontSize ?? 32) >= MAX_FONT_SIZE}
            aria-label="Збільшити шрифт"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Color */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-stone-500">
          Колір
        </label>
        <div className="mb-2 grid grid-cols-6 gap-2">
          {PRESET_COLORS.map((c) => {
            const active = c.toLowerCase() === value.fill.toLowerCase();
            return (
              <button
                key={c}
                type="button"
                aria-label={c}
                onClick={() => onChange({ fill: c })}
                className={[
                  "h-8 w-full rounded-md border transition-all",
                  active
                    ? "border-amber-600 ring-2 ring-amber-600/30"
                    : "border-stone-200 hover:border-stone-300",
                ].join(" ")}
                style={{ backgroundColor: c }}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-400">HEX</span>
          <input
            type="text"
            value={hexDraft}
            onChange={(e) => setHexDraft(e.target.value)}
            onBlur={() => {
              if (HEX_RE.test(hexDraft)) onChange({ fill: hexDraft });
              else setHexDraft(value.fill);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
            }}
            placeholder="#000000"
            spellCheck={false}
            className="flex-1 rounded-md border border-stone-300 px-2 py-1.5 font-mono text-sm uppercase tracking-wide focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
          />
        </div>
      </div>

      {/* Delete */}
      <Button
        variant="outline"
        onClick={onDelete}
        className="w-full justify-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
        Видалити
      </Button>
    </div>
  );
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
