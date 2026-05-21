// src/components/Builder/shell/SettingsPopover.tsx
"use client";

import { Copy, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ShapeConfig, SafeZonePoint } from "@/types/builder";
import type {
  ControlSize,
  SafeZoneColor,
  SafeZoneStroke,
  ShadowMode,
} from "../ConstructorCanvas";

export interface SettingsPopoverProps {
  shapeConfig: ShapeConfig;
  // ---- Дизайн (visible to all users) ----
  controlSize: ControlSize;
  setControlSize: (next: ControlSize) => void;
  // ---- Підказки (visible to all users) ----
  showSafeZone: boolean;
  setShowSafeZone: (next: boolean) => void;
  safeZoneColor: SafeZoneColor;
  setSafeZoneColor: (next: SafeZoneColor) => void;
  safeZoneStroke: SafeZoneStroke;
  setSafeZoneStroke: (next: SafeZoneStroke) => void;
  shadowMode: ShadowMode;
  setShadowMode: (next: ShadowMode) => void;
  shadowIntensity: number;
  setShadowIntensity: (next: number) => void;
  showFront: boolean;
  setShowFront: (next: boolean) => void;
  /** Phase 25 Subtask 4: greeting-card fold-strip edges. Only renders
   *  meaningfully on the greeting card; on other shapes the toggle is
   *  hidden. */
  showFoldLines: boolean;
  setShowFoldLines: (next: boolean) => void;
  textureAvailable: boolean;
  showTexture: boolean;
  setShowTexture: (next: boolean) => void;
  textureScale: number;
  setTextureScale: (next: number) => void;
  textureOpacity: number;
  setTextureOpacity: (next: number) => void;
  // ---- Розробник (gated to NODE_ENV=development AND viewport ≥ 1024 px) ----
  devVisible: boolean;
  devEditingMode: boolean;
  setDevEditingMode: (next: boolean) => void;
  devGridStep: number;
  setDevGridStep: (next: number) => void;
  onResetView: () => void;
  /** Currently effective points for the active flavor (post-edit overrides). */
  devPoints: SafeZonePoint[];
  /** Active flavor id, surfaced in the dev header for context. */
  devFlavorId: string;
}

function formatPoints(points: SafeZonePoint[]): string {
  const parts = points.map((p) => `{x:${p.x.toFixed(4)},y:${p.y.toFixed(4)}}`);
  return `[${parts.join(",")}]`;
}

export default function SettingsPopover(props: SettingsPopoverProps) {
  const {
    shapeConfig,
    controlSize, setControlSize,
    showSafeZone, setShowSafeZone,
    safeZoneColor, setSafeZoneColor,
    safeZoneStroke, setSafeZoneStroke,
    shadowMode, setShadowMode,
    shadowIntensity, setShadowIntensity,
    showFront, setShowFront,
    showFoldLines, setShowFoldLines,
    textureAvailable,
    showTexture, setShowTexture,
    textureScale, setTextureScale,
    textureOpacity, setTextureOpacity,
    devVisible,
    devEditingMode, setDevEditingMode,
    devGridStep, setDevGridStep,
    onResetView,
    devPoints,
    devFlavorId,
  } = props;

  const isMini = shapeConfig.id === "mini";
  const isFreeShape = shapeConfig.mode === "free";

  async function handleCopyPoints() {
    const text = formatPoints(devPoints);
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied ${devPoints.length} points`);
    } catch {
      toast.error("Clipboard write failed");
    }
  }

  return (
    <div className="space-y-4">
      <section className="space-y-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Дизайн
        </h3>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-stone-700">Розмір контролів</span>
          <select
            value={controlSize}
            onChange={(e) => setControlSize(e.target.value as ControlSize)}
            aria-label="Розмір контролів"
            className="rounded border border-stone-300 bg-white px-1.5 py-0.5 text-xs focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600/30"
          >
            <option value="small">Малі</option>
            <option value="medium">Середні</option>
            <option value="large">Великі</option>
          </select>
        </div>
      </section>

      <section className="space-y-2.5 border-t border-stone-200 pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Підказки
        </h3>

        {isFreeShape && (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-stone-700">Безпечна зона</span>
              <div className="flex items-center gap-2">
                <select
                  value={safeZoneColor}
                  onChange={(e) =>
                    setSafeZoneColor(e.target.value as SafeZoneColor)
                  }
                  disabled={!showSafeZone}
                  aria-label="Колір безпечної зони"
                  className="rounded border border-stone-300 bg-white px-1.5 py-0.5 text-xs focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600/30 disabled:opacity-50"
                >
                  <option value="white">White</option>
                  <option value="green">Green</option>
                  <option value="cyan">Cyan</option>
                  <option value="magenta">Magenta</option>
                </select>
                <input
                  type="checkbox"
                  checked={showSafeZone}
                  onChange={(e) => setShowSafeZone(e.target.checked)}
                  aria-label="Показати безпечну зону"
                  className="h-4 w-4 cursor-pointer rounded border-stone-300 text-amber-600 focus:ring-amber-600"
                />
              </div>
            </div>
            {showSafeZone && (
              <div className="flex items-center justify-between gap-2 pl-3">
                <span className="text-xs text-stone-500">Стиль контуру</span>
                <select
                  value={safeZoneStroke}
                  onChange={(e) =>
                    setSafeZoneStroke(e.target.value as SafeZoneStroke)
                  }
                  aria-label="Стиль контуру"
                  className="rounded border border-stone-300 bg-white px-1.5 py-0.5 text-xs focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600/30"
                >
                  <option value="dashed">Пунктир</option>
                  <option value="solid">Суцільна</option>
                </select>
              </div>
            )}
          </>
        )}

        {isMini && (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-stone-700">Тіні</span>
              <select
                value={shadowMode}
                onChange={(e) => setShadowMode(e.target.value as ShadowMode)}
                aria-label="Напрям світла"
                className="rounded border border-stone-300 bg-white px-1.5 py-0.5 text-xs focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600/30"
              >
                <option value="off">Вимкнено</option>
                <option value="right">Світло справа</option>
                <option value="front">Світло спереду</option>
              </select>
            </div>
            {shadowMode !== "off" && (
              <PercentStepper
                label="Інтенсивність"
                value={shadowIntensity}
                onChange={setShadowIntensity}
                step={0.1}
                ariaLabel="Інтенсивність тіней"
              />
            )}
            <ToggleRow
              label="Передня грань"
              checked={showFront}
              onChange={setShowFront}
            />
          </>
        )}

        {shapeConfig.id === "greeting-card" && (
          <ToggleRow
            label="Лінії згину"
            checked={showFoldLines}
            onChange={setShowFoldLines}
          />
        )}

        {textureAvailable && isFreeShape && (
          <>
            <ToggleRow
              label="Текстура паперу"
              checked={showTexture}
              onChange={setShowTexture}
            />
            {showTexture && (
              <>
                <div className="flex items-center justify-between gap-2 pl-3">
                  <span className="text-xs text-stone-500">Розмір текстури</span>
                  <select
                    value={textureScale}
                    onChange={(e) => setTextureScale(Number(e.target.value))}
                    aria-label="Розмір текстури"
                    className="rounded border border-stone-300 bg-white px-1.5 py-0.5 text-xs focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600/30"
                  >
                    <option value="1">1×</option>
                    <option value="2">2×</option>
                    <option value="4">4×</option>
                    <option value="8">8×</option>
                  </select>
                </div>
                {/* Texture intensity is dev-only — see Phase 9 Subtask 3.
                    Customers don't get a knob; the dev/admin sets it
                    once and the demo ships with that value. */}
                {devVisible && (
                  <PercentStepper
                    label="Інтенсивність текстури"
                    value={textureOpacity / 100}
                    onChange={(next) => setTextureOpacity(next * 100)}
                    step={0.1}
                    ariaLabel="Інтенсивність текстури"
                  />
                )}
              </>
            )}
          </>
        )}
      </section>

      {devVisible && (
        <section className="space-y-2.5 border-t border-stone-200 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Розробник
            </h3>
            <code className="font-mono text-[10px] text-amber-800/80">
              {devFlavorId} · {devPoints.length}pt
            </code>
          </div>

          <ToggleRow
            label="Editing safe zone"
            checked={devEditingMode}
            onChange={setDevEditingMode}
          />

          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-stone-700">Grid</span>
            <select
              value={devGridStep}
              onChange={(e) => setDevGridStep(Number(e.target.value))}
              aria-label="Крок сітки"
              className="rounded border border-stone-300 bg-white px-1.5 py-0.5 text-xs focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600/30"
            >
              <option value="0">Off</option>
              <option value="1">1 px (snap only)</option>
              <option value="2">2 px (snap only)</option>
              <option value="4">4 px</option>
              <option value="8">8 px</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onResetView}
              className="flex-1 justify-center gap-2"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset view
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyPoints}
              className="flex-1 justify-center gap-2"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy points
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="text-sm text-stone-700">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 cursor-pointer rounded border-stone-300 text-amber-600 focus:ring-amber-600"
      />
    </label>
  );
}

// Phase 32 Subtask 7: compact 0..1 percent stepper. Replaces the
// `<input type="range">` slider — coarse stops (10% by default) are
// fine for shadow / texture intensity, and tap targets work better on
// phone than a 1-px sliding handle. Same control rendered on desktop +
// mobile for consistency; no responsive branch needed.
function PercentStepper({
  label,
  value,
  onChange,
  step = 0.1,
  ariaLabel,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  step?: number;
  ariaLabel?: string;
}) {
  const pct = Math.round(value * 100);
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  return (
    <div className="space-y-1 pl-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-stone-500">{label}</span>
        <span className="font-mono text-xs tabular-nums text-stone-600">
          {pct}%
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(clamp(value - step))}
          disabled={value <= 0.0001}
          aria-label={`${ariaLabel ?? label} — менше`}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-stone-300 bg-white text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-200">
          <div
            className="h-full bg-amber-500 transition-[width] duration-150"
            style={{ width: `${pct}%` }}
          />
        </div>
        <button
          type="button"
          onClick={() => onChange(clamp(value + step))}
          disabled={value >= 0.9999}
          aria-label={`${ariaLabel ?? label} — більше`}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-stone-300 bg-white text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}
