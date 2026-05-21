// src/components/Builder/shell/BottomBar.tsx
"use client";

import { useId } from "react";
import { ArrowRight, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import FlavorPicker from "../FlavorPicker";
import type { FlavorConfig, ShapeConfig } from "@/types/builder";

export type BuilderStage = "setup" | "design";

export interface BottomBarProps {
  stage: BuilderStage;
  shapeConfig: ShapeConfig;
  activeFlavor: FlavorConfig;
  onFlavorSelect: (flavor: FlavorConfig) => void;
  quantity: number;
  onQuantityChange: (next: number) => void;
  unitPriceCurrent: number | null;
  totalPrice: number | null;
  canvasReady: boolean;
  onAdvanceToDesign: () => void;
  onBackToSetup: () => void;
}

const MIN_QTY = 1;
const MAX_QTY = 10000;

function formatUah(n: number): string {
  return `${Math.round(n).toLocaleString("uk-UA")} ₴`;
}

export default function BottomBar(props: BottomBarProps) {
  return (
    <div className="border-t border-stone-200 bg-white">
      {props.stage === "setup" ? <SetupStage {...props} /> : <DesignStage {...props} />}
    </div>
  );
}

function SetupStage({
  shapeConfig,
  activeFlavor,
  onFlavorSelect,
  quantity,
  onQuantityChange,
  unitPriceCurrent,
  totalPrice,
  canvasReady,
  onAdvanceToDesign,
}: BottomBarProps) {
  const qtyInputId = useId();
  const showPricing = unitPriceCurrent !== null && totalPrice !== null;

  return (
    <div className="grid gap-4 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-6">
      {/* Flavor picker — left side; takes whatever space remains */}
      <div className="min-w-0">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-stone-700">
            {shapeConfig.mode === "template" ? "Виберіть шаблон" : "Виберіть смак"}
          </h3>
          <span className="text-xs text-stone-400">
            {shapeConfig.flavors.length}{" "}
            {shapeConfig.mode === "template" ? "шаблонів" : "смаків"}
          </span>
        </div>
        <FlavorPicker
          flavors={shapeConfig.flavors}
          activeFlavor={activeFlavor}
          onSelect={onFlavorSelect}
        />
      </div>

      {/* Quantity + advance — right side; fixed width on desktop */}
      <div className="flex flex-col gap-3 lg:w-72">
        <div>
          <label
            htmlFor={qtyInputId}
            className="mb-1.5 block text-xs font-medium text-stone-500"
          >
            Кількість
          </label>
          <QuantityStepper
            id={qtyInputId}
            value={quantity}
            onChange={onQuantityChange}
          />
        </div>

        {showPricing && (
          <div className="flex items-center justify-between rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-xs">
            <span className="text-stone-500">
              За одиницю:{" "}
              <span className="font-semibold tabular-nums text-stone-700">
                {formatUah(unitPriceCurrent!)}
              </span>
            </span>
            <span className="text-stone-500">
              Разом:{" "}
              <span className="font-semibold tabular-nums text-stone-700">
                {formatUah(totalPrice!)}
              </span>
            </span>
          </div>
        )}

        <Button
          onClick={onAdvanceToDesign}
          disabled={!canvasReady}
          className="w-full justify-center gap-2 bg-stone-900 text-white hover:bg-stone-800"
        >
          Створити дизайн
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function DesignStage(_props: BottomBarProps) {
  // Back-to-Смаки lives in TopBar's left cluster only. Free-mode +
  // template-mode action buttons (upload / text / background) live as
  // floating round buttons over the canvas. The previous template-mode
  // "Заповнення шаблону — скоро" placeholder was dropped in Phase 20
  // — greeting card now renders directly without slot scaffolding.
  void _props;
  return null;
}

interface QuantityStepperProps {
  id: string;
  value: number;
  onChange: (next: number) => void;
}

function QuantityStepper({ id, value, onChange }: QuantityStepperProps) {
  const clamp = (n: number) => Math.max(MIN_QTY, Math.min(MAX_QTY, Math.round(n)));
  return (
    <div className="flex items-stretch overflow-hidden rounded-md border border-stone-300">
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= MIN_QTY}
        aria-label="Зменшити кількість"
        className="flex w-10 items-center justify-center text-stone-600 hover:bg-stone-100 disabled:opacity-30"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={MIN_QTY}
        max={MAX_QTY}
        value={value}
        onChange={(e) => {
          const parsed = Number.parseInt(e.target.value, 10);
          if (Number.isFinite(parsed)) onChange(clamp(parsed));
        }}
        className="flex-1 border-x border-stone-300 px-2 py-1.5 text-center text-sm tabular-nums focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600/30"
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= MAX_QTY}
        aria-label="Збільшити кількість"
        className="flex w-10 items-center justify-center text-stone-600 hover:bg-stone-100 disabled:opacity-30"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

