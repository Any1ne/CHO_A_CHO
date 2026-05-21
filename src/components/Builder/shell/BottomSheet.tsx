// src/components/Builder/shell/BottomSheet.tsx
//
// Phase 32 Subtask 6: lightweight mobile bottom-sheet. Lives inside
// the BuilderShell tree (no portal) and lays itself out fixed +
// inset-0, so it can host the LeftPanel / RightPanel content without
// pulling in a new dependency. Auto-hidden on lg+ via `lg:hidden` —
// desktop keeps the inline grid layout.

"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function BottomSheet({
  open,
  onClose,
  title,
  children,
}: BottomSheetProps) {
  // Lock body scroll while the sheet is open so the canvas underneath
  // doesn't drift on touch-scroll past the sheet edge.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC key dismisses.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-label={title}>
      <button
        type="button"
        aria-label="Закрити"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 transition-opacity"
      />
      <div className="absolute inset-x-0 bottom-0 flex max-h-[80vh] flex-col rounded-t-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрити"
            className="rounded-md p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
