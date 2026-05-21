// src/components/Builder/shell/SaveIndicator.tsx
//
// Phase 32 Subtask 3: tiny auto-save status chip. Subscribes to the
// persistence module's pub/sub channel so any draft write — successful
// or quota-blocked — surfaces in the breadcrumb area. Stays at low
// visual weight (xs text, muted colours) so it doesn't pull attention
// from the canvas. The "saving" state is brief (<10 ms typically) so
// the spinner barely flashes; the chip otherwise reads "Збережено
// локально" between writes and switches to "Помилка збереження" if a
// write fails (private mode, quota exceeded).

"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { subscribeSaveState, type SaveState } from "@/lib/builder/persistence";

const LABEL: Record<Exclude<SaveState, "idle">, string> = {
  saving: "Збереження…",
  saved: "Збережено локально",
  error: "Помилка збереження",
};

export default function SaveIndicator() {
  const [state, setState] = useState<SaveState>("idle");

  useEffect(() => subscribeSaveState(setState), []);

  // Hide entirely while idle — the first save tick promotes the chip.
  if (state === "idle") return null;

  return (
    <span
      role="status"
      aria-live="polite"
      className="flex shrink-0 items-center gap-1 text-[11px] text-stone-500 sm:text-xs"
    >
      {state === "saving" && (
        <Loader2 className="h-3 w-3 animate-spin text-stone-400" />
      )}
      {state === "saved" && (
        <Check className="h-3 w-3 text-emerald-600" />
      )}
      {state === "error" && (
        <AlertCircle className="h-3 w-3 text-amber-600" />
      )}
      <span className="hidden sm:inline">{LABEL[state]}</span>
    </span>
  );
}
