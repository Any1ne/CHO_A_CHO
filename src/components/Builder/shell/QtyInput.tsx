// src/components/Builder/shell/QtyInput.tsx
//
// Phase 25 Subtask 1 + Phase 26 Subtask 1: clearable quantity input.
// During typing the field accepts ANY string (empty, partial digits, even
// gibberish — fabric won't see it until commit). On blur OR Enter the
// draft is validated:
//   • empty / NaN / below `min` → falls back to `min` (default 100)
//   • otherwise clamped to [min, max] and committed via `onChange`.
//
// External `value` prop changes (e.g. the +/− stepper buttons firing
// while the input is NOT focused) re-sync the draft. While the input
// IS focused the sync is skipped so the buyer's keystrokes aren't
// stomped. The previous attempt re-synced on every render including
// while focused, which silently reverted each keystroke back to the
// committed `value` — making the field appear read-only.

"use client";

import { useEffect, useRef, useState } from "react";

export interface QtyInputProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  id?: string;
  ariaLabel?: string;
  className?: string;
}

export default function QtyInput({
  value,
  onChange,
  min = 100,
  max = 10000,
  id,
  ariaLabel,
  className,
}: QtyInputProps) {
  const [draft, setDraft] = useState<string>(String(value));
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSyncedValueRef = useRef(value);

  // Sync the draft to upstream `value` ONLY when:
  //   1. value actually changed (lastSyncedValueRef tracks the last
  //      value we mirrored — guards against unrelated re-renders), AND
  //   2. the input is not focused (so we don't fight the buyer's
  //      keystrokes — the +/− stepper buttons fire while focus is
  //      elsewhere on the stepper).
  useEffect(() => {
    if (lastSyncedValueRef.current === value) return;
    lastSyncedValueRef.current = value;
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
    lastSyncedValueRef.current = next;
    setDraft(String(next));
    onChange(next);
  }

  return (
    <input
      ref={inputRef}
      id={id}
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      value={draft}
      aria-label={ariaLabel}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          commit();
          (e.target as HTMLInputElement).blur();
        }
      }}
      className={className}
    />
  );
}
