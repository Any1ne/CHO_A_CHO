"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ChevronLeft, Undo2, Redo2, Send, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TopBarProps {
  shapeName: string;
  /** Active flavor name — appears in the catalog-style title alongside
   *  shape name. */
  flavorName: string;
  quantity: number;
  canSubmit: boolean;
  onSubmit: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDownload?: () => void;
  /** Show "← Смаки" in the left cluster. Only meaningful on the design
   *  stage, where the user might want to step back to flavor selection. */
  showBackToSetup?: boolean;
  onBackToSetup?: () => void;
  /**
   * Phase 31 Subtask 3: label for the back-to-setup button. Defaults
   * to "Смаки"; shapes with one flavor (greeting card) override with
   * "Товар" via `flavorPickerLabel` on the shape config.
   */
  backToSetupLabel?: string;
  /**
   * Phase 28: visibility gate for the right-side Download + Send cluster.
   * BuilderShell passes true on design stage AND on setup when there are
   * user objects to submit. When false the action cluster is omitted
   * entirely (not just disabled) so the TopBar reads as a clean
   * navigation surface during the initial setup-pick flow.
   */
  showActions?: boolean;
  /** Phone-only slot rendered at the top-left of the bar. Used to host
   *  the settings popover trigger (which on desktop lives at the top-left
   *  of the canvas instead). md:hidden is applied internally. */
  mobileLeftSlot?: ReactNode;
}

export default function TopBar({
  shapeName,
  flavorName,
  quantity,
  canSubmit,
  onSubmit,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onDownload,
  showBackToSetup,
  onBackToSetup,
  backToSetupLabel = "Смаки",
  showActions = true,
  mobileLeftSlot,
}: TopBarProps) {
  const submitTip = canSubmit ? "Надіслати запит" : "Спочатку створіть дизайн";
  const downloadTip = canSubmit
    ? "Завантажити макет (PNG)"
    : "Спочатку створіть дизайн";

  // Pulse the flavor name when it changes — supresses on first render
  // because prevFlavorRef is initialised to the current flavor.
  const prevFlavorRef = useRef(flavorName);
  const flavorChanged = prevFlavorRef.current !== flavorName;
  useEffect(() => {
    prevFlavorRef.current = flavorName;
  }, [flavorName]);

  // Phase 26 Subtask 2: title is positioned absolutely at TopBar centre
  // so left + right cluster widths don't shift it. The flex row carries
  // only the side clusters; the title sits in its own absolute-
  // positioned layer with `pointer-events-none` so the underlying
  // clusters still receive clicks if they happen to overlap visually
  // at narrow widths.
  return (
    <div className="relative flex min-h-[60px] shrink-0 items-center gap-3 border-b border-stone-200 bg-white px-4 py-3 sm:px-5 xl:min-h-[68px] 2xl:min-h-[76px]">
      {/* Phase 25 Subtask 7: /branded back link dropped — redundant with
          the breadcrumb above the builder shell (now visible on every
          viewport). TopBar's left cluster only carries the design-stage
          "Смаки" button + undo/redo. */}
      {mobileLeftSlot && (
        <div className="md:hidden">{mobileLeftSlot}</div>
      )}
      <div className="relative z-10 flex items-center gap-1">
        {showBackToSetup && onBackToSetup && (
          <button
            type="button"
            onClick={onBackToSetup}
            title={backToSetupLabel}
            aria-label={backToSetupLabel}
            className="mr-1 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100/60 hover:text-stone-900"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{backToSetupLabel}</span>
          </button>
        )}
        {/* Undo/redo are design-stage only — nothing to undo on setup.
            Re-uses the same gate as the back button (both tied to
            stage === "design"). */}
        {showBackToSetup && (
          <>
            <Button variant="outline" size="icon" onClick={onUndo} disabled={!canUndo} title="Скасувати">
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={onRedo} disabled={!canRedo} title="Повернути">
              <Redo2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Phase 26 Subtask 2: title overlay. `absolute left-1/2
          -translate-x-1/2` centres horizontally on the TopBar, not on
          the leftover flex space. `max-w-[60%]` keeps it from running
          into the side clusters on narrow viewports — at smaller
          widths the side icons can dip under the title (covered by
          pointer-events-none so they still receive clicks). Phase 25
          Subtask 8 conditional: if flavor name duplicates shape name,
          render only the shape name. */}
      {/* Phase 34: on phone the title stacks — shape name on line 1,
          flavor name on line 2 (no slash, the stack is unambiguous).
          sm+ collapses back to a single-line "shape / flavor" inline
          layout with the slash separator. Two-line max is naturally
          enforced because the title contains exactly two semantic
          spans; long words still wrap with break-words but the
          structure stays predictable. */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-2 text-center text-sm leading-tight text-stone-600 sm:text-base xl:text-lg 2xl:text-xl">
        <div className="max-w-[80vw] whitespace-normal break-words sm:max-w-[50vw]">
          {flavorName && flavorName !== shapeName ? (
            <>
              <span className="block text-stone-700 sm:inline">
                {shapeName}
              </span>
              <span className="mx-1 hidden text-stone-300 sm:inline">/</span>
              <span
                key={flavorName}
                className={[
                  "block font-semibold text-stone-900 sm:inline",
                  flavorChanged ? "animate-flavor-pulse" : "",
                ].join(" ")}
              >
                {flavorName}
              </span>
            </>
          ) : (
            <span className="font-semibold text-stone-900">{shapeName}</span>
          )}
          <span className="ml-2 hidden text-stone-400 sm:inline">
            ×&nbsp;{quantity}
          </span>
        </div>
      </div>

      {/* Spacer flex-grow pushes side clusters to the edges; the title
          overlay sits centred above without affecting the flex math. */}
      <div className="flex-1" />

      {/* Phase 30 Subtask 5: TopBar price block dropped. Price now
          lives on the SetupConfigPanel (setup stage) and the floating
          canvas chip rendered by BuilderShell (design stage). Keeps
          the TopBar focused on navigation + primary submission CTA. */}

      {/* Phase 15 Subtask 7 / Phase 28: action buttons share a fixed-
          width cluster on lg+ that matches the right-panel column
          (320 px) so the two buttons line up with the property controls
          below. Visibility-gated on `showActions` so the setup stage
          reads as a navigation surface until the buyer has design
          content to submit. */}
      {showActions && (
        <div className="relative z-10 flex shrink-0 items-center gap-2 lg:w-[320px] xl:w-[360px] 2xl:w-[400px]">
          {onDownload && (
            <Button
              variant="outline"
              onClick={onDownload}
              disabled={!canSubmit}
              title={downloadTip}
              className="gap-2 lg:flex-1 lg:justify-center xl:h-10 xl:text-base 2xl:h-12 2xl:text-lg"
            >
              <Download className="h-4 w-4 xl:h-5 xl:w-5 2xl:h-6 2xl:w-6" />
              <span className="hidden lg:inline">Завантажити</span>
            </Button>
          )}

          <Button
            data-tour="topbar-submit"
            onClick={onSubmit}
            disabled={!canSubmit}
            title={submitTip}
            className="gap-2 bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50 lg:flex-1 lg:justify-center xl:h-10 xl:text-base 2xl:h-12 2xl:text-lg"
          >
            <Send className="h-4 w-4 xl:h-5 xl:w-5 2xl:h-6 2xl:w-6" />
            <span className="hidden sm:inline">Надіслати запит</span>
          </Button>
        </div>
      )}
    </div>
  );
}
