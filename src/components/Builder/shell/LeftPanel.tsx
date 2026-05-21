// src/components/Builder/shell/LeftPanel.tsx
"use client";

import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Image as ImageIcon,
  Type,
  X,
} from "lucide-react";
import type { BuilderLayer } from "../ConstructorCanvas";

export interface LeftPanelProps {
  /** Layers as the canvas reports them (bottom-of-stack first). */
  layers: BuilderLayer[];
  /** Currently active object id, or null. */
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onBringForward: (id: string) => void;
  onSendBackwards: (id: string) => void;
  /** Renders a chevron at the top-right of the header. Click collapses
   *  the panel to a floating island button (parent handles state). */
  onCollapse?: () => void;
}

export default function LeftPanel({
  layers,
  selectedId,
  onSelect,
  onDelete,
  onBringForward,
  onSendBackwards,
  onCollapse,
}: LeftPanelProps) {
  // Display order: top-of-canvas = top-of-list (every design tool does this).
  // The canvas reports bottom→top, so we reverse here.
  const displayLayers = [...layers].reverse();

  return (
    <aside className="relative flex h-full min-h-0 w-full flex-col bg-white lg:border-r lg:border-stone-200">
      <div className="flex items-center gap-2 px-4 py-3 lg:border-b lg:border-stone-200">
        <h2 className="text-sm font-semibold text-stone-700">Шари</h2>
      </div>

      {/* Mid-edge collapse chevron. Sits centred vertically on the panel's
          right edge, half-overlapping the panel-canvas border. Click slides
          panel away. */}
      {onCollapse && (
        <button
          type="button"
          onClick={onCollapse}
          title="Згорнути"
          aria-label="Згорнути"
          className="absolute right-0 top-1/2 z-20 hidden h-7 w-7 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 shadow-sm transition hover:bg-stone-50 hover:text-stone-800 lg:flex"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}

      <div className="flex-1 overflow-y-auto p-2">
        {displayLayers.length === 0 ? (
          <p className="px-2 py-8 text-center text-xs leading-relaxed text-stone-400">
            Додайте об&apos;єкт за допомогою інструментів нижче
          </p>
        ) : (
          <ul className="space-y-1">
            {displayLayers.map((layer, displayIdx) => {
              const isSelected = layer.id === selectedId;
              const isTopOfDisplay = displayIdx === 0;
              const isBottomOfDisplay = displayIdx === displayLayers.length - 1;
              return (
                <li key={layer.id}>
                  <div
                    className={[
                      "group flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm transition-colors",
                      isSelected
                        ? "border-amber-500 bg-amber-50/60"
                        : "border-transparent hover:border-stone-200 hover:bg-stone-50",
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(layer.id)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <span
                        className={[
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded text-stone-500",
                          isSelected ? "bg-amber-100 text-amber-700" : "bg-stone-100",
                        ].join(" ")}
                      >
                        {layer.kind === "image" ? (
                          <ImageIcon className="h-3.5 w-3.5" />
                        ) : (
                          <Type className="h-3.5 w-3.5" />
                        )}
                      </span>
                      <span className="truncate text-stone-700">
                        {layer.name}
                      </span>
                    </button>

                    <div
                      className={[
                        "flex items-center gap-0.5",
                        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                      ].join(" ")}
                    >
                      <button
                        type="button"
                        onClick={() => onBringForward(layer.id)}
                        disabled={isTopOfDisplay}
                        aria-label="Вгору"
                        title="Підняти шар"
                        className="rounded p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-800 disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onSendBackwards(layer.id)}
                        disabled={isBottomOfDisplay}
                        aria-label="Вниз"
                        title="Опустити шар"
                        className="rounded p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-800 disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(layer.id)}
                        aria-label="Видалити"
                        title="Видалити"
                        className="rounded p-1 text-stone-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
