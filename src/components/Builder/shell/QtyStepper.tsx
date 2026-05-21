// src/components/Builder/shell/QtyStepper.tsx
//
// Phase 30 Subtask 6: shared quantity stepper. Single source of truth
// for the +/- buttons + free-form numeric input used across the
// builder (SetupConfigPanel, mobile setup bottom bar, SubmissionDialog
// quantity adjuster). Uses `type="text"` + `inputMode="numeric"` so
// the input has no native spinner buttons AND can hold ANY string
// during typing (empty, partial digits, etc.). Only commits to the
// upstream value on blur or Enter. Below-min input falls back to
// `min`. Optional "шт" suffix sits inside the input box, right-aligned.
//
// Why we ditched the prior QtyInput attempts:
//   - `type="number"` silently dropped non-numeric strings, fighting
//     the buyer's keystrokes mid-edit.
//   - Sync useEffect that resynced draft to value on every value
//     change wiped the in-progress draft when the +/- buttons fired
//     while focused.
//   - Native min/max attribute on number inputs varied per browser —
//     some browsers reverted to min during blur, some didn't.
//
// This version sidesteps all of that by treating the input as a free
// text field and validating only at commit time.

"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";

export interface QtyStepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Optional id for label `htmlFor` association. */
  id?: string;
  ariaLabel?: string;
  /**
   * `data-tour` attribute on the wrapper div — used by the onboarding
   * tour to anchor the qty-stepper step.
   */
  dataTour?: string;
  /** Whether to render the "шт" suffix inside the input. Defaults to true. */
  showSuffix?: boolean;
  /** Variant: `default` (filled +/− pills) or `compact` (smaller for
   *  inline contexts like the mobile setup bottom bar). */
  variant?: "default" | "compact";
}

export default function QtyStepper({
  value,
  onChange,
  min = 100,
  max = 10000,
  step = 1,
  id,
  ariaLabel,
  dataTour,
  showSuffix = true,
  variant = "default",
}: QtyStepperProps) {
  const [draft, setDraft] = useState<string>(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  // External value changes sync to draft ONLY when the input isn't
  // focused. While focused, the buyer's keystrokes win. The +/−
  // buttons blur the input (no autofocus on them), so a stepper click
  // fires external `value` → draft sync via this effect.
  useEffect(() => {
    if (typeof document !== "undefined" && document.activeElement === inputRef.current) {
      return;
    }
    setDraft(String(value));
  }, [value]);

  function commit() {
    const trimmed = draft.trim();
    let next: number;
    if (trimmed === "") {
      next = min;
    } else {
      const parsed = Number.parseInt(trimmed, 10);
      if (!Number.isFinite(parsed) || parsed < min) {
        next = min;
      } else {
        next = Math.min(max, parsed);
      }
    }
    setDraft(String(next));
    onChange(next);
  }

  const isCompact = variant === "compact";
  const btnSize = isCompact ? "h-8 w-8" : "h-9 w-9";
  const inputWidth = isCompact ? "w-16" : "w-20";

  return (
    <div
      data-tour={dataTour}
      className="inline-flex items-center gap-1"
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
        aria-label="Зменшити кількість"
        className={[
          "flex items-center justify-center rounded-full bg-stone-100 text-stone-700 transition hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-stone-100",
          btnSize,
        ].join(" ")}
      >
        <Minus className="h-4 w-4" />
      </button>

      <div className="relative flex items-center">
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={draft}
          aria-label={ariaLabel ?? "Кількість"}
          onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
          onBlur={commit}
          onFocus={(e) => e.currentTarget.select()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commit();
              (e.target as HTMLInputElement).blur();
            }
          }}
          className={[
            "rounded-md border border-stone-300 bg-white text-center text-sm font-medium tabular-nums text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600/30",
            isCompact ? "h-8 py-1" : "h-9 py-1.5",
            inputWidth,
            showSuffix ? "pr-7 pl-2" : "px-2",
          ].join(" ")}
        />
        {showSuffix && (
          <span className="pointer-events-none absolute right-2 select-none text-xs text-stone-400">
            шт
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + step))}
        disabled={value >= max}
        aria-label="Збільшити кількість"
        className={[
          "flex items-center justify-center rounded-full bg-stone-100 text-stone-700 transition hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-stone-100",
          btnSize,
        ].join(" ")}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
