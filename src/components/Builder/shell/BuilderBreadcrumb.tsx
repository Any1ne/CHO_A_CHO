// src/components/Builder/shell/BuilderBreadcrumb.tsx
//
// Phase 30 Subtask 2 / Subtask 3: builder breadcrumb. Replaces the
// server-side breadcrumb that used to live in /builder/[shapeId]/
// page.tsx. Client component because:
//   - The current-shape segment is a Popover trigger that lets the
//     buyer switch shapes without going back to /branded.
//   - The help button on the right side fires `onRestartTour` to
//     reopen the onboarding tour.

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, HelpCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { ShapeConfig } from "@/types/builder";
import SaveIndicator from "./SaveIndicator";

interface BuilderBreadcrumbProps {
  /** Full shape catalog so the dropdown lists every option. */
  shapes: ShapeConfig[];
  /** Shape currently displayed in the builder (id match). */
  currentShapeId: string;
  /** Optional help-button handler. When omitted, button is hidden. */
  onRestartTour?: () => void;
}

export default function BuilderBreadcrumb({
  shapes,
  currentShapeId,
  onRestartTour,
}: BuilderBreadcrumbProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const current = shapes.find((s) => s.id === currentShapeId);

  function handleSelect(shapeId: string) {
    setOpen(false);
    if (shapeId === currentShapeId) return;
    router.push(`/builder/${shapeId}`);
  }

  return (
    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-stone-200 bg-white px-3 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm lg:px-8">
      <nav className="flex min-w-0 items-center gap-2 overflow-x-auto whitespace-nowrap">
        <Link
          href="/branded"
          className="inline-flex shrink-0 items-center gap-1 text-stone-500 transition hover:text-stone-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Брендована упаковка
        </Link>
        <span className="text-stone-300">/</span>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 font-medium text-stone-700 transition hover:bg-stone-100 hover:text-stone-900 data-[state=open]:bg-stone-100"
              aria-label="Обрати продукт"
            >
              {current?.name ?? currentShapeId}
              <ChevronDown className="h-3.5 w-3.5 text-stone-500" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" sideOffset={6} className="w-56 p-1">
            <div className="flex flex-col">
              {shapes.map((shape) => {
                const isActive = shape.id === currentShapeId;
                return (
                  <button
                    key={shape.id}
                    type="button"
                    onClick={() => handleSelect(shape.id)}
                    className={[
                      "flex items-center justify-between rounded-md px-2.5 py-2 text-left text-sm transition",
                      isActive
                        ? "bg-stone-100 font-semibold text-stone-900"
                        : "text-stone-700 hover:bg-stone-50",
                    ].join(" ")}
                  >
                    <span>{shape.name}</span>
                    {isActive && (
                      <span className="text-xs text-stone-400">Поточний</span>
                    )}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </nav>
      <div className="flex shrink-0 items-center gap-3">
        <SaveIndicator />
        {onRestartTour && (
          <button
            type="button"
            onClick={onRestartTour}
            title="Показати інструкцію"
            aria-label="Показати інструкцію"
            className="flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Інструкція</span>
          </button>
        )}
      </div>
    </div>
  );
}
