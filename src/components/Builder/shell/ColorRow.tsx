// src/components/Builder/shell/ColorRow.tsx
//
// Reusable Figma-style color control. Shared by RightPanel (text fill /
// stroke) and LeftPanel (paper / background color). Layout:
//
//   [swatch 24×24, opens hidden native picker]
//   [hex input ~70px, accepts "#RRGGBB" / "RRGGBB" / "#RGB" / "RGB"]
//   [alpha NumberBox 0–100 %]
//
// Output: a single color string passed to onChange.
//   • alpha === 100 → "#rrggbb"
//   • alpha  <  100 → "rgba(r, g, b, a)"
//
// Validates hex on blur / Enter. Escape reverts. Checkerboard pattern shows
// under the swatch when alpha < 100.

"use client";

import { useEffect, useRef, useState } from "react";

export interface ColorRowProps {
  value: string | null;
  fallbackHex: string;
  disabled?: boolean;
  /** When false, the alpha NumberBox is hidden and emitted colors are
   *  always opaque hex. Used by the Папір (paper) picker where alpha
   *  control would just confuse the buyer. Default true. */
  showAlpha?: boolean;
  onChange: (next: string) => void;
}

export function ColorRow({
  value,
  fallbackHex,
  disabled,
  showAlpha = true,
  onChange,
}: ColorRowProps) {
  const parsed = parseColor(value, fallbackHex);
  const swatchInputRef = useRef<HTMLInputElement>(null);

  // RAF-batch the native color picker's continuous onChange. Without
  // this, every drag tick fires a parent setter — fast pickers can
  // overload the React update bridge and produce flicker / dropped
  // frames. The RAF coalesces rapid ticks into one update per frame.
  const rafIdRef = useRef<number | null>(null);
  const pendingValueRef = useRef<string | null>(null);
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);
  function scheduleOnChange(next: string) {
    pendingValueRef.current = next;
    if (rafIdRef.current !== null) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      const v = pendingValueRef.current;
      pendingValueRef.current = null;
      if (v !== null) onChange(v);
    });
  }

  const [hexDraft, setHexDraft] = useState(parsed.hex);
  // Sync the local draft with the upstream value WHEN it actually
  // differs. The unconditional setHexDraft was the entry point for the
  // "Maximum update depth" infinite loop: a parent that normalised the
  // emitted color (e.g. lower-case → upper-case → rgba expansion) would
  // produce a different `parsed.hex` on every commit, the effect would
  // setHexDraft with that new string, and any cascading parent re-render
  // could re-trigger the cycle. The functional setter form short-
  // circuits on string equality.
  useEffect(() => {
    setHexDraft((prev) => (prev === parsed.hex ? prev : parsed.hex));
  }, [parsed.hex]);

  // When the alpha control is hidden, the row is opaque-only — force
  // alpha=100 on every emitted color so a stale alpha from earlier edits
  // can't sneak through.
  const effectiveAlpha = showAlpha ? parsed.alpha : 100;

  function commitHex(rawDraft: string) {
    const normalised = normaliseHex(rawDraft);
    if (!normalised) {
      setHexDraft(parsed.hex);
      return;
    }
    setHexDraft(normalised);
    onChange(combineColor(normalised, effectiveAlpha));
  }

  return (
    <div className="flex items-center gap-2">
      {/* Phase 14 Subtask 2: the native `<input type="color">` IS the
          swatch. Earlier attempts with a button + hidden input failed on
          iOS Safari — even with the input in layout, programmatic
          `.click()` from a button handler doesn't reliably open the OS
          picker. Letting the user tap the input directly does. We style
          the input with `appearance: none` and a backgroundColor + a
          checkerboard pattern when alpha < 100, so it visually reads as
          the same swatch as before. */}
      <input
        ref={swatchInputRef}
        type="color"
        value={parsed.hex}
        onChange={(e) => {
          const next = e.target.value.toLowerCase();
          setHexDraft(next);
          scheduleOnChange(combineColor(next, effectiveAlpha));
        }}
        disabled={disabled}
        title="Обрати колір"
        aria-label="Обрати колір"
        className="h-6 w-6 shrink-0 cursor-pointer rounded border border-stone-300 [appearance:none] [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-[3px] [&::-webkit-color-swatch]:border-none disabled:cursor-not-allowed disabled:opacity-40"
        style={{
          backgroundColor: combineColor(parsed.hex, parsed.alpha),
          backgroundImage:
            parsed.alpha < 100
              ? "linear-gradient(45deg, #ddd 25%, transparent 25%), linear-gradient(-45deg, #ddd 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ddd 75%), linear-gradient(-45deg, transparent 75%, #ddd 75%)"
              : undefined,
          backgroundSize: parsed.alpha < 100 ? "8px 8px" : undefined,
          backgroundPosition:
            parsed.alpha < 100 ? "0 0, 0 4px, 4px -4px, -4px 0" : undefined,
        }}
      />

      <input
        type="text"
        value={hexDraft.replace(/^#/, "").toUpperCase()}
        onChange={(e) => setHexDraft(e.target.value)}
        onBlur={(e) => commitHex(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur();
          } else if (e.key === "Escape") {
            setHexDraft(parsed.hex);
            (e.target as HTMLInputElement).blur();
          }
        }}
        disabled={disabled}
        spellCheck={false}
        autoComplete="off"
        aria-label="HEX"
        className="h-8 w-[70px] rounded-md border border-stone-300 bg-white px-2 text-xs uppercase tabular-nums text-stone-900 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500/30 disabled:opacity-40"
      />

      {showAlpha && (
        <div className="w-[52px] shrink-0">
          <ColorAlphaInput
            value={parsed.alpha}
            disabled={disabled}
            onChange={(v) =>
              onChange(combineColor(parsed.hex, clamp(v, 0, 100)))
            }
          />
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------- */
/* Tiny number input dedicated to alpha. Mirrors NumberBox's UX (typed   */
/* draft, commit-on-blur, arrow / wheel nudge) but lives here to avoid   */
/* a circular import between LeftPanel and RightPanel.                   */
/* -------------------------------------------------------------------- */

function ColorAlphaInput({
  value,
  disabled,
  onChange,
}: {
  value: number;
  disabled?: boolean;
  onChange: (v: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  const lastAppliedRef = useRef<number>(value);

  useEffect(() => {
    if (value !== lastAppliedRef.current) {
      lastAppliedRef.current = value;
      setDraft(String(value));
    }
  }, [value]);

  function commit() {
    const parsed = Number.parseFloat(draft);
    if (!Number.isFinite(parsed)) {
      setDraft(String(lastAppliedRef.current));
      return;
    }
    const c = clamp(parsed, 0, 100);
    setDraft(String(c));
    if (c !== lastAppliedRef.current) {
      lastAppliedRef.current = c;
      onChange(c);
    }
  }

  function nudge(direction: 1 | -1) {
    const cur = Number.parseFloat(draft);
    const base = Number.isFinite(cur) ? cur : lastAppliedRef.current;
    const next = clamp(base + direction, 0, 100);
    setDraft(String(next));
    if (next !== lastAppliedRef.current) {
      lastAppliedRef.current = next;
      onChange(next);
    }
  }

  return (
    <div className="flex h-8 w-full items-center rounded-md border border-stone-300 bg-white px-2 focus-within:border-stone-500 focus-within:ring-1 focus-within:ring-stone-500/30 [&:has(:disabled)]:opacity-40">
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={100}
        step={1}
        value={draft}
        disabled={disabled}
        aria-label="Прозорість кольору"
        title="Прозорість кольору"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          } else if (e.key === "Escape") {
            setDraft(String(lastAppliedRef.current));
            e.currentTarget.blur();
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            nudge(1);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            nudge(-1);
          }
        }}
        onWheel={(e) => {
          if (document.activeElement !== e.currentTarget) return;
          e.preventDefault();
          nudge(e.deltaY < 0 ? 1 : -1);
        }}
        className="h-full min-w-0 flex-1 bg-transparent text-right text-xs tabular-nums text-stone-900 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span className="ml-0.5 select-none text-[10px] text-stone-400">%</span>
    </div>
  );
}

/* -------------------------------------------------------------------- */
/* Color helpers                                                        */
/* -------------------------------------------------------------------- */

interface ParsedColor {
  hex: string; // "#rrggbb"
  alpha: number; // 0..100
}

export function parseColor(value: string | null, fallback: string): ParsedColor {
  if (!value) return { hex: fallback.toLowerCase(), alpha: 100 };
  const s = value.trim();

  const hex6 = s.match(/^#?([0-9a-fA-F]{6})$/);
  if (hex6) return { hex: `#${hex6[1].toLowerCase()}`, alpha: 100 };

  const hex3 = s.match(/^#?([0-9a-fA-F]{3})$/);
  if (hex3) {
    const [r, g, b] = hex3[1].split("");
    return {
      hex: `#${r}${r}${g}${g}${b}${b}`.toLowerCase(),
      alpha: 100,
    };
  }

  const rgb = s.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)$/
  );
  if (rgb) {
    const r = clamp(parseInt(rgb[1], 10), 0, 255);
    const g = clamp(parseInt(rgb[2], 10), 0, 255);
    const b = clamp(parseInt(rgb[3], 10), 0, 255);
    const alpha =
      rgb[4] !== undefined
        ? clamp(Math.round(parseFloat(rgb[4]) * 100), 0, 100)
        : 100;
    return { hex: rgbToHex(r, g, b), alpha };
  }

  return { hex: fallback.toLowerCase(), alpha: 100 };
}

export function combineColor(hex: string, alpha: number): string {
  if (alpha >= 100) return hex.toLowerCase();
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const a = Math.max(0, Math.min(1, alpha / 100));
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((n) => clamp(n, 0, 255).toString(16).padStart(2, "0"))
      .join("")
  );
}

export function normaliseHex(raw: string): string | null {
  const trimmed = raw.trim();
  const m6 = trimmed.match(/^#?([0-9a-fA-F]{6})$/);
  if (m6) return `#${m6[1].toLowerCase()}`;
  const m3 = trimmed.match(/^#?([0-9a-fA-F]{3})$/);
  if (m3) {
    const [r, g, b] = m3[1].split("");
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
