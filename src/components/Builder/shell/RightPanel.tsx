// src/components/Builder/shell/RightPanel.tsx
//
// Contextual properties panel — right column of the BuilderShell. Mirrors a
// stripped-down Figma "Design" tab. Strict feature scope:
//   • Text:  POSITION (align grid), TYPOGRAPHY (text-align + fill), STROKE
//            (color + width), APPEARANCE (opacity).
//   • Image: POSITION (align grid), LAYOUT (rotation), APPEARANCE (opacity).
//
// Numeric inputs are typed boxes (NumberBox) — slimmed to Figma density.
// Color inputs use ColorRow: swatch opens native picker, hex field accepts
// `RRGGBB` or `#RRGGBB`, alpha lives next to it as a 0–100 % NumberBox and
// is folded into rgba() when the value travels to fabric.
//
// Layer ordering (bring-forward / send-backwards) lives in LeftPanel.

"use client";

import {
  AlignCenter,
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignLeft,
  AlignRight,
  AlignStartHorizontal,
  AlignStartVertical,
  Bold,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Italic,
  MousePointerSquareDashed,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type {
  ActiveImageProps,
  ActiveObjectInfo,
  ActiveTextProps,
} from "../ConstructorCanvas";
import { ColorRow } from "./ColorRow";
import { BUILDER_FONTS } from "../fonts";

const STROKE_DEFAULT_COLOR = "#000000";
const FILL_DEFAULT_COLOR = "#1a1a1a";

export type AlignAxis = "horizontal" | "vertical";
export type AlignMode = "start" | "center" | "end";

export interface RightPanelProps {
  active: ActiveObjectInfo | null;
  onUpdateText?: (patch: Partial<ActiveTextProps>) => void;
  onUpdateImage?: (patch: Partial<ActiveImageProps>) => void;
  onAlign?: (axis: AlignAxis, mode: AlignMode) => void;
  /** Renders a Figma-style chevron at the top-left corner of the panel
   *  header. Click collapses the panel to its floating island button
   *  (handled by the parent). */
  onCollapse?: () => void;
}

export default function RightPanel({
  active,
  onUpdateText,
  onUpdateImage,
  onAlign,
  onCollapse,
}: RightPanelProps) {
  if (!active) {
    return (
      <Frame heading="Властивості" onCollapse={onCollapse}>
        <EmptyState
          icon={<MousePointerSquareDashed className="h-5 w-5" />}
          text="Виберіть обʼєкт на полотні, щоб редагувати його."
        />
      </Frame>
    );
  }

  if (active.kind === "text") {
    const strokeApplied = (active.text?.strokeWidth ?? 0) > 0;
    return (
      <Frame heading="Текст" onCollapse={onCollapse}>
        <CollapsibleSection label="Позиція">
          <PositionAlignGrid onAlign={onAlign} />
        </CollapsibleSection>
        <CollapsibleSection label="Типографія">
          <TypographySection
            props={active.text}
            onChange={(patch) => onUpdateText?.(patch)}
          />
        </CollapsibleSection>
        <OptionalEffectSection
          label="Обведення"
          applied={strokeApplied}
          onAdd={() =>
            onUpdateText?.({
              // Default stroke: black, width 1, full alpha. Mirrors the
              // Figma "Add Stroke" affordance.
              strokeWidth: 1,
              stroke: "#000000",
            })
          }
          onRemove={() =>
            onUpdateText?.({ strokeWidth: 0, stroke: null })
          }
        >
          <StrokeSection
            props={active.text}
            onChange={(patch) => onUpdateText?.(patch)}
          />
        </OptionalEffectSection>
        {/* No standalone Appearance section for text. ColorRow alpha on
            the Fill (and Stroke) is the user-facing opacity. fabric
            `obj.opacity` stays at 1 — separating object opacity from fill
            alpha just confused users. */}
      </Frame>
    );
  }

  return (
    <Frame heading="Зображення" onCollapse={onCollapse}>
      <CollapsibleSection label="Позиція">
        <PositionAlignGrid onAlign={onAlign} />
      </CollapsibleSection>
      <CollapsibleSection label="Розмір та поворот">
        <RotationSection
          props={active.image}
          onChange={(patch) => onUpdateImage?.(patch)}
        />
      </CollapsibleSection>
      <CollapsibleSection label="Вигляд">
        <AppearanceSection
          opacity={active.image?.opacity ?? 1}
          onOpacityChange={(v) => onUpdateImage?.({ opacity: v })}
        />
      </CollapsibleSection>
    </Frame>
  );
}

/* -------------------------------------------------------------------- */
/* Section: positional alignment grid                                   */
/* -------------------------------------------------------------------- */

function PositionAlignGrid({
  onAlign,
}: {
  onAlign?: (axis: AlignAxis, mode: AlignMode) => void;
}) {
  const fire = (axis: AlignAxis, mode: AlignMode) => onAlign?.(axis, mode);
  return (
    <div className="grid grid-cols-3 gap-1">
      <AlignGridButton
        label="Зверху"
        onClick={() => fire("vertical", "start")}
      >
        <AlignStartHorizontal className="h-4 w-4" />
      </AlignGridButton>
      <AlignGridButton
        label="По центру (вертикально)"
        onClick={() => fire("vertical", "center")}
      >
        <AlignCenterHorizontal className="h-4 w-4" />
      </AlignGridButton>
      <AlignGridButton
        label="Знизу"
        onClick={() => fire("vertical", "end")}
      >
        <AlignEndHorizontal className="h-4 w-4" />
      </AlignGridButton>
      <AlignGridButton
        label="Зліва"
        onClick={() => fire("horizontal", "start")}
      >
        <AlignStartVertical className="h-4 w-4" />
      </AlignGridButton>
      <AlignGridButton
        label="По центру (горизонтально)"
        onClick={() => fire("horizontal", "center")}
      >
        <AlignCenterVertical className="h-4 w-4" />
      </AlignGridButton>
      <AlignGridButton
        label="Зправа"
        onClick={() => fire("horizontal", "end")}
      >
        <AlignEndVertical className="h-4 w-4" />
      </AlignGridButton>
    </div>
  );
}

/* -------------------------------------------------------------------- */
/* Section: typography (text-align + fill color)                        */
/* -------------------------------------------------------------------- */

function TypographySection({
  props,
  onChange,
}: {
  props: ActiveTextProps | undefined;
  onChange: (patch: Partial<ActiveTextProps>) => void;
}) {
  const textAlign = props?.textAlign ?? "left";
  const fill = props?.fill ?? FILL_DEFAULT_COLOR;
  const fontFamily = props?.fontFamily ?? BUILDER_FONTS[0].family;
  const fontWeight = props?.fontWeight ?? "normal";
  const fontStyle = props?.fontStyle ?? "normal";
  const fontSize = props?.fontSize ?? 32;
  const isBold =
    fontWeight === "bold" ||
    fontWeight === 700 ||
    (typeof fontWeight === "number" && fontWeight >= 600);
  const isItalic = fontStyle === "italic";

  return (
    <div className="space-y-3">
      {/* Шрифт subgroup: family dropdown + bold/italic toggles + font size. */}
      <div className="space-y-2">
        <SubgroupLabel>Шрифт</SubgroupLabel>
        <select
          value={fontFamily}
          onChange={(e) => onChange({ fontFamily: e.target.value })}
          aria-label="Шрифт"
          className="h-8 w-full rounded-md border border-stone-300 bg-white px-2 text-xs text-stone-900 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500/30"
        >
          {BUILDER_FONTS.map((f) => (
            <option
              key={f.id}
              value={f.family}
              style={{ fontFamily: f.family }}
            >
              {f.label}
            </option>
          ))}
        </select>

        {/* Bold + Italic + font-size in one row */}
        <div className="flex items-center gap-2">
          <ToggleButton
            active={isBold}
            onClick={() =>
              onChange({ fontWeight: isBold ? "normal" : "bold" })
            }
            label="Жирний"
          >
            <Bold className="h-4 w-4" />
          </ToggleButton>
          <ToggleButton
            active={isItalic}
            onClick={() =>
              onChange({ fontStyle: isItalic ? "normal" : "italic" })
            }
            label="Курсив"
          >
            <Italic className="h-4 w-4" />
          </ToggleButton>
          <div className="ml-auto w-16 shrink-0">
            <NumberBox
              min={8}
              max={200}
              step={1}
              value={Math.round(fontSize)}
              suffix="px"
              ariaLabel="Розмір шрифту"
              onChange={(v) => onChange({ fontSize: clamp(v, 8, 200) })}
            />
          </div>
        </div>

        <LabeledRow label="Висота рядка">
          <div className="w-16 shrink-0">
            <LineHeightInput
              value={props?.lineHeight ?? 1.16}
              onChange={(v) => onChange({ lineHeight: v })}
            />
          </div>
        </LabeledRow>

        <LabeledRow label="Інтервал">
          <div className="w-16 shrink-0">
            <NumberBox
              min={-200}
              max={1000}
              step={1}
              value={props?.charSpacing ?? 0}
              ariaLabel="Міжсимвольний інтервал"
              onChange={(v) => onChange({ charSpacing: clamp(v, -200, 1000) })}
            />
          </div>
        </LabeledRow>
      </div>

      {/* Вирівнювання subgroup: text-align toggles. */}
      <div className="space-y-2">
        <SubgroupLabel>Вирівнювання</SubgroupLabel>
        <div className="flex gap-1">
          <ToggleButton
            active={textAlign === "left"}
            onClick={() => onChange({ textAlign: "left" })}
            label="Зліва"
          >
            <AlignLeft className="h-4 w-4" />
          </ToggleButton>
          <ToggleButton
            active={textAlign === "center"}
            onClick={() => onChange({ textAlign: "center" })}
            label="По центру"
          >
            <AlignCenter className="h-4 w-4" />
          </ToggleButton>
          <ToggleButton
            active={textAlign === "right"}
            onClick={() => onChange({ textAlign: "right" })}
            label="Зправа"
          >
            <AlignRight className="h-4 w-4" />
          </ToggleButton>
        </div>
      </div>

      {/* Заповнення subgroup: fill color + alpha. */}
      <div className="space-y-2">
        <SubgroupLabel>Заповнення</SubgroupLabel>
        <ColorRow
          value={fill}
          fallbackHex={FILL_DEFAULT_COLOR}
          onChange={(next) => onChange({ fill: next })}
        />
      </div>
    </div>
  );
}

function SubgroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[10px] font-medium uppercase tracking-wide text-stone-400">
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------- */
/* Section: stroke (color + width)                                      */
/* -------------------------------------------------------------------- */

function StrokeSection({
  props,
  onChange,
}: {
  props: ActiveTextProps | undefined;
  onChange: (patch: Partial<ActiveTextProps>) => void;
}) {
  const strokeWidth = props?.strokeWidth ?? 0;
  const stroke = props?.stroke ?? null;
  return (
    <div className="space-y-2">
      <ColorRow
        value={stroke}
        fallbackHex={STROKE_DEFAULT_COLOR}
        onChange={(next) => onChange({ stroke: next })}
      />
      <LabeledRow label="Товщина">
        <div className="w-16 shrink-0">
          <NumberBox
            min={0}
            max={20}
            step={1}
            value={strokeWidth}
            suffix="px"
            onChange={(v) => {
              const next = clamp(v, 0, 20);
              onChange({
                strokeWidth: next,
                // First time the user pulls width above 0 with no color
                // chosen yet, seed black so the stroke shows up.
                stroke:
                  next > 0 && stroke == null ? STROKE_DEFAULT_COLOR : stroke,
              });
            }}
          />
        </div>
      </LabeledRow>
    </div>
  );
}

/* -------------------------------------------------------------------- */
/* Section: rotation (image)                                            */
/* -------------------------------------------------------------------- */

function RotationSection({
  props,
  onChange,
}: {
  props: ActiveImageProps | undefined;
  onChange: (patch: Partial<ActiveImageProps>) => void;
}) {
  const angle = props?.angle ?? 0;
  return (
    <LabeledRow label="Поворот">
      <div className="w-16 shrink-0">
        <NumberBox
          min={0}
          max={359}
          step={1}
          value={Math.round(angle)}
          suffix="°"
          onChange={(v) => onChange({ angle: clamp(v, 0, 359) })}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        title="Скинути"
        onClick={() => onChange({ angle: 0 })}
        disabled={angle === 0}
        className="h-8 w-8 shrink-0"
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </Button>
    </LabeledRow>
  );
}

/* -------------------------------------------------------------------- */
/* Section: appearance (opacity, shared by text + image)                */
/* -------------------------------------------------------------------- */

function AppearanceSection({
  opacity,
  onOpacityChange,
}: {
  opacity: number;
  onOpacityChange: (next: number) => void;
}) {
  return (
    <LabeledRow label="Прозорість обʼєкта">
      <div className="w-16 shrink-0">
        <NumberBox
          min={0}
          max={100}
          step={1}
          value={Math.round(opacity * 100)}
          suffix="%"
          ariaLabel="Прозорість обʼєкта"
          onChange={(v) => onOpacityChange(clamp(v, 0, 100) / 100)}
        />
      </div>
    </LabeledRow>
  );
}

/* -------------------------------------------------------------------- */
/* Building blocks                                                      */
/* -------------------------------------------------------------------- */

function Frame({
  heading,
  children,
  onCollapse,
}: {
  heading: string;
  children: React.ReactNode;
  onCollapse?: () => void;
}) {
  return (
    <aside className="relative flex h-full min-h-0 w-full flex-col bg-white lg:border-l lg:border-stone-200">
      <div className="flex items-center gap-2 px-4 py-3 lg:border-b lg:border-stone-200">
        <h2 className="text-sm font-semibold text-stone-700">{heading}</h2>
      </div>

      {/* Mid-edge collapse chevron. Sits centred vertically on the panel's
          left edge, half-overlapping the panel-canvas border. */}
      {onCollapse && (
        <button
          type="button"
          onClick={onCollapse}
          title="Згорнути"
          aria-label="Згорнути"
          className="absolute left-0 top-1/2 z-20 hidden h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 shadow-sm transition hover:bg-stone-50 hover:text-stone-800 lg:flex"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      )}

      <div className="flex-1 overflow-y-auto lg:divide-y lg:divide-stone-200">
        {children}
      </div>
    </aside>
  );
}

/**
 * Always-applied section. Header shows label + chevron toggle. Open by
 * default, state is component-local (no persistence — new selection
 * resets to open). Used for Position / Typography / Layout / Appearance.
 */
function CollapsibleSection({
  label,
  children,
  defaultOpen = true,
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="px-4 py-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mb-2 flex w-full items-center justify-between text-stone-500 hover:text-stone-700"
        aria-expanded={open}
      >
        <span className="text-xs uppercase tracking-wide">{label}</span>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </button>
      {open && children}
    </section>
  );
}

/**
 * Optional-effect section (Figma "+ Add Stroke" pattern). When `applied`
 * is false, only the label + "+" button render — children are hidden.
 * Click "+" calls `onAdd` (which should set the default state and bring
 * `applied` to true). When `applied` is true, the body is shown with an
 * "✕" header button that calls `onRemove` to disable the effect.
 *
 * Future-proofing: same pattern should work for Shadow / Blur / etc. —
 * each one a flag on the active object.
 */
function OptionalEffectSection({
  label,
  applied,
  onAdd,
  onRemove,
  children,
}: {
  label: string;
  applied: boolean;
  onAdd: () => void;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  if (!applied) {
    return (
      <section className="px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-stone-500">
            {label}
          </span>
          <button
            type="button"
            onClick={onAdd}
            title={`Додати: ${label}`}
            aria-label={`Додати: ${label}`}
            className="flex h-6 w-6 items-center justify-center rounded border border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>
    );
  }
  return (
    <section className="px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-stone-500">
          {label}
        </span>
        <button
          type="button"
          onClick={onRemove}
          title={`Видалити: ${label}`}
          aria-label={`Видалити: ${label}`}
          className="flex h-6 w-6 items-center justify-center rounded text-stone-400 hover:bg-stone-100 hover:text-stone-700"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {children}
    </section>
  );
}

function EmptyState({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex h-full min-h-[140px] flex-col items-center justify-center gap-2 px-4 text-center text-stone-400">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-500">
        {icon}
      </span>
      <p className="text-xs leading-snug">{text}</p>
    </div>
  );
}

function LabeledRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="flex-1 text-xs text-stone-600">{label}</label>
      <div className="flex items-center gap-1">{children}</div>
    </div>
  );
}

interface ToggleButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}

function ToggleButton({ active, onClick, label, children }: ToggleButtonProps) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size="icon"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className="h-8 w-8"
    >
      {children}
    </Button>
  );
}

interface AlignGridButtonProps {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}

function AlignGridButton({ label, onClick, children }: AlignGridButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-8 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-600 transition-colors hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900"
    >
      {children}
    </button>
  );
}

/**
 * Specialised NumberBox for line-height. Empty input commits to fabric's
 * default (1.16) and displays "auto" until the user types a value. Steps
 * in 0.1 increments. Range broad: 0.5..3 covers reasonable typography.
 */
function LineHeightInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const FABRIC_DEFAULT = 1.16;
  const isAuto = Math.abs(value - FABRIC_DEFAULT) < 0.001;
  const [draft, setDraft] = useState(isAuto ? "" : value.toFixed(2));
  const lastRef = useRef<number>(value);
  useEffect(() => {
    if (Math.abs(value - lastRef.current) < 0.001) return;
    lastRef.current = value;
    setDraft(
      Math.abs(value - FABRIC_DEFAULT) < 0.001 ? "" : value.toFixed(2)
    );
  }, [value]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed === "") {
      lastRef.current = FABRIC_DEFAULT;
      onChange(FABRIC_DEFAULT);
      setDraft("");
      return;
    }
    const parsed = Number.parseFloat(trimmed);
    if (!Number.isFinite(parsed)) {
      setDraft(
        Math.abs(lastRef.current - FABRIC_DEFAULT) < 0.001
          ? ""
          : lastRef.current.toFixed(2)
      );
      return;
    }
    const clamped = Math.max(0.5, Math.min(3, parsed));
    lastRef.current = clamped;
    onChange(clamped);
    setDraft(clamped.toFixed(2));
  }

  return (
    <div className="flex h-8 w-full items-center rounded-md border border-stone-300 bg-white px-2 focus-within:border-stone-500 focus-within:ring-1 focus-within:ring-stone-500/30">
      <input
        type="text"
        inputMode="decimal"
        value={draft}
        placeholder="auto"
        aria-label="Висота рядка"
        title="Висота рядка"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          } else if (e.key === "Escape") {
            setDraft(
              Math.abs(lastRef.current - FABRIC_DEFAULT) < 0.001
                ? ""
                : lastRef.current.toFixed(2)
            );
            e.currentTarget.blur();
          }
        }}
        className="h-full min-w-0 flex-1 bg-transparent text-right text-xs tabular-nums text-stone-900 placeholder:text-stone-400 focus:outline-none"
      />
    </div>
  );
}

interface NumberBoxProps {
  min: number;
  max: number;
  step: number;
  value: number;
  suffix?: string;
  disabled?: boolean;
  /** Accessible name + tooltip; rendered as `aria-label` and `title`. */
  ariaLabel?: string;
  onChange: (v: number) => void;
}

function NumberBox({
  min,
  max,
  step,
  value,
  suffix,
  disabled,
  ariaLabel,
  onChange,
}: NumberBoxProps) {
  // Local draft string lets the user temporarily clear the field or hold a
  // partial value mid-edit (e.g. "" or "1" while typing "12") without us
  // pushing nonsense into the canvas. Commit happens on blur or Enter.
  const [draft, setDraft] = useState<string>(String(value));
  // Track the last-known-good numeric value so a blur from an invalid /
  // empty draft can revert visually without a redundant onChange.
  const lastAppliedRef = useRef<number>(value);

  // Resync when the external value changes (undo, sibling control, programmatic
  // reset). Only triggers when value actually differs to avoid clobbering an
  // in-progress draft after our own commit.
  useEffect(() => {
    if (value !== lastAppliedRef.current) {
      lastAppliedRef.current = value;
      setDraft(String(value));
    }
  }, [value]);

  function clampVal(n: number) {
    return Math.max(min, Math.min(max, n));
  }

  function commit() {
    const parsed = Number.parseFloat(draft);
    if (!Number.isFinite(parsed)) {
      // Empty / NaN — revert visually, no canvas mutation.
      setDraft(String(lastAppliedRef.current));
      return;
    }
    const clamped = clampVal(parsed);
    setDraft(String(clamped));
    if (clamped !== lastAppliedRef.current) {
      lastAppliedRef.current = clamped;
      onChange(clamped);
    }
  }

  function nudge(direction: 1 | -1) {
    const cur = Number.parseFloat(draft);
    const base = Number.isFinite(cur) ? cur : lastAppliedRef.current;
    const next = clampVal(base + direction * step);
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
        min={min}
        max={max}
        step={step}
        value={draft}
        disabled={disabled}
        aria-label={ariaLabel}
        title={ariaLabel}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          } else if (e.key === "Escape") {
            setDraft(String(lastAppliedRef.current));
            e.currentTarget.blur();
          } else if (e.key === "ArrowUp") {
            // Take over the spinner so we apply through commit semantics
            // (always a valid clamped number) instead of letting the native
            // input nudge the draft into a state we'd then have to validate.
            e.preventDefault();
            nudge(1);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            nudge(-1);
          }
        }}
        onWheel={(e) => {
          // Only react when the input is focused so casual page-scroll over
          // an unfocused input doesn't silently mutate values.
          if (document.activeElement !== e.currentTarget) return;
          e.preventDefault();
          nudge(e.deltaY < 0 ? 1 : -1);
        }}
        className="h-full min-w-0 flex-1 bg-transparent text-right text-xs tabular-nums text-stone-900 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      {suffix && (
        <span className="ml-0.5 select-none text-[10px] text-stone-400">
          {suffix}
        </span>
      )}
    </div>
  );
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
