// src/components/Builder/shell/SetupConfigPanel.tsx
//
// Setup-stage right-side panel. Shows quantity stepper + price summary +
// "Створити дизайн" CTA. Replaces the per-stage block that previously
// lived in BottomBar.SetupStage. Visible only while stage === "setup";
// during design the regular RightPanel takes its place.

"use client";

import { useId } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import QtyStepper from "./QtyStepper";

// Phase 25 Subtask 1: minimum order is the lowest pricing tier (100).
const MIN_QTY = 100;
const MAX_QTY = 10000;

export interface SetupConfigPanelProps {
  quantity: number;
  onQuantityChange: (next: number) => void;
  unitPriceCurrent: number | null;
  totalPrice: number | null;
  /**
   * Phase 24 Subtask 7: transient { from, to } when the buyer just
   * crossed a tier boundary. Drives a struck-through old + pulsing new
   * display for ~2 s. Null = static price.
   */
  priceChange?: { from: number; to: number } | null;
  canvasReady: boolean;
  onAdvanceToDesign: () => void;
  /**
   * Phase 27: true when the buyer has already placed user objects in a
   * previous design pass and navigated back to setup. Flips the CTA
   * copy from "Створити дизайн" to "Редагувати дизайн". Submission
   * still goes through TopBar's Send button (gated on hasDesignContent
   * in BuilderShell).
   */
  hasDesignContent?: boolean;
  /**
   * Phase 32 Subtask 5: object URL for a thumbnail snapshot of the
   * buyer's current design. Rendered at the top of the panel when the
   * buyer returns to setup with placed content. BuilderShell captures
   * via `canvas.exportPreview()` on the design → setup transition.
   */
  designPreviewUrl?: string | null;
}

function formatUah(n: number): string {
  return `${Math.round(n).toLocaleString("uk-UA")} ₴`;
}

export default function SetupConfigPanel({
  quantity,
  onQuantityChange,
  unitPriceCurrent,
  totalPrice,
  priceChange,
  canvasReady,
  onAdvanceToDesign,
  hasDesignContent,
  designPreviewUrl,
}: SetupConfigPanelProps) {
  const qtyInputId = useId();
  const showPricing = unitPriceCurrent !== null && totalPrice !== null;

  return (
    <aside className="flex h-full min-h-0 w-full flex-col gap-4 border-l border-stone-200 bg-white p-4">
      <div className="border-b border-stone-200 pb-3">
        <h2 className="text-sm font-semibold text-stone-700">Конфігурація</h2>
      </div>

      {hasDesignContent && designPreviewUrl && (
        <div className="rounded-lg border border-stone-200 bg-white p-3">
          <p className="mb-2 text-xs text-stone-500">Ваш поточний дизайн</p>
          {/* Native <img> (not next/image) — the src is a same-origin
              blob: URL that next/image can't optimize. Aspect kept loose
              with object-contain so chocolates and greeting cards both
              fit without distortion. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={designPreviewUrl}
            alt="Поточний дизайн"
            className="aspect-[3/2] w-full rounded-md bg-stone-50 object-contain"
          />
          <button
            type="button"
            onClick={onAdvanceToDesign}
            disabled={!canvasReady}
            className="mt-2 block w-full text-center text-xs text-stone-700 underline-offset-2 hover:underline disabled:opacity-50"
          >
            Продовжити редагування →
          </button>
        </div>
      )}

      <div>
        <label
          htmlFor={qtyInputId}
          className="mb-1.5 block text-xs font-medium text-stone-500"
        >
          Кількість
        </label>
        <QtyStepper
          id={qtyInputId}
          value={quantity}
          onChange={onQuantityChange}
          min={MIN_QTY}
          max={MAX_QTY}
          dataTour="qty-stepper"
        />
      </div>

      {showPricing && (
        <div className="space-y-1 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-stone-500">За одиницю</span>
            <span className="flex items-center gap-1.5 tabular-nums">
              {priceChange && (
                <span className="text-stone-400 line-through">
                  {formatUah(priceChange.from)}
                </span>
              )}
              <span
                key={
                  priceChange
                    ? `${priceChange.from}->${priceChange.to}`
                    : "static"
                }
                className={[
                  "font-semibold text-stone-700",
                  priceChange ? "animate-price-pulse" : "",
                ].join(" ")}
              >
                {formatUah(unitPriceCurrent!)}
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-stone-200 pt-1">
            <span className="text-stone-500">Разом</span>
            <span className="font-semibold tabular-nums text-stone-900">
              {formatUah(totalPrice!)}
            </span>
          </div>
        </div>
      )}

      <Button
        data-tour="cta-create-design"
        onClick={onAdvanceToDesign}
        disabled={!canvasReady}
        className="mt-auto w-full justify-center gap-2 bg-stone-900 text-white hover:bg-stone-800"
      >
        {hasDesignContent ? "Редагувати дизайн" : "Створити дизайн"}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </aside>
  );
}
