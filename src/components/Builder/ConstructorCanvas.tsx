// src/components/Builder/ConstructorCanvas.tsx
"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { fabric } from "fabric";
import type {
  ShapeConfig,
  FlavorConfig,
  MaterialType,
  SafeZone,
  SafeZonePoint,
} from "@/types/builder";
import { getBrandingZone } from "@/lib/builder/zones";
import {
  type SubmissionDesignElement,
  colorToHexAlpha,
} from "@/lib/builder/designElements";
import { ZOOM_MIN, ZOOM_MAX } from "./shell/ZoomControl";

/**
 * Properties exposed for the parent's text-toolbar. Updated whenever the
 * active selection changes to an IText (null otherwise).
 *
 * `fontFamily` / `fontSize` / `fill` are required because every IText we
 * create has explicit values for them. The remaining fields default to
 * Fabric's defaults (textAlign:"left", opacity:1, stroke:null, strokeWidth:1)
 * and are surfaced as optional so the right-panel can render them without
 * tripping on undefined.
 */
export interface ActiveTextProps {
  fontFamily: string;
  fontSize: number;
  fill: string;
  textAlign?: "left" | "center" | "right";
  opacity?: number;
  /** null = no stroke. Stored as null on the object when strokeWidth is 0. */
  stroke?: string | null;
  strokeWidth?: number;
  /** "normal" | "bold" — fabric also accepts numeric weights but the
   *  builder UI is a single bold-toggle. Default "normal". */
  fontWeight?: string | number;
  /** "normal" | "italic". Default "normal". */
  fontStyle?: string;
  /** Line-height multiplier (fabric default 1.16). */
  lineHeight?: number;
  /** Inter-character spacing in fabric units (1/1000 em). 0 = default. */
  charSpacing?: number;
}

/**
 * Properties exposed for the right-panel when an image is selected. The
 * panel surfaces opacity + native rotation (angle in degrees, 0–360).
 */
export interface ActiveImageProps {
  opacity: number;
  angle: number;
}

/** Kind of user object the buyer placed on the canvas. */
export type BuilderObjectKind = "text" | "image";

/**
 * One row in the layers list. Names are derived from the object: text →
 * first 20 chars of `text`; image → filename portion of the source URL.
 */
export interface BuilderLayer {
  id: string;
  kind: BuilderObjectKind;
  name: string;
}

/**
 * Active-object info emitted to the parent on selection change. Includes
 * the kind and a stable id so the right-hand properties panel can render
 * the appropriate sub-shell. For text objects, current text-style props
 * are included so the props shell can show them without a second lookup.
 */
export interface ActiveObjectInfo {
  id: string;
  kind: BuilderObjectKind;
  /** Populated when kind === "text". */
  text?: ActiveTextProps;
  /** Populated when kind === "image". */
  image?: ActiveImageProps;
}

/**
 * Safe-zone polygon visualization presets. White is the default and matches
 * the metaphor of a paper sticker; the other three are tinted and translucent
 * — useful when the underlying chocolate photo is also light, or for QA
 * sessions where high contrast helps spot misaligned points.
 */
export const SAFE_ZONE_COLOR_PRESETS = {
  // Default low-opacity white reads as a neutral "this is the wrap" hint
  // without muddying the chocolate photo. Green/cyan/magenta remain as
  // dev/QA contrast options.
  white:   { fill: "rgba(255,255,255,0.40)", stroke: "rgba(70,40,20,0.55)"  },
  green:   { fill: "rgba(40,180,100,0.30)",  stroke: "rgba(20,90,50,0.70)"  },
  cyan:    { fill: "rgba(40,180,200,0.30)",  stroke: "rgba(20,90,100,0.70)" },
  magenta: { fill: "rgba(220,80,180,0.30)",  stroke: "rgba(110,40,90,0.70)" },
} as const;

export type SafeZoneColor = keyof typeof SAFE_ZONE_COLOR_PRESETS;

/** Safe-zone polygon outline style: dashed (default, designer-guide feel) or solid. */
export type SafeZoneStroke = "dashed" | "solid";

/**
 * Selection-control size preset for user-added objects (logos, text).
 * Configurable so buyers on small touch screens can opt up to bigger handles
 * if "small" is too fiddly. Default "small" (10/24 px) mirrors what every
 * mature design tool ships and keeps the canvas visually calm.
 */
export type ControlSize = "small" | "medium" | "large";

/**
 * Resolved corner geometry per ControlSize tier. cornerSize is what fabric
 * paints; touchCornerSize is the invisible hit area used on touch devices.
 */
const CONTROL_SIZE_PRESETS: Record<
  ControlSize,
  { cornerSize: number; touchCornerSize: number; closeRadius: number }
> = {
  small:  { cornerSize: 8,  touchCornerSize: 20, closeRadius: 6 },
  medium: { cornerSize: 13, touchCornerSize: 28, closeRadius: 9 },
  large:  { cornerSize: 18, touchCornerSize: 32, closeRadius: 12 },
};

/**
 * Light-direction presets for the chocolate's 3D faces. These render
 * translucent dark fills on certain faces so the overall image reads as
 * lit-from-X — purely visual, no effect on positioning or the printable area.
 *   off   — no shadow overlays
 *   right — light source on the right; left side darkest, front mid, right unlit
 *   front — light source straight on; both sides equally shadowed, front unlit
 */
export type ShadowMode = "off" | "right" | "front";

/**
 * Imperative API the parent uses to push commands into the canvas.
 *
 * Why an imperative ref API: the canvas owns Fabric (mutable, side-effect-heavy),
 * and the parent needs to issue discrete commands (add a logo, mutate the
 * selected text's font, etc.). A declarative prop-based interface for these
 * commands would require a queue and ID gymnastics. Refs are cleaner here.
 */
export interface ConstructorCanvasHandle {
  /** Adds a logo image at the active flavor's safe-zone centroid, sized to ~60% of bbox width. */
  /**
   * @param displayName Optional display name for the layer list. Falls
   * back to the filename component of the URL — which for Supabase
   * uploads is the random "<ts>-<rand>.png" stem, not user-friendly.
   */
  addLogo: (
    url: string,
    safeZone: SafeZone,
    displayName?: string
  ) => Promise<void>;
  /** Adds a fabric.IText at the safe-zone centroid using the supplied defaults. */
  addText: (safeZone: SafeZone, defaults: ActiveTextProps & { text?: string }) => Promise<void>;
  /** Mutates the currently selected IText's font props (no-op if no text selected). */
  updateActiveText: (patch: Partial<ActiveTextProps>) => void;
  /** Mutates the currently selected image's props (no-op if no image selected). */
  updateActiveImage: (patch: Partial<ActiveImageProps>) => void;
  /**
   * Snap the currently selected object's bounding box to the active flavor's
   * safe-zone bounding box on the chosen axis / mode. Fires a synthetic
   * `object:modified` event so the history hook captures the new position.
   * No-op when no selection.
   *
   *   axis 'horizontal' + mode 'start'  → align left edges
   *   axis 'horizontal' + mode 'center' → align horizontal centers
   *   axis 'horizontal' + mode 'end'    → align right edges
   *   axis 'vertical'   + mode 'start'  → align top edges
   *   axis 'vertical'   + mode 'center' → align vertical centers
   *   axis 'vertical'   + mode 'end'    → align bottom edges
   */
  alignActiveObject: (
    axis: "horizontal" | "vertical",
    mode: "start" | "center" | "end"
  ) => void;
  /** Removes the active object (logo or text) and clears selection. */
  deleteActive: () => void;
  /** Reset viewport (zoom + pan) to identity. Called by the zoom slider's reset button. */
  resetView: () => void;
  /** Selects the object with the given builder-id (no-op if not found). */
  selectById: (id: string) => void;
  /** Removes the object with the given builder-id and clears selection if it was active. */
  deleteById: (id: string) => void;
  /** Moves the object up one layer within the user-objects subset. */
  bringForwardById: (id: string) => void;
  /** Moves the object down one layer within the user-objects subset. */
  sendBackwardsById: (id: string) => void;
  /**
   * Reapply selection-control geometry + clipPath to a user object. Used by
   * the history hook after restore so per-object runtime-only properties
   * (custom controls, clipPath references) are recreated.
   */
  applyUserObjectControls: (obj: fabric.Object) => void;
  /**
   * Phase 16 Subtask 3: serialize every user-tagged object on the canvas.
   * Used by BuilderShell to persist per-side object pools when the
   * greeting card user switches between Outer / Inner — the current
   * side's objects are pulled out via this method, stored in a per-side
   * bucket, and the new side's bucket is restored via
   * `replaceUserObjects` below.
   */
  getUserObjects: () => unknown[];
  /**
   * Phase 16 Subtask 3: clear all user-tagged objects from the canvas
   * and replace them with the supplied serialized list. Each restored
   * object goes through `applyUserObjectControls` so selection chrome
   * + clipPath are recreated. Pass an empty array to wipe the canvas.
   */
  replaceUserObjects: (serialized: unknown[]) => void;
  /**
   * Phase 29: Promise-returning variant of `replaceUserObjects` —
   * resolves once `fabric.util.enlivenObjects` has finished and the new
   * objects are committed + rendered. Used by the submission flow to
   * render BOTH greeting-card sides into preview PNGs in sequence.
   */
  replaceUserObjectsAsync: (serialized: unknown[]) => Promise<void>;
  /**
   * Restack guide layers on top of user objects, then trigger a render.
   * Called by the history hook once after a batch restore so the canvas
   * paints in the correct z-order without N redundant restacks.
   */
  finalizeRestore: () => void;
  /**
   * True if a fabric.IText on the canvas is currently in editing mode.
   * Used by BuilderShell to skip global Ctrl+Z keystrokes while the user
   * is typing inside a text object (so the IText's own undo behaviour
   * stays in charge).
   */
  isTextEditing: () => boolean;
  /**
   * Render the current canvas to a 2× PNG Blob suitable for upload as the
   * order preview. Excludes selection chrome (active selection cleared
   * before export) so the saved image matches what the buyer sees minus
   * the editing UI.
   */
  exportPreview: () => Promise<Blob | null>;
  /**
   * Snapshot every user-added object as a `SubmissionDesignElement`. Used
   * by the submission flow to hand the designer a structured object list
   * — typography props for text, source URL + transform for images. Excludes
   * guide / system layers. No pixel positions; the designer recreates the
   * design in their own tool.
   */
  getDesignElements: () => SubmissionDesignElement[];
  /**
   * Render JUST the user objects (logos + text) on a transparent background
   * — no chocolate photo, no guide layers, no paper / texture / shadows. The
   * resulting PNG is the buyer's raw design as it should be printed; the
   * print shop uses this asset, not the mockup-on-product preview.
   *
   * Implementation: temporarily hide the bg image + every guide layer,
   * render, sample, then restore. Active selection is also cleared so
   * corner handles don't leak into the saved image.
   */
  exportFlat: () => Promise<Blob | null>;
}

interface ConstructorCanvasProps {
  shapeConfig: ShapeConfig;
  activeFlavor: FlavorConfig;
  activeMaterial: MaterialType;
  /** Show the dashed safe-zone polygon (Canva-style guide). Default true. */
  showSafeZone?: boolean;
  /** Light-direction shadow preset for the 3D faces (mini only). Default "off". */
  shadowMode?: ShadowMode;
  /**
   * Master alpha for shadow polygons (0–1). Each face gets a fraction of
   * this multiplier per the chosen `shadowMode` (see addPolygonGuides).
   * Default 0.30. Crank to 1.0 to verify the polygons are rendering at all.
   */
  shadowIntensity?: number;
  /** Dashed indicator outlining the front face — the most printable region (mini only). */
  showFront?: boolean;
  /** Greeting-card-only: render two dashed vertical lines marking the fold-strip edges. */
  showFoldLines?: boolean;
  /** Color preset for the safe-zone polygon. Default "white". */
  safeZoneColor?: SafeZoneColor;
  /** Outline style for the safe-zone polygon. Default "dashed". */
  safeZoneStroke?: SafeZoneStroke;
  /** Render a tiled paper texture inside the safe-zone polygon. Default false. */
  showTexture?: boolean;
  /**
   * Multiplier applied to the texture tile size before tiling. Higher = each
   * tile appears larger = more visible grain. Default 4.
   */
  textureScale?: number;
  /**
   * Texture overlay opacity (0..100). Drives the LAYER.texture rect's
   * `opacity`. 0 hides the grain entirely, 100 makes it fully present.
   * Default 60.
   */
  textureOpacity?: number;
  /**
   * User-picked paper color, applied as a multiply-blended polygon shaped
   * like the safe zone. null = no overlay (white paper). Multiply chosen
   * over alpha so red-on-white stays pure red while still respecting the
   * underlying photo's shadows and texture. Free-mode + paper material only.
   */
  /**
   * User-picked wrapper colour, applied as the fill on the rubber-band
   * polygon (LAYER.paper) with multiply blend so chocolate-photo shadow
   * gradients show through. null = fall back to the safe-zone color
   * preset's translucent-white default.
   */
  backgroundColor?: string | null;
  /** Size preset for selection handles + close button. Default "small". */
  controlSize?: ControlSize;
  /**
   * When false, the canvas is read-only: marquee selection disabled, every
   * user object's `selectable` + `evented` flags off, active selection
   * dropped. Used during the setup stage so clicks on the chocolate don't
   * surface the property panel. Default true.
   */
  interactive?: boolean;
  /** Dev-only: show drag handles on each polygon point. Default false. */
  editingMode?: boolean;
  /**
   * Dev-only: grid step in canvas px. 0 = off (no snap, no grid).
   * Visible grid lines drawn only at step ≥ 4 (smaller steps would clutter).
   * Default 2.
   */
  gridStep?: number;
  /** Dev-only: viewport zoom level (1, 2, or 4). Default 1. */
  zoomLevel?: number;
  /**
   * Fires when the user pinch-zooms on a touch device. Carries the new
   * clamped zoom so the parent can keep its `zoomLevel` state (and the
   * +/- buttons / slider readout) in sync. The pinch handler applies the
   * viewport transform itself (anchored at the pinch midpoint), so the
   * resulting `zoomLevel` prop change must NOT re-centre the view — the
   * canvas guards against that internally via a suppress flag.
   */
  onZoomChange?: (next: number) => void;
  /** Dev-only: fires when a point handle is dragged; receives normalized coords. */
  onPointMove?: (index: number, normalized: SafeZonePoint) => void;
  /** Fires whenever an IText is selected/updated. null = no selection or non-text. */
  onActiveTextChange?: (props: ActiveTextProps | null) => void;
  /**
   * Fires whenever the active selection changes (or the active text mutates).
   * Carries kind + id so the right-hand panel can render image-vs-text sub-shells.
   */
  onActiveObjectChange?: (info: ActiveObjectInfo | null) => void;
  /**
   * Fires whenever the user-objects list changes (add / remove / reorder /
   * text-changed). Top-of-array items are bottom-of-stack on canvas; the
   * caller is expected to render in reverse to match the visual layer order
   * (top of canvas = top of list, like every other design tool).
   */
  onLayersChange?: (layers: BuilderLayer[]) => void;
  /**
   * Fires once after the fabric.Canvas instance is constructed. Used by the
   * history hook (`useCanvasHistory`) to subscribe to events on the same
   * canvas object the imperative API talks to. Emits null on unmount.
   */
  onCanvasMount?: (canvas: fabric.Canvas | null) => void;
  /**
   * Fires exactly once after the first successful render — bg image loaded,
   * fitted dimensions cached, initial guide layers drawn. Parent gates the
   * upload / add-text controls on this so users can't add objects before
   * the canvas knows where to put them.
   */
  onCanvasReady?: () => void;
  /**
   * Fires every time `renderFlavor` finishes committing a fresh chocolate
   * photo to the canvas — including subsequent flavor swaps. The parent
   * uses it to dismiss a "loading" overlay the moment the new image plus
   * its guides are painted, so the buyer never sees a flicker where the
   * NEW safe-zone polygon paints over the OLD chocolate while the new
   * photo is still in flight.
   */
  onFlavorImageLoaded?: () => void;
}

/**
 * Z-order (bottom → top), enforced by restackLayers():
 *   0. backgroundImage   — chocolate photo (canvas-level, not in objects array)
 *   1. paperBand polygon — white safe-zone shape (free + paper material + toggle on)
 *   2. user objects      — logo, text added by the buyer (selectable)
 *   3. side shadows      — translucent darkening of left/right trapezoids
 *   4. shadow overlay    — multiply blend (Phase 4 / Figma-side asset)
 *   5. highlight overlay — screen blend
 *   6. front-face guide  — dashed stroke marking the front face (always on top)
 */

const LAYER = {
  paper: "__layer_paper",
  texture: "__layer_texture",         // tiled paper texture above paper band
  background: "__layer_background",   // user-picked paper color (multiply blend)
  sideL: "__layer_side_l",            // shadow on left trapezoid
  sideR: "__layer_side_r",            // shadow on right trapezoid
  shadowFront: "__layer_shadow_front", // shadow on front face (used by ShadowMode "right")
  front: "__layer_front",             // dashed front-face guide stroke
  shadow: "__layer_shadow",
  highlight: "__layer_highlight",
  cardChrome: "__layer_card_chrome",     // greeting-card SVG visual
  foldLine: "__layer_fold_line",         // greeting-card fold-strip dashed edges (above bg, below ribbonHole)
  ribbonHole: "__layer_ribbon_hole",     // greeting-card cutout circles (above bg + SVG)
  point: "__layer_point",   // dev: drag handle for a polygon point
  grid: "__layer_grid",     // dev: pixel-grid line
} as const;

type LayerKey = (typeof LAYER)[keyof typeof LAYER];

// Subset of layers that are toggleable on/off without re-fetching the bg image.
// `point` is intentionally excluded — handles are managed by their own effect
// so refreshGuides doesn't recreate them mid-drag.
const GUIDE_LAYERS: LayerKey[] = [
  LAYER.paper, LAYER.texture, LAYER.background, LAYER.sideL, LAYER.sideR,
  LAYER.shadowFront, LAYER.front, LAYER.grid,
  LAYER.cardChrome,
  LAYER.foldLine,
  LAYER.ribbonHole,
];

const PAPER_TEXTURE_URL = "/builder/textures/paper.webp";

function isLayer(obj: fabric.Object, key: LayerKey): boolean {
  return (obj as unknown as { layer?: LayerKey }).layer === key;
}
function isAnyLayer(obj: fabric.Object): boolean {
  return Object.values(LAYER).some((k) => isLayer(obj, k));
}

const ConstructorCanvas = forwardRef<ConstructorCanvasHandle, ConstructorCanvasProps>(
  function ConstructorCanvas(
    {
      shapeConfig,
      activeFlavor,
      activeMaterial,
      showSafeZone = true,
      shadowMode = "off",
      shadowIntensity = 0.30,
      showFront = false,
      showFoldLines = true,
      safeZoneColor = "white",
      safeZoneStroke = "dashed",
      showTexture = false,
      textureScale = 4,
      textureOpacity = 60,
      backgroundColor = null,
      controlSize = "small",
      interactive = true,
      editingMode = false,
      gridStep = 2,
      zoomLevel = 1,
      onZoomChange,
      onPointMove,
      onActiveTextChange,
      onActiveObjectChange,
      onLayersChange,
      onCanvasReady,
      onFlavorImageLoaded,
      onCanvasMount,
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasElRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<fabric.Canvas | null>(null);
    const fittedRef = useRef<Fitted | null>(null);
    // The last rendered safe-zone centroid in canvas coordinates. We use this
    // to translate user-added objects by the centroid delta on flavor switch
    // (or canvas resize) so designs stay positioned RELATIVE TO THE SAFE ZONE,
    // not relative to the canvas — without this, switching flavors would let
    // a logo drift off the printable area because each flavor's polygon sits
    // at slightly different absolute coordinates.
    const lastCentroidRef = useRef<{ x: number; y: number } | null>(null);
    // Companion to lastCentroidRef: the rendered content's fit width plus the
    // flavor it belonged to. On a window resize the canvas re-fits the same
    // flavor at a new size, so the fit-width ratio scales user objects to
    // keep them the same fraction of the printable area. On a FLAVOR switch
    // the flavor id differs, so the ratio is forced to 1 (translate-only) —
    // preserving the long-standing behaviour where switching flavors keeps
    // object sizes constant.
    const lastFitScaleRef = useRef<{ flavorId: string; width: number } | null>(
      null
    );

    const onActiveTextChangeRef = useRef(onActiveTextChange);
    onActiveTextChangeRef.current = onActiveTextChange;
    const onActiveObjectChangeRef = useRef(onActiveObjectChange);
    onActiveObjectChangeRef.current = onActiveObjectChange;
    const onLayersChangeRef = useRef(onLayersChange);
    onLayersChangeRef.current = onLayersChange;
    const onCanvasReadyRef = useRef(onCanvasReady);
    onCanvasReadyRef.current = onCanvasReady;
    const onFlavorImageLoadedRef = useRef(onFlavorImageLoaded);
    onFlavorImageLoadedRef.current = onFlavorImageLoaded;
    // Phase 16 Subtask 3: id of the flavor whose chocolate image is
    // currently committed to the canvas. refreshGuides bails when this
    // is out of sync with `activeFlavor.id`, so the new safe-zone
    // polygon never paints on top of the OLD chocolate while the new
    // photo is still loading. Cleared to null on each renderFlavor call;
    // set inside the fromURL callback once the new image lands.
    const fittedFlavorIdRef = useRef<string | null>(null);
    const onCanvasMountRef = useRef(onCanvasMount);
    onCanvasMountRef.current = onCanvasMount;
    // activeFlavor needed inside applyUserObjectControls to rebuild clipPaths
    // for objects restored by the history hook (their original clipPath was
    // a fabric.Polygon instance that doesn't survive serialization).
    const activeFlavorRef = useRef(activeFlavor);
    activeFlavorRef.current = activeFlavor;
    // One-shot guard so onCanvasReady fires exactly once per mount, after
    // the first successful renderFlavor (regardless of how many flavor swaps
    // happen later).
    const firedReadyRef = useRef(false);

    // Refs for state that the mount-only init effect's mouse handlers need
    // at fire-time. Direct closure capture would freeze them at mount.
    const gridStepRef = useRef(gridStep);
    gridStepRef.current = gridStep;
    const zoomLevelRef = useRef(zoomLevel);
    zoomLevelRef.current = zoomLevel;
    // controlSize is read inside the imperative add* handlers (which create
    // user objects without re-running on prop changes). Ref so they always
    // see the current preset.
    const controlSizeRef = useRef(controlSize);
    controlSizeRef.current = controlSize;
    const onPointMoveRef = useRef(onPointMove);
    onPointMoveRef.current = onPointMove;
    // Snapshot of guide-render state for the imperative rebuild during a
    // point-handle drag. We can't read these via React state inside the
    // drag handler — that would require a state update, which would re-
    // render and strip the handle being dragged. Reading via ref keeps the
    // drag entirely local to fabric until the user releases.
    const guideStateRef = useRef({
      showSafeZone,
      safeZoneColor,
      safeZoneStroke,
      shadowMode,
      shadowIntensity,
      showFront,
      backgroundColor,
      shapeId: shapeConfig.id,
      zoomLevel,
    });
    guideStateRef.current = {
      showSafeZone,
      safeZoneColor,
      safeZoneStroke,
      shadowMode,
      shadowIntensity,
      showFront,
      backgroundColor,
      shapeId: shapeConfig.id,
      zoomLevel,
    };
    // Pan state: tracked imperatively (not via React state) so we don't
    // re-render every mouse-move during a drag.
    const panStateRef = useRef<{ active: boolean; x: number; y: number }>({
      active: false,
      x: 0,
      y: 0,
    });

    const onZoomChangeRef = useRef(onZoomChange);
    onZoomChangeRef.current = onZoomChange;
    // Two-finger pinch-zoom state. Tracked imperatively so each touchmove
    // mutates the viewport transform without a React re-render. `startDist`
    // is the finger spread at gesture start; `startZoom` the zoom level then;
    // `cx`/`cy` the midpoint (container-local px) used as the zoom anchor.
    const pinchRef = useRef<{
      active: boolean;
      startDist: number;
      startZoom: number;
    }>({ active: false, startDist: 0, startZoom: 1 });
    // Set true by the pinch handler immediately before it calls onZoomChange.
    // The zoom effect consumes it (once) and skips the centred zoomToPoint —
    // the pinch already applied the transform anchored at the finger midpoint,
    // and re-centring would yank the view back to the canvas centre.
    const suppressZoomEffectRef = useRef(false);

    const renderFlavorRef = useRef<() => void>(() => {});
    const refreshGuidesRef = useRef<() => void>(() => {});
    // First-fit retry counter (Phase 10.5 Subtask 7). Resets to 0 once
    // canvas dimensions are non-zero. Caps at 5 RAF tries before giving
    // up so a permanently-collapsed container can't spin forever.
    const firstFitRetryRef = useRef<number>(0);
    // Phase 12 Subtask 1: monotonic token to invalidate stale fromURL
    // callbacks. Without this, a rapid sequence of ResizeObserver fires
    // during mount could kick off N concurrent image loads — each callback
    // ran setBackgroundImage with whichever dims it captured, and the
    // last-resolved one won. If those resolutions came back out-of-order
    // (or one was based on a stale-pre-resize cw/ch read), the chocolate
    // landed off-centre. Each renderFlavor() invocation increments this
    // ref; callbacks compare against the value they captured and bail if
    // a newer fit has been kicked off in the meantime.
    const fitTokenRef = useRef<number>(0);

    // Re-anchor (and on resize, re-scale) every user object after the
    // chocolate / card re-fits. Position is tracked relative to the
    // front-face centroid; size is tracked via the fit-width ratio but ONLY
    // when the flavor is unchanged from the previous fit (a window resize).
    // A flavor switch forces ratio 1, keeping object sizes constant — the
    // long-standing, intentionally-preserved behaviour.
    function transformUserObjectsOnRefit(
      canvas: fabric.Canvas,
      newCentroid: { x: number; y: number },
      fitWidth: number,
      flavorId: string
    ): void {
      const last = lastCentroidRef.current;
      const lastFit = lastFitScaleRef.current;
      const sameFlavor = lastFit !== null && lastFit.flavorId === flavorId;
      const ratio =
        sameFlavor && lastFit.width > 0 ? fitWidth / lastFit.width : 1;
      if (last) {
        const moved = newCentroid.x !== last.x || newCentroid.y !== last.y;
        if (moved || ratio !== 1) {
          for (const o of canvas.getObjects()) {
            if (isAnyLayer(o)) continue;
            const ox = (o.left ?? 0) - last.x;
            const oy = (o.top ?? 0) - last.y;
            o.set({
              left: newCentroid.x + ox * ratio,
              top: newCentroid.y + oy * ratio,
              scaleX: (o.scaleX ?? 1) * ratio,
              scaleY: (o.scaleY ?? 1) * ratio,
            });
            o.setCoords();
          }
        }
      }
      lastCentroidRef.current = newCentroid;
      lastFitScaleRef.current = { flavorId, width: fitWidth };
    }

    function renderFlavor() {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const initialW = canvas.getWidth();
      const initialH = canvas.getHeight();
      if (initialW === 0 || initialH === 0) {
        // Container hasn't laid out yet — retry on the next frame. The
        // ResizeObserver will also re-trigger as dimensions settle, but
        // this RAF chain covers the case where the observer fires AFTER
        // first useEffect: limited to a few retries so we don't spin.
        const tries = (firstFitRetryRef.current ?? 0) + 1;
        firstFitRetryRef.current = tries;
        if (tries <= 5) {
          requestAnimationFrame(() => renderFlavorRef.current());
        }
        return;
      }
      firstFitRetryRef.current = 0;

      const isInitialFit = fittedRef.current === null;
      // Phase 12 Subtask 1: on the very first fit, force an identity
      // viewport transform. If the canvas instance has been re-used (HMR,
      // dev rebuild, or any prior interaction perturbed the matrix before
      // the bg image landed), a non-identity vpt translates the freshly-
      // positioned background image off-centre. Subsequent fits — flavor
      // switches, guide refreshes — must NOT touch the vpt; the user's
      // pan/zoom across flavor swaps is intentional.
      if (isInitialFit && canvas.viewportTransform) {
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      }
      const myToken = ++fitTokenRef.current;
      // Phase 16 Subtask 3: invalidate the "image-committed" id so
      // refreshGuides bails until the new fromURL resolves. Without
      // this gate, the deps-driven refreshGuides effect would paint
      // the new safe-zone polygon on top of the OLD chocolate while
      // the new photo was still in flight — visible flash.
      fittedFlavorIdRef.current = null;

      // Phase 20: SVG-asset route. Greeting card visual is shipped as
      // `template.svg`. Renders at the SVG's NATURAL aspect ratio
      // (parsed from viewBox) with `fitContain` against canvas dims —
      // the same math Mini's WebP photo uses, just sourced from the
      // SVG's own viewBox rather than a fixed nativeImageSize.
      // No template slots, no heart, no auto-spawned content. Buyer
      // adds their own objects with the existing toolbar.
      const isSVG = activeFlavor.imageSrc?.toLowerCase().endsWith(".svg") ?? false;
      if (isSVG && activeFlavor.imageSrc) {
        const svgUrl = activeFlavor.imageSrc;
        // Clear any stale background image from a prior shape-mode
        // route. @types narrows arg to `string | fabric.Image`; null
        // is accepted at runtime.
        (
          canvas as unknown as {
            setBackgroundImage: (img: null, cb: () => void) => void;
          }
        ).setBackgroundImage(null, () => canvas.requestRenderAll());
        canvas.getObjects().filter(isAnyLayer).forEach((o) => canvas.remove(o));

        fabric.loadSVGFromURL(svgUrl, (objects, options) => {
          if (fabricRef.current !== canvas) return;
          if (fitTokenRef.current !== myToken) return;
          const cw2 = canvas.getWidth();
          const ch2 = canvas.getHeight();
          if (cw2 === 0 || ch2 === 0) {
            requestAnimationFrame(() => renderFlavorRef.current());
            return;
          }

          // Natural SVG dims sourced from the parsed viewBox / width /
          // height (loadSVGFromURL exposes both viewBox and the
          // resolved width/height). Fall back to the shape's
          // nativeImageSize if neither is present.
          const opts = options as unknown as {
            viewBoxWidth?: number;
            viewBoxHeight?: number;
            width?: number;
            height?: number;
          };
          const svgW =
            (opts.viewBoxWidth || opts.width) ??
            shapeConfig.nativeImageSize.width;
          const svgH =
            (opts.viewBoxHeight || opts.height) ??
            shapeConfig.nativeImageSize.height;
          const scale2 = fitContain(svgW, svgH, cw2, ch2);
          const left2 = (cw2 - svgW * scale2) / 2;
          const top2 = (ch2 - svgH * scale2) / 2;
          const fitted2: Fitted = {
            left: left2,
            top: top2,
            width: svgW * scale2,
            height: svgH * scale2,
          };
          fittedRef.current = fitted2;

          // Background-color rect sits BEHIND the SVG so a Тло pick
          // shows through any transparent areas of the card art.
          // Sized to the safe-zone outer rect (points 1, 4, 5, 8) so
          // it paints inside the card silhouette only — page margins
          // around the card stay transparent.
          if (backgroundColor) {
            // Phase 25 Subtask 6: shrink the bg rect by 2 px on every
            // side so the colour fill never bleeds past the card's outer
            // stroke. The SVG path's `stroke-width:3` half-stroke (1.5 px)
            // sits outside the geometric bounds; without the inset the
            // colour paints onto the page margin alongside the half-
            // stroke, producing a visible bleed.
            const INSET = 2;
            const cardLeft = fitted2.left + 0.0461 * fitted2.width + INSET;
            const cardTop = fitted2.top + 0.1687 * fitted2.height + INSET;
            const cardW = (0.9539 - 0.0461) * fitted2.width - INSET * 2;
            const cardH = (0.8300 - 0.1687) * fitted2.height - INSET * 2;
            const bgRect = new fabric.Rect({
              left: cardLeft,
              top: cardTop,
              width: cardW,
              height: cardH,
              fill: backgroundColor,
              selectable: false,
              evented: false,
              originX: "left",
              originY: "top",
            });
            (bgRect as unknown as { layer: LayerKey }).layer = LAYER.background;
            canvas.add(bgRect);
          }

          const svgGroup = fabric.util.groupSVGElements(
            objects as fabric.Object[],
            options as Record<string, unknown>
          );
          // Drop the svg's own width/height so fabric uses the parsed
          // viewBox geometry and our explicit scale takes effect.
          svgGroup.set({
            left: left2,
            top: top2,
            scaleX: scale2,
            scaleY: scale2,
            selectable: false,
            evented: false,
            originX: "left",
            originY: "top",
          });
          (svgGroup as unknown as { layer: LayerKey }).layer = LAYER.cardChrome;
          canvas.add(svgGroup);

          // Phase 25 Subtask 4: fold-strip edges rendered as fabric.Line
          // objects (LAYER.foldLine) so they sit ABOVE the bg-color rect
          // (which previously buried the SVG-embedded fold lines). The
          // `showFoldLines` prop / canvas-settings toggle hides them at
          // render time — the lines aren't created when false. Stripped
          // from the mockup export (excludeFromExport: true) so the
          // printer doesn't see the guide.
          const FOLD_LEFT_X = 0.4820;
          const FOLD_RIGHT_X = 0.5425;
          if (showFoldLines) {
            for (const foldX of [FOLD_LEFT_X, FOLD_RIGHT_X]) {
              const x = fitted2.left + foldX * fitted2.width;
              const yTop = fitted2.top + 0.1687 * fitted2.height;
              const yBottom = fitted2.top + 0.8300 * fitted2.height;
              const line = new fabric.Line([x, yTop, x, yBottom], {
                stroke: "#9C9C9C",
                strokeWidth: 1.5,
                strokeDashArray: [8, 6],
                selectable: false,
                evented: false,
                excludeFromExport: true,
              });
              (line as unknown as { layer: LayerKey }).layer = LAYER.foldLine;
              canvas.add(line);
            }
          }

          // Phase 22 Subtask 2: ribbon-hole circles. Painted ON TOP of
          // the bg-color rect + SVG + user objects so the holes always
          // read as cutouts regardless of paper colour. NOT excluded
          // from export — the mockup PNG must show them.
          // Positions (normalized to 2016×1512 photo):
          //   left  hole = (173, 745) → (0.0858, 0.4928)
          //   right hole = (1827, 745) → (0.9063, 0.4928)
          //   diameter = 20 px → radius = 10 / 2016 of fitted width.
          const holeRadius = (10 / 2016) * fitted2.width;
          const holePositions: Array<{ cx: number; cy: number }> = [
            { cx: 0.0858, cy: 0.4928 },
            { cx: 0.9063, cy: 0.4928 },
          ];
          for (const pos of holePositions) {
            const cx = fitted2.left + pos.cx * fitted2.width;
            const cy = fitted2.top + pos.cy * fitted2.height;
            const hole = new fabric.Circle({
              left: cx,
              top: cy,
              radius: holeRadius,
              fill: "#ffffff",
              stroke: "#444444",
              strokeWidth: 2,
              selectable: false,
              evented: false,
              originX: "center",
              originY: "center",
            });
            (hole as unknown as { layer: LayerKey }).layer = LAYER.ribbonHole;
            canvas.add(hole);
          }

          // Phase 23 Subtask 5: dashed amber branding-zone outlines
          // dropped on the greeting card. The card's visible outline
          // (SVG `LAYER.cardChrome`) already communicates the printable
          // region clearly; the extra guide added visual noise without
          // adding info. Content is still clipped to the card outline —
          // see the `cardClipPath` block below.

          // Centroid-delta translate + resize-scale of user objects. Both
          // card sides share the same safeZone, so the delta is zero on side
          // switches — the math is here for symmetry with the chocolate
          // route + size-changes from window resize.
          const newCentroid = frontFaceCentroidOnCanvas(
            activeFlavor.safeZone.points,
            fitted2
          );
          transformUserObjectsOnRefit(
            canvas,
            newCentroid,
            fitted2.width,
            activeFlavor.id
          );

          restackLayers(canvas);

          // Phase 24 Subtask 3: greeting card clips user objects to the
          // FULL 12-point safe-zone polygon (the card outline). Content can
          // land anywhere inside the card — fold strip + ribbon-hole columns
          // included — but anything past the card edge is clipped. The same
          // helper is used by addLogo / addText / applyUserObjectControls /
          // replaceUserObjects so every entry point produces the same clip.
          const cardClipPath = makeUserObjectClipPath(activeFlavor, fitted2);
          for (const o of canvas.getObjects()) {
            if (isAnyLayer(o)) continue;
            o.clipPath = cardClipPath;
            o.dirty = true;
          }

          canvas.requestRenderAll();
          fittedFlavorIdRef.current = activeFlavor.id;
          onFlavorImageLoadedRef.current?.();
          if (!firedReadyRef.current) {
            firedReadyRef.current = true;
            onCanvasReadyRef.current?.();
          }
        });
        return;
      }

      // After the SVG branch above, the only remaining path is a raster
      // photo (Mini / Popular). `imageSrc === null` was already handled
      // for the greeting card and would never fall through here, but
      // narrow defensively before passing into fabric.Image.fromURL,
      // whose @types insist on a non-null string.
      if (!activeFlavor.imageSrc) return;
      fabric.Image.fromURL(
        activeFlavor.imageSrc,
        (img) => {
          if (fabricRef.current !== canvas) return;
          // Bail if a newer fit has been kicked off in the meantime —
          // protects against the rapid-RO-during-mount race that left the
          // last-resolved (sometimes stale) callback paint the bg image.
          if (fitTokenRef.current !== myToken) return;
          if (!img.width || !img.height) return;

          // Re-read canvas dims INSIDE the async callback. fromURL is
          // async; the dims captured at call time may be stale by the
          // time the photo arrives. If they've gone to 0 (mid-layout),
          // retry next frame.
          const cw = canvas.getWidth();
          const ch = canvas.getHeight();
          if (cw === 0 || ch === 0) {
            requestAnimationFrame(() => renderFlavorRef.current());
            return;
          }

          const scale = fitContain(img.width, img.height, cw, ch);
          const left = (cw - img.width * scale) / 2;
          const top = (ch - img.height * scale) / 2;

          img.set({
            left,
            top,
            scaleX: scale,
            scaleY: scale,
            selectable: false,
            evented: false,
            originX: "left",
            originY: "top",
          });
          canvas.setBackgroundImage(img, () => {
            if (fabricRef.current !== canvas) return;
            canvas.requestRenderAll();
          });

          const fitted: Fitted = {
            left,
            top,
            width: img.width * scale,
            height: img.height * scale,
          };
          fittedRef.current = fitted;

          // Strip ALL old layer objects (guides + photographic overlays).
          canvas.getObjects().filter(isAnyLayer).forEach((o) => canvas.remove(o));

          // Translate user objects by FRONT-FACE centroid delta so they track
          // the printable area, not the canvas or the all-8-point centroid
          // (see frontFaceCentroidOnCanvas comment for why). On a same-flavor
          // re-fit (window resize) objects also scale by the fit-width ratio
          // so they keep their fraction of the printable area.
          const newCentroid = frontFaceCentroidOnCanvas(activeFlavor.safeZone.points, fitted);
          transformUserObjectsOnRefit(
            canvas,
            newCentroid,
            fitted.width,
            activeFlavor.id
          );

          addGuideLayers(canvas, fitted, shapeConfig, activeFlavor, activeMaterial, {
            showSafeZone,
            shadowMode,
            shadowIntensity,
            showFront,
            safeZoneColor,
            safeZoneStroke,
            backgroundColor,
            editingMode,
            gridStep,
            zoomLevel,
          });

          // Paper texture is async (loads a file). Skipped silently if the
          // file 404s — graceful no-op until Figma asset arrives.
          if (showTexture && shapeConfig.mode === "free" && activeMaterial === "paper") {
            loadPaperTexture(fabricRef, fitted, activeFlavor.safeZone, textureScale, textureOpacity);
          }

          if (activeFlavor.shadowSrc) {
            loadOverlay(fabricRef, activeFlavor.shadowSrc, fitted, LAYER.shadow, "multiply");
          }
          if (activeFlavor.highlightSrc) {
            loadOverlay(fabricRef, activeFlavor.highlightSrc, fitted, LAYER.highlight, "screen");
          }

          restackLayers(canvas);

          // Refresh clipPath on user objects so they're constrained to the
          // (possibly different) new flavor's branding zone. Matches the
          // fresh-add semantic from addLogo / addText — front-face
          // polygon for chocolates, compound left+right quads for the
          // greeting card.
          for (const o of canvas.getObjects()) {
            if (isAnyLayer(o)) continue;
            o.clipPath = makeUserObjectClipPath(activeFlavor, fitted);
            o.dirty = true;
          }

          // Re-add dev point handles after a flavor swap so each new flavor's
          // polygon is editable. The dedicated editingMode useEffect handles
          // toggle on/off; this branch handles flavor-change while editing.
          if (editingMode && activeFlavor.safeZone.points.length > 0) {
            addPointHandles(canvas, fitted, activeFlavor.safeZone.points, zoomLevel);
            restackLayers(canvas);
          }

          canvas.requestRenderAll();

          // Phase 16 Subtask 3: mark this flavor's image as committed so
          // the gated refreshGuides effect can run, and notify the parent
          // so it can dismiss its "loading" overlay. Both happen
          // synchronously inside the same fromURL callback that paints
          // the image — guides + image land in the same paint frame, no
          // visible flash.
          fittedFlavorIdRef.current = activeFlavor.id;
          onFlavorImageLoadedRef.current?.();

          // Signal ready state to the parent — fittedRef is populated, the
          // background image is on canvas, and guide layers are drawn.
          // Parent uses this to enable the upload / add-text controls.
          if (!firedReadyRef.current) {
            firedReadyRef.current = true;
            onCanvasReadyRef.current?.();
          }
        },
        { crossOrigin: "anonymous" }
      );
    }

    /**
     * Refresh ONLY the guide overlays (paper, sides, front) without reloading
     * the background image. Used when toggles change — avoids the bg flicker
     * that a full renderFlavor would cause.
     */
    function refreshGuides() {
      const canvas = fabricRef.current;
      const fitted = fittedRef.current;
      if (!canvas || !fitted) return;
      // Phase 16 Subtask 3: bail if the flavor whose image is currently
      // committed to the canvas doesn't match the active flavor — i.e.
      // the user just picked a new flavor and its photo is still loading.
      // Without this gate, the toggle-effect's dep on
      // `activeFlavor.safeZone.points` fires refreshGuides synchronously,
      // which paints the NEW safe-zone polygon over the OLD chocolate
      // until the async image lands. The fromURL callback in
      // renderFlavor calls addGuideLayers itself once the new image
      // arrives, so guides + image land in the same paint frame.
      if (fittedFlavorIdRef.current !== activeFlavor.id) {
        return;
      }

      canvas
        .getObjects()
        .filter((o) => GUIDE_LAYERS.some((k) => isLayer(o, k)))
        .forEach((o) => canvas.remove(o));

      // Phase 20: greeting card (template mode with SVG asset) gets a
      // simpler refresh path — the SVG itself is in LAYER.cardChrome
      // and was stripped above, so we re-paint the bg-color rect, the
      // safe-zone outline, and re-add the SVG group via a fresh render.
      // Calling renderFlavor would reload the SVG over the network,
      // which is wasteful for toggle changes; instead we re-paint just
      // the bg rect + safe-zone polygons + leave the SVG fetch to the
      // flavor-change path. The SVG group itself was just stripped, so
      // trigger renderFlavor to re-add it. Heavy but correct.
      if (shapeConfig.mode === "template") {
        renderFlavorRef.current();
        return;
      }

      addGuideLayers(canvas, fitted, shapeConfig, activeFlavor, activeMaterial, {
        showSafeZone,
        shadowMode,
        shadowIntensity,
        showFront,
        safeZoneColor,
        safeZoneStroke,
        backgroundColor,
        editingMode,
        gridStep,
        zoomLevel,
      });

      if (showTexture && shapeConfig.mode === "free" && activeMaterial === "paper") {
        loadPaperTexture(fabricRef, fitted, activeFlavor.safeZone, textureScale, textureOpacity);
      }

      restackLayers(canvas);
      // Sync render — the next paint must include the just-added background /
      // shadow polys without waiting for the next frame.
      canvas.renderAll();
    }

    // Keep refs pointed at latest closures (so the mount-only init effect's
    // ResizeObserver always picks up fresh state without dep gymnastics).
    renderFlavorRef.current = renderFlavor;
    refreshGuidesRef.current = refreshGuides;

    /* -------------------------------------------------------------- */
    /* Init + resize (mount only)                                     */
    /* -------------------------------------------------------------- */
    useEffect(() => {
      if (!canvasElRef.current || !containerRef.current) return;

      const canvas = new fabric.Canvas(canvasElRef.current, {
        preserveObjectStacking: true,
        selection: false,
        backgroundColor: "transparent",
        enableRetinaScaling: true,
      });
      fabricRef.current = canvas;
      // Surface the fabric instance to consumers (history hook). Done before
      // any object is added so listeners catch the very first events.
      onCanvasMountRef.current?.(canvas);

      const emitActiveSelection = () => {
        const obj = canvas.getActiveObject();
        if (!obj || isAnyLayer(obj)) {
          onActiveTextChangeRef.current?.(null);
          onActiveObjectChangeRef.current?.(null);
          return;
        }
        const id = getBuilderId(obj);
        if (obj.type === "textbox") {
          const it = obj as fabric.Textbox;
          const textProps = readActiveTextProps(it);
          onActiveTextChangeRef.current?.(textProps);
          onActiveObjectChangeRef.current?.(
            id ? { id, kind: "text", text: textProps } : null
          );
          return;
        }
        if (obj.type === "image") {
          onActiveTextChangeRef.current?.(null);
          const imageProps = readActiveImageProps(obj);
          onActiveObjectChangeRef.current?.(
            id ? { id, kind: "image", image: imageProps } : null
          );
          return;
        }
        onActiveTextChangeRef.current?.(null);
        onActiveObjectChangeRef.current?.(null);
      };
      const emitSelectionCleared = () => {
        onActiveTextChangeRef.current?.(null);
        onActiveObjectChangeRef.current?.(null);
      };

      canvas.on("selection:created", emitActiveSelection);
      canvas.on("selection:updated", emitActiveSelection);
      canvas.on("selection:cleared", emitSelectionCleared);

      // Layers list — fires whenever the user-objects subset changes.
      // text:changed covers in-place edits so the layer name stays in sync.
      const emitLayers = () => {
        const layers = canvas
          .getObjects()
          .filter((o) => !isAnyLayer(o))
          .map(toBuilderLayer)
          .filter((l): l is BuilderLayer => l !== null);
        onLayersChangeRef.current?.(layers);
      };
      canvas.on("object:added", (e) => {
        if (e.target && !isAnyLayer(e.target)) emitLayers();
        // Phase 24 Subtask 4: safety net for z-order. Fabric's
        // bringForward / sendBackwards aren't called from anywhere
        // user-driven on user objects, but the layer-list reorder
        // imperatives + history restores can leave guide layers below
        // user objects momentarily. Re-running restackLayers on every
        // add re-asserts the canonical z-order without overhead.
        restackLayers(canvas);
      });
      canvas.on("object:removed", (e) => {
        if (e.target && !isAnyLayer(e.target)) emitLayers();
        restackLayers(canvas);
      });
      // Reordering inside the user subset (bringForward/sendBackwards) doesn't
      // trigger a fabric event. Callers are expected to invoke the imperative
      // method on the handle, which fires emitLayers() itself.
      canvas.on("text:changed", () => {
        emitLayers();
        // Also re-emit active object info so the right-hand panel sees the
        // text mutation in real time once we wire its props in next session.
        const obj = canvas.getActiveObject();
        if (obj && obj.type === "textbox") emitActiveSelection();
      });

      // Dev: dragging a point handle. We update the polygon (and dependent
      // shadow/front guides) IMPERATIVELY off fabric, with NO React state
      // update during drag. State updates would trigger renderFlavor, which
      // strips all layers — including the handle currently being dragged —
      // and that's what was making the drag feel stuck. State syncs once
      // on `object:modified` (drop) instead.
      canvas.on("object:moving", (e) => {
        const obj = e.target;
        if (!obj || !isLayer(obj, LAYER.point)) return;
        const fitted = fittedRef.current;
        if (!fitted) return;
        rebuildPointDependentGuides(canvas, fitted, guideStateRef.current);
      });

      // Dev: drop event for a point handle — snap (if step > 0), do a final
      // imperative polygon rebuild, then sync React state with the snapped
      // coords. Snap operates in canvas-px; the displayed step in DevPanel is
      // screen-px, converted via /zoom so the snap targets line up with
      // visible grid lines at any zoom level.
      canvas.on("object:modified", (e) => {
        const obj = e.target;
        if (!obj || !isLayer(obj, LAYER.point)) return;
        const fitted = fittedRef.current;
        if (!fitted) return;

        let x = obj.left ?? 0;
        let y = obj.top ?? 0;
        const screenStep = gridStepRef.current;
        const zoom = zoomLevelRef.current;
        const canvasStep = zoom > 0 ? screenStep / zoom : screenStep;
        if (canvasStep > 0) {
          x = Math.round(x / canvasStep) * canvasStep;
          y = Math.round(y / canvasStep) * canvasStep;
          obj.set({ left: x, top: y });
          obj.setCoords();
        }

        rebuildPointDependentGuides(canvas, fitted, guideStateRef.current);

        const idx = (obj as unknown as { pointIndex?: number }).pointIndex;
        if (idx === undefined) return;
        onPointMoveRef.current?.(idx, {
          x: (x - fitted.left) / fitted.width,
          y: (y - fitted.top) / fitted.height,
        });
      });

      // Phase 15 Subtask 5: bake the transient scale that fabric applies
      // during corner / side drags into the textbox's actual properties,
      // so the RightPanel's font-size NumberBox stays in sync and the
      // resize-box mode actually wraps text instead of scaling glyphs.
      //   • Scale mode (default): scaleX → fontSize × scaleX, width × scaleX,
      //     scaleX/Y reset to 1. The text grows numerically, NumberBox
      //     reads the new fontSize, ColorRow + alignment behave as
      //     expected.
      //   • Resize mode: scaleX → width × scaleX, scaleY → height ×
      //     scaleY, scaleX/Y reset to 1. fontSize untouched; Textbox
      //     re-flows the wrapped text inside the new box.
      // Runs on object:modified (drag end) — doing it during scaling
      // fights fabric's in-flight transform.
      canvas.on("object:modified", (e) => {
        const target = e.target;
        if (!target || target.type !== "textbox") return;
        const sx = target.scaleX ?? 1;
        const sy = target.scaleY ?? 1;
        if (sx === 1 && sy === 1) return;
        const tb = target as fabric.Textbox & { boxResizeMode?: boolean };
        if (tb.boxResizeMode === true) {
          tb.set({
            width: (tb.width ?? 0) * sx,
            height: (tb.height ?? 0) * sy,
            scaleX: 1,
            scaleY: 1,
          });
        } else {
          tb.set({
            fontSize: (tb.fontSize ?? 32) * sx,
            width: (tb.width ?? 0) * sx,
            scaleX: 1,
            scaleY: 1,
          });
        }
        tb.setCoords();
        // Re-emit text props so RightPanel's NumberBox refreshes with
        // the new fontSize / width.
        const textProps = readActiveTextProps(tb);
        onActiveTextChangeRef.current?.(textProps);
        const id = getBuilderId(tb);
        if (id) {
          onActiveObjectChangeRef.current?.({
            id,
            kind: "text",
            text: textProps,
          });
        }
        canvas.requestRenderAll();
      });

      // Drag-to-pan engagement gate.
      //   • Desktop: zoom > 1 OR alt-held (preserves the original dev-pan
      //     intent — most desktop users won't pan from default zoom).
      //   • Touch:   any single-finger drag on empty canvas. Phones have
      //     no alt key and most users don't zoom before dragging, so the
      //     desktop gate would lock them out of camera movement entirely.
      // Engage only on empty canvas hits — clicking a point handle / logo
      // / text lets fabric's own drag handler run instead.
      const isTouchDevice = (): boolean => {
        if (typeof window === "undefined") return false;
        return (
          "ontouchstart" in window ||
          (navigator.maxTouchPoints ?? 0) > 0
        );
      };
      // Read clientX/clientY safely from any of MouseEvent / PointerEvent /
      // TouchEvent. Fabric routes touch through its mouse:* events, so the
      // wrapped event may be a raw TouchEvent which exposes coordinates only
      // under `touches[0]` / `changedTouches[0]`.
      const readClientXY = (
        e: Event
      ): { x: number; y: number } => {
        const mouseLike = e as MouseEvent;
        if (typeof mouseLike.clientX === "number") {
          return { x: mouseLike.clientX, y: mouseLike.clientY };
        }
        const touch = e as TouchEvent;
        const t = touch.touches?.[0] ?? touch.changedTouches?.[0];
        return { x: t?.clientX ?? 0, y: t?.clientY ?? 0 };
      };
      canvas.on("mouse:down", (opt) => {
        if (opt.target) return;
        // A two-finger pinch is in progress — let the native touch handlers
        // below own the gesture; don't also engage single-finger pan.
        if (pinchRef.current.active) return;
        const e = opt.e as MouseEvent | TouchEvent | PointerEvent;
        const z = zoomLevelRef.current;
        const altKey = (e as MouseEvent).altKey ?? false;
        if (!(isTouchDevice() || z > 1 || altKey)) return;
        const { x, y } = readClientXY(e);
        panStateRef.current = { active: true, x, y };
      });
      canvas.on("mouse:move", (opt) => {
        if (!panStateRef.current.active) return;
        const e = opt.e as MouseEvent | TouchEvent | PointerEvent;
        const vpt = canvas.viewportTransform;
        if (!vpt) return;
        const { x, y } = readClientXY(e);
        vpt[4] += x - panStateRef.current.x;
        vpt[5] += y - panStateRef.current.y;
        canvas.requestRenderAll();
        panStateRef.current.x = x;
        panStateRef.current.y = y;
      });
      canvas.on("mouse:up", () => {
        if (!panStateRef.current.active) return;
        // setViewportTransform "commits" the in-place mutation we made above.
        if (canvas.viewportTransform) {
          canvas.setViewportTransform(canvas.viewportTransform);
        }
        panStateRef.current.active = false;
      });

      // ---------------------------------------------------------------
      // Two-finger pinch-zoom (touch only). Fabric's mouse:* bridge only
      // surfaces the FIRST touch point, so pinch can't be derived from it.
      // We bind native touch listeners on the container instead and drive
      // canvas.zoomToPoint directly, anchored at the midpoint between the
      // two fingers. `touch-none` on the container suppresses the browser's
      // own pinch-zoom / scroll, so this is the only zoom path on touch.
      //
      // touchmove is registered { passive: false } so preventDefault() can
      // stop iOS Safari from page-zooming under the canvas. The single-
      // finger pan (above) is force-cancelled the moment a second finger
      // lands so the two gestures never fight.
      const container = containerRef.current;
      const touchDist = (t: TouchList): number => {
        const dx = t[0].clientX - t[1].clientX;
        const dy = t[0].clientY - t[1].clientY;
        return Math.hypot(dx, dy);
      };
      const clampZoom = (n: number): number =>
        Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, n));
      const onTouchStart = (e: TouchEvent) => {
        if (e.touches.length !== 2) return;
        // Kill any single-finger pan that fabric started on the first touch.
        panStateRef.current.active = false;
        pinchRef.current = {
          active: true,
          startDist: touchDist(e.touches),
          startZoom: canvas.getZoom(),
        };
      };
      const onTouchMove = (e: TouchEvent) => {
        if (!pinchRef.current.active || e.touches.length !== 2) return;
        e.preventDefault();
        const dist = touchDist(e.touches);
        if (pinchRef.current.startDist <= 0) return;
        const ratio = dist / pinchRef.current.startDist;
        const nextZoom = clampZoom(pinchRef.current.startZoom * ratio);
        // Midpoint in container-local pixels = zoomToPoint anchor (canvas
        // screen space, pre-viewport-transform).
        const rect = container?.getBoundingClientRect();
        const midX =
          (e.touches[0].clientX + e.touches[1].clientX) / 2 - (rect?.left ?? 0);
        const midY =
          (e.touches[0].clientY + e.touches[1].clientY) / 2 - (rect?.top ?? 0);
        canvas.zoomToPoint(new fabric.Point(midX, midY), nextZoom);
        applyZoomToHandles(canvas, nextZoom);
        canvas.requestRenderAll();
        // Sync React state WITHOUT re-centring: the suppress flag makes the
        // zoom effect skip its zoomToPoint(canvasCenter,...) recentre.
        suppressZoomEffectRef.current = true;
        onZoomChangeRef.current?.(nextZoom);
      };
      const onTouchEnd = (e: TouchEvent) => {
        if (e.touches.length < 2) pinchRef.current.active = false;
      };
      container?.addEventListener("touchstart", onTouchStart, { passive: true });
      container?.addEventListener("touchmove", onTouchMove, { passive: false });
      container?.addEventListener("touchend", onTouchEnd, { passive: true });
      container?.addEventListener("touchcancel", onTouchEnd, { passive: true });

      const ro = new ResizeObserver(() => {
        if (fabricRef.current !== canvas) return;
        const el = containerRef.current;
        if (!el) return;
        const w = el.clientWidth;
        const h = el.clientHeight;
        if (w === 0 || h === 0) return;
        const isInitialFit = fittedRef.current === null;
        canvas.setDimensions({ width: w, height: h });
        if (isInitialFit) {
          renderFlavorRef.current();
          return;
        }
        // Phase 13 Subtask 8: re-fit the chocolate on resize ONLY when
        // the user is still at the identity viewport (no manual zoom or
        // pan). This re-centres the chocolate when LeftPanel / RightPanel
        // mount on stage transition or collapse / expand. Once the user
        // has manually zoomed or panned (vpt diverges from identity), the
        // chocolate is frozen in place — their pan/zoom is the source of
        // truth and overwriting it would feel like the canvas snapping
        // out from under them.
        //
        // Phase 10.5 trade-off: if the user places objects, then toggles
        // a panel, the centroid-delta translation inside renderFlavor
        // moves the user objects with the chocolate. An undo across
        // that boundary will restore objects to pre-resize coords and
        // they'll appear misaligned with the chocolate — acceptable for
        // the demo because the alternative (chocolate stuck off-centre
        // after every panel collapse) is more visible to a buyer.
        const vpt = canvas.viewportTransform;
        const atIdentity =
          !!vpt &&
          vpt[0] === 1 &&
          vpt[1] === 0 &&
          vpt[2] === 0 &&
          vpt[3] === 1 &&
          vpt[4] === 0 &&
          vpt[5] === 0;
        if (atIdentity) {
          renderFlavorRef.current();
        } else {
          canvas.requestRenderAll();
        }
      });
      ro.observe(containerRef.current);

      return () => {
        ro.disconnect();
        container?.removeEventListener("touchstart", onTouchStart);
        container?.removeEventListener("touchmove", onTouchMove);
        container?.removeEventListener("touchend", onTouchEnd);
        container?.removeEventListener("touchcancel", onTouchEnd);
        canvas.dispose();
        fabricRef.current = null;
        onCanvasMountRef.current?.(null);
      };
    }, []);

    /* -------------------------------------------------------------- */
    /* Re-render full flavor when shape / flavor / material changes.  */
    /* Note: deps key on activeFlavor.id (NOT the whole object) so the */
    /* expensive bg reload doesn't fire on every dev-mode point edit. */
    /* Point/safeZone changes refresh via the toggle effect below.    */
    /* -------------------------------------------------------------- */
    useEffect(() => {
      renderFlavor();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeFlavor.id, activeMaterial, shapeConfig.id]);

    /* -------------------------------------------------------------- */
    /* Refresh ONLY guide layers when toggles, points, or zoom change */
    /* (no bg reload). Including activeFlavor.safeZone.points covers  */
    /* both edits-from-DevPanel and any other state-driven changes.   */
    /* -------------------------------------------------------------- */
    useEffect(() => {
      refreshGuides();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      // shadowIntensity is intentionally NOT in this list. Sliding the
      // slider should not trigger refreshGuides (which strips + re-adds
      // every guide layer); the dedicated shadow-intensity effect below
      // mutates existing shadow polygons' fill in place. Mode IS here
      // because different modes produce different polygon sets.
      showSafeZone, shadowMode, showFront, showFoldLines, safeZoneColor,
      safeZoneStroke, showTexture, textureScale, backgroundColor,
      editingMode, gridStep, zoomLevel, activeFlavor.safeZone.points,
    ]);

    /* -------------------------------------------------------------- */
    /* Dev: add/strip point handles when editingMode toggles          */
    /* -------------------------------------------------------------- */
    useEffect(() => {
      const canvas = fabricRef.current;
      const fitted = fittedRef.current;
      if (!canvas || !fitted) return;

      canvas
        .getObjects()
        .filter((o) => isLayer(o, LAYER.point))
        .forEach((o) => canvas.remove(o));

      if (editingMode && activeFlavor.safeZone.points.length > 0) {
        addPointHandles(canvas, fitted, activeFlavor.safeZone.points, zoomLevel);
        restackLayers(canvas);
      }
      canvas.requestRenderAll();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editingMode]);

    /* -------------------------------------------------------------- */
    /* Dev: viewport zoom (slider 0.5×–8×). zoomToPoint sets absolute */
    /* zoom anchored at the screen-space point passed in — using the  */
    /* canvas center as that point preserves whatever pan the user    */
    /* already applied (their visible center stays at the visible     */
    /* center). Do NOT reset viewportTransform here; that's what was  */
    /* snapping the view back to origin on every zoom change.         */
    /* Reset View button on DevPanel calls resetView() for an explicit */
    /* identity-transform reset.                                       */
    /* -------------------------------------------------------------- */
    useEffect(() => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      // Pinch-zoom already applied a midpoint-anchored transform and merely
      // synced this prop for the readout; re-centring here would yank the
      // view back to the canvas centre. Consume the flag once and bail.
      if (suppressZoomEffectRef.current) {
        suppressZoomEffectRef.current = false;
        return;
      }
      const cw = canvas.getWidth();
      const ch = canvas.getHeight();
      canvas.zoomToPoint(new fabric.Point(cw / 2, ch / 2), zoomLevel);
      applyZoomToHandles(canvas, zoomLevel);
      canvas.requestRenderAll();
    }, [zoomLevel]);

    /* -------------------------------------------------------------- */
    /* Reapply selection-control geometry to existing user objects    */
    /* whenever the user changes the size preset. Walks the user-     */
    /* tagged subset (filtered by getBuilderId) so guides and bg are  */
    /* untouched.                                                     */
    /* -------------------------------------------------------------- */
    useEffect(() => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      for (const obj of canvas.getObjects()) {
        if (getBuilderId(obj)) {
          applyMobileFriendlyControls(obj, controlSize);
        }
      }
      canvas.requestRenderAll();
    }, [controlSize]);

    /* -------------------------------------------------------------- */
    /* Live shadow intensity. Mutates existing shadow polygons' fill  */
    /* in place instead of going through refreshGuides — that path    */
    /* strips + re-adds objects, which produced a frame where         */
    /* shadows were absent and let the slider read non-deterministic. */
    /* Mode-shape changes (right ↔ front ↔ off) still go through the  */
    /* toggle effect so the polygon set itself is correct.            */
    /* -------------------------------------------------------------- */
    useEffect(() => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      if (shadowMode === "off") return;
      const I = Math.max(0, Math.min(1, shadowIntensity));
      let dirty = false;
      for (const obj of canvas.getObjects()) {
        let alpha: number | null = null;
        if (isLayer(obj, LAYER.shadowFront)) {
          alpha = shadowMode === "right" ? I * 0.5 : 0;
        } else if (isLayer(obj, LAYER.sideL)) {
          alpha = shadowMode === "right" ? I : I * 0.8;
        } else if (isLayer(obj, LAYER.sideR)) {
          alpha = shadowMode === "front" ? I * 0.8 : 0;
        }
        if (alpha !== null) {
          obj.fill = `rgba(0,0,0,${alpha.toFixed(3)})`;
          dirty = true;
        }
      }
      if (dirty) canvas.requestRenderAll();
    }, [shadowIntensity, shadowMode]);

    /* -------------------------------------------------------------- */
    /* Live texture opacity. The full render path (renderFlavor /     */
    /* refreshGuides) reloads the texture image; this effect just     */
    /* nudges the existing rect's opacity so the user gets snappy     */
    /* feedback when dragging the LeftPanel input without a re-fetch. */
    /* -------------------------------------------------------------- */
    useEffect(() => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const target = canvas
        .getObjects()
        .find((o) => isLayer(o, LAYER.texture));
      if (!target) return;
      target.opacity = Math.max(0, Math.min(1, textureOpacity / 100));
      canvas.requestRenderAll();
    }, [textureOpacity]);

    /* -------------------------------------------------------------- */
    /* Read-only / interactive toggle. When the parent flips us into   */
    /* setup stage we lock canvas.selection + every tagged user object */
    /* (filtered via getBuilderId so guide/system layers stay locked   */
    /* the way they always were). When we flip back to design we       */
    /* restore selectable/evented + emit a cleared selection so the    */
    /* RightPanel reflects "no selection" until the user clicks.       */
    /* -------------------------------------------------------------- */
    useEffect(() => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      canvas.selection = interactive;
      for (const obj of canvas.getObjects()) {
        if (!getBuilderId(obj)) continue;
        obj.selectable = interactive;
        obj.evented = interactive;
      }
      if (!interactive) {
        canvas.discardActiveObject();
        onActiveTextChangeRef.current?.(null);
        onActiveObjectChangeRef.current?.(null);
      }
      canvas.requestRenderAll();
    }, [interactive]);

    /* -------------------------------------------------------------- */
    /* Imperative API                                                 */
    /* -------------------------------------------------------------- */
    useImperativeHandle(
      ref,
      () => ({
        addLogo: (url, safeZone, displayName) =>
          new Promise<void>((resolve) => {
            const canvas = fabricRef.current;
            const fitted = fittedRef.current;
            if (!canvas || !fitted) {
              resolve();
              return;
            }
            fabric.Image.fromURL(
              url,
              (img) => {
                if (fabricRef.current !== canvas) {
                  resolve();
                  return;
                }
                if (!img.width || !img.height) {
                  resolve();
                  return;
                }
                const c = frontFaceCentroidOnCanvas(safeZone.points, fitted);
                // Logo target width derives from the BRANDING zone (front
                // face), not the full rubber band — sizing to the wrap
                // would scale the logo across the side faces too, where it
                // would now be clipped anyway.
                const brandingZone = getBrandingZone(safeZone);
                const bbWidth = bboxWidthOnCanvas(brandingZone.points, fitted);
                const targetWidth = bbWidth * 0.6;
                const scale = targetWidth / img.width;

                img.set({
                  left: c.x,
                  top: c.y,
                  scaleX: scale,
                  scaleY: scale,
                  originX: "center",
                  originY: "center",
                  selectable: true,
                  evented: true,
                  hasRotatingPoint: false,
                  lockRotation: true,
                });
                img.clipPath = makeUserObjectClipPath(
                  activeFlavorRef.current,
                  fitted
                );
                applyMobileFriendlyControls(img, controlSizeRef.current);
                // Prefer the caller-supplied display name (the original
                // File.name from the upload picker) so the LeftPanel
                // layer list shows "acme-logo" instead of the random
                // Supabase storage filename.
                tagBuilderObject(
                  img,
                  makeBuilderId(),
                  displayName ?? filenameFromUrl(url)
                );
                // Stash the source URL so getDesignElements can hand it to
                // the designer payload. Custom prop, runtime-only — fabric
                // serialization doesn't need to round-trip it.
                (img as unknown as { sourceUrl: string }).sourceUrl = url;
                canvas.add(img);
                canvas.setActiveObject(img);
                restackLayers(canvas);
                canvas.requestRenderAll();
                resolve();
              },
              { crossOrigin: "anonymous" }
            );
          }),

        addText: async (safeZone, defaults) => {
          const canvas = fabricRef.current;
          const fitted = fittedRef.current;
          if (!canvas || !fitted) return;

          // Wait for the requested font so Fabric measures with correct metrics.
          try {
            await document.fonts.load(`${defaults.fontSize}px ${defaults.fontFamily}`);
          } catch {
            /* ignored — fall through and accept fallback metrics */
          }

          const c = frontFaceCentroidOnCanvas(safeZone.points, fitted);
          // Phase 10 Subtask 6: fabric.Textbox replaces IText. Textbox
          // has a fixed `width` and wraps text inside the box, which
          // makes textAlign visibly affect the text (the IText "auto-
          // shrink to content" workaround is no longer needed). Box
          // width sized to ~half the branding zone — leaves room for
          // the user to widen via the side handles.
          const brandingZone = getBrandingZone(safeZone);
          const initialBoxWidth = Math.max(
            120,
            bboxWidthOnCanvas(brandingZone.points, fitted) * 0.5
          );
          const text = new fabric.Textbox(defaults.text ?? "Ваш текст", {
            left: c.x,
            top: c.y,
            originX: "center",
            originY: "center",
            width: initialBoxWidth,
            fontFamily: defaults.fontFamily,
            fontSize: defaults.fontSize,
            fill: defaults.fill,
            // Explicit no-stroke. Fabric's default is strokeWidth:1 with
            // stroke:null — that reads as `strokeApplied=true` to the
            // RightPanel and makes the Stroke section expand by default.
            stroke: undefined,
            strokeWidth: 0,
            editable: true,
            selectable: true,
            evented: true,
            hasRotatingPoint: false,
            lockRotation: true,
          });
          // Clip user text to the branding zone (front face on
          // chocolates; compound left+right zones on the greeting card)
          // so it can't wrap onto the side faces or the card fold strip.
          text.clipPath = makeUserObjectClipPath(
            activeFlavorRef.current,
            fitted
          );
          applyMobileFriendlyControls(text, controlSizeRef.current);
          const textId = makeBuilderId();
          tagBuilderObject(text, textId, null);
          canvas.add(text);
          canvas.setActiveObject(text);
          restackLayers(canvas);
          canvas.requestRenderAll();
          const textProps = readActiveTextProps(text);
          onActiveTextChangeRef.current?.(textProps);
          onActiveObjectChangeRef.current?.({
            id: textId,
            kind: "text",
            text: textProps,
          });
        },

        updateActiveText: (patch) => {
          const canvas = fabricRef.current;
          if (!canvas) return;
          const obj = canvas.getActiveObject();
          if (!obj || obj.type !== "textbox") return;
          const it = obj as fabric.Textbox;

          if (patch.fontFamily !== undefined) {
            document.fonts
              .load(`${it.fontSize ?? 32}px ${patch.fontFamily}`)
              .catch(() => {});
            it.set("fontFamily", patch.fontFamily);
          }
          if (patch.fontSize !== undefined) it.set("fontSize", patch.fontSize);
          if (patch.fontWeight !== undefined) it.set("fontWeight", patch.fontWeight);
          if (patch.fontStyle !== undefined) {
            // @types/fabric narrows fontStyle to a literal union; the
            // patch type is broader (raw string from the toggle) so we
            // cast through unknown.
            (it as unknown as { set: (k: string, v: unknown) => void }).set(
              "fontStyle",
              patch.fontStyle
            );
          }
          if (patch.lineHeight !== undefined) {
            it.set("lineHeight", patch.lineHeight);
          }
          if (patch.charSpacing !== undefined) {
            it.set("charSpacing", patch.charSpacing);
          }
          if (patch.fill !== undefined) it.set("fill", patch.fill);
          if (patch.textAlign !== undefined) {
            // Phase 10: Textbox honours textAlign within its fixed
            // box width — no manual width-stretch hack required.
            it.set("textAlign", patch.textAlign);
            (it as unknown as { dirty: boolean }).dirty = true;
            it.setCoords();
          }
          if (patch.opacity !== undefined) it.set("opacity", patch.opacity);
          // Stroke width 0 means "no stroke" — also clear the color so Fabric
          // doesn't paint a 0-width invisible stroke that still affects bbox.
          // @types/fabric ^5.3 types `set("stroke", v)` as string-only, but
          // fabric accepts null at runtime to clear the stroke. Cast to bypass.
          const setStroke = (value: string | null) =>
            (it as unknown as { set: (k: string, v: unknown) => void }).set(
              "stroke",
              value
            );
          if (patch.strokeWidth !== undefined) {
            it.set("strokeWidth", patch.strokeWidth);
            if (patch.strokeWidth === 0) setStroke(null);
          }
          if (patch.stroke !== undefined) setStroke(patch.stroke);

          canvas.requestRenderAll();
          const textProps = readActiveTextProps(it);
          onActiveTextChangeRef.current?.(textProps);
          const id = getBuilderId(it);
          if (id) {
            onActiveObjectChangeRef.current?.({
              id,
              kind: "text",
              text: textProps,
            });
          }
        },

        alignActiveObject: (axis, mode) => {
          const canvas = fabricRef.current;
          const fitted = fittedRef.current;
          if (!canvas || !fitted) return;
          const obj = canvas.getActiveObject();
          if (!obj || isAnyLayer(obj)) return;

          // Snap to the BRANDING-zone bbox (front face) for chocolates,
          // or the FULL card outline (safeZone bbox) for the greeting
          // card. Phase 23 Subtask 5: greeting card placement is now
          // unrestricted — user content can land anywhere on the card
          // including the fold strip and ribbon-hole columns — so
          // alignment targets the full card bbox to match.
          const flavor = activeFlavorRef.current;
          const alignPoints =
            flavor.brandingZones && flavor.brandingZones.length > 0
              ? flavor.safeZone.points
              : getBrandingZone(flavor.safeZone).points;
          const sz = safeZoneBboxOnCanvas(alignPoints, fitted);
          // Use absolute=true so getBoundingRect returns canvas-space coords
          // (matches the safe-zone bbox space). calculate=true forces a fresh
          // computation in case setCoords hasn't run since the last mutation.
          const r = obj.getBoundingRect(true, true);

          if (axis === "horizontal") {
            const currentCenter = r.left + r.width / 2;
            let nextCenter: number;
            if (mode === "start") nextCenter = sz.left + r.width / 2;
            else if (mode === "end") nextCenter = sz.right - r.width / 2;
            else nextCenter = (sz.left + sz.right) / 2;
            // Translate by delta — works regardless of originX (the bbox and
            // the object move by the same amount).
            obj.left = (obj.left ?? 0) + (nextCenter - currentCenter);
          } else {
            const currentCenter = r.top + r.height / 2;
            let nextCenter: number;
            if (mode === "start") nextCenter = sz.top + r.height / 2;
            else if (mode === "end") nextCenter = sz.bottom - r.height / 2;
            else nextCenter = (sz.top + sz.bottom) / 2;
            obj.top = (obj.top ?? 0) + (nextCenter - currentCenter);
          }

          obj.setCoords();
          canvas.requestRenderAll();

          // Fire object:modified so the history hook records the new
          // position. Direct property assignment doesn't fire events on its
          // own; mirroring the user-drag drop event is the cleanest way to
          // make snap-to-edge appear in undo / redo.
          obj.fire("modified");
          canvas.fire("object:modified", { target: obj });

          // Re-emit active info so the right panel reflects any prop the
          // panel happens to read off position (none today, but keeps the
          // emit-on-mutation pattern consistent).
          const id = getBuilderId(obj);
          if (id) {
            if (obj.type === "textbox") {
              onActiveObjectChangeRef.current?.({
                id,
                kind: "text",
                text: readActiveTextProps(obj as fabric.Textbox),
              });
            } else if (obj.type === "image") {
              onActiveObjectChangeRef.current?.({
                id,
                kind: "image",
                image: readActiveImageProps(obj),
              });
            }
          }
        },

        updateActiveImage: (patch) => {
          const canvas = fabricRef.current;
          if (!canvas) return;
          const obj = canvas.getActiveObject();
          if (!obj || obj.type !== "image") return;

          if (patch.opacity !== undefined) obj.set("opacity", patch.opacity);
          if (patch.angle !== undefined) {
            obj.set("angle", patch.angle);
            obj.setCoords();
          }

          canvas.requestRenderAll();
          const imageProps = readActiveImageProps(obj);
          const id = getBuilderId(obj);
          if (id) {
            onActiveObjectChangeRef.current?.({
              id,
              kind: "image",
              image: imageProps,
            });
          }
        },

        deleteActive: () => {
          const canvas = fabricRef.current;
          if (!canvas) return;
          const obj = canvas.getActiveObject();
          if (!obj) return;
          canvas.remove(obj);
          canvas.discardActiveObject();
          canvas.requestRenderAll();
          onActiveTextChangeRef.current?.(null);
          onActiveObjectChangeRef.current?.(null);
        },

        resetView: () => {
          const canvas = fabricRef.current;
          if (!canvas) return;
          canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
          canvas.requestRenderAll();
        },

        selectById: (id) => {
          const canvas = fabricRef.current;
          if (!canvas) return;
          const target = canvas
            .getObjects()
            .find((o) => getBuilderId(o) === id);
          if (!target) return;
          canvas.setActiveObject(target);
          canvas.requestRenderAll();
        },

        deleteById: (id) => {
          const canvas = fabricRef.current;
          if (!canvas) return;
          const target = canvas
            .getObjects()
            .find((o) => getBuilderId(o) === id);
          if (!target) return;
          const wasActive = canvas.getActiveObject() === target;
          canvas.remove(target);
          if (wasActive) {
            canvas.discardActiveObject();
            onActiveTextChangeRef.current?.(null);
            onActiveObjectChangeRef.current?.(null);
          }
          canvas.requestRenderAll();
        },

        bringForwardById: (id) => {
          const canvas = fabricRef.current;
          if (!canvas) return;
          const target = canvas
            .getObjects()
            .find((o) => getBuilderId(o) === id);
          if (!target) return;
          target.bringForward();
          // Restack pins guides above user objects again, then re-emit so
          // the layers list reflects the new order in the user subset.
          restackLayers(canvas);
          canvas.requestRenderAll();
          const layers = canvas
            .getObjects()
            .filter((o) => !isAnyLayer(o))
            .map(toBuilderLayer)
            .filter((l): l is BuilderLayer => l !== null);
          onLayersChangeRef.current?.(layers);
        },

        sendBackwardsById: (id) => {
          const canvas = fabricRef.current;
          if (!canvas) return;
          const target = canvas
            .getObjects()
            .find((o) => getBuilderId(o) === id);
          if (!target) return;
          target.sendBackwards();
          restackLayers(canvas);
          canvas.requestRenderAll();
          const layers = canvas
            .getObjects()
            .filter((o) => !isAnyLayer(o))
            .map(toBuilderLayer)
            .filter((l): l is BuilderLayer => l !== null);
          onLayersChangeRef.current?.(layers);
        },

        applyUserObjectControls: (obj) => {
          const fitted = fittedRef.current;
          if (fitted) {
            // Re-clip to the branding zone after history restore — same
            // semantic as fresh add via addLogo / addText. Compound path
            // for the greeting card (per-side quads), single front-face
            // polygon for chocolates.
            obj.clipPath = makeUserObjectClipPath(
              activeFlavorRef.current,
              fitted
            );
          }
          applyMobileFriendlyControls(obj, controlSizeRef.current);
        },

        getUserObjects: () => {
          const canvas = fabricRef.current;
          if (!canvas) return [];
          // `sourceUrl` is preserved so per-side buckets (greeting card)
          // can be converted to SubmissionDesignElement[] for the email
          // payload — `serializedToDesignElements` reads it back as the
          // image element's URL.
          return canvas
            .getObjects()
            .filter((o) => Boolean(getBuilderId(o)))
            .map((o) =>
              (o as unknown as {
                toObject: (props: string[]) => unknown;
              }).toObject(["__bid", "__bname", "sourceUrl"])
            );
        },

        replaceUserObjects: (serialized) => {
          const canvas = fabricRef.current;
          if (!canvas) return;
          canvas.discardActiveObject();
          canvas
            .getObjects()
            .filter((o) => Boolean(getBuilderId(o)))
            .forEach((o) => canvas.remove(o));
          if (!serialized || serialized.length === 0) {
            restackLayers(canvas);
            canvas.requestRenderAll();
            const layers: BuilderLayer[] = [];
            onLayersChangeRef.current?.(layers);
            return;
          }
          fabric.util.enlivenObjects(
            serialized as fabric.Object[],
            (objs: fabric.Object[]) => {
              const fitted = fittedRef.current;
              objs.forEach((obj) => {
                if (fitted) {
                  obj.clipPath = makeUserObjectClipPath(
                    activeFlavorRef.current,
                    fitted
                  );
                }
                applyMobileFriendlyControls(obj, controlSizeRef.current);
                canvas.add(obj);
              });
              restackLayers(canvas);
              canvas.requestRenderAll();
              const layers = canvas
                .getObjects()
                .filter((o) => !isAnyLayer(o))
                .map(toBuilderLayer)
                .filter((l): l is BuilderLayer => l !== null);
              onLayersChangeRef.current?.(layers);
            },
            ""
          );
        },

        replaceUserObjectsAsync: (serialized) => {
          return new Promise((resolve) => {
            const canvas = fabricRef.current;
            if (!canvas) {
              resolve();
              return;
            }
            canvas.discardActiveObject();
            canvas
              .getObjects()
              .filter((o) => Boolean(getBuilderId(o)))
              .forEach((o) => canvas.remove(o));
            const finish = () => {
              restackLayers(canvas);
              canvas.requestRenderAll();
              const layers = canvas
                .getObjects()
                .filter((o) => !isAnyLayer(o))
                .map(toBuilderLayer)
                .filter((l): l is BuilderLayer => l !== null);
              onLayersChangeRef.current?.(layers);
              resolve();
            };
            if (!serialized || serialized.length === 0) {
              finish();
              return;
            }
            fabric.util.enlivenObjects(
              serialized as fabric.Object[],
              (objs: fabric.Object[]) => {
                const fitted = fittedRef.current;
                objs.forEach((obj) => {
                  if (fitted) {
                    obj.clipPath = makeUserObjectClipPath(
                      activeFlavorRef.current,
                      fitted
                    );
                  }
                  applyMobileFriendlyControls(obj, controlSizeRef.current);
                  canvas.add(obj);
                });
                finish();
              },
              ""
            );
          });
        },

        finalizeRestore: () => {
          const canvas = fabricRef.current;
          if (!canvas) return;
          restackLayers(canvas);
          canvas.requestRenderAll();
        },

        exportPreview: async () => {
          const canvas = fabricRef.current;
          if (!canvas) return null;
          const dataUrl = withExportMode(canvas, "mockup", () =>
            canvas.toDataURL({ format: "png", multiplier: 2 })
          );
          try {
            const res = await fetch(dataUrl);
            return await res.blob();
          } catch {
            return null;
          }
        },

        // FUTURE: re-enable when perspective unwarp is implemented.
        // Backlog: front-face quad → flat rectangle PNG for print production.
        // Requires rectangular safe zones in Figma + 4-point quad → rect transform.
        // Currently retained as dead code — `BuilderShell` no longer calls
        // it (download + submission send the mockup only) but the canvas
        // method stays so the unwarp work can plug in without re-plumbing.
        exportFlat: async () => {
          const canvas = fabricRef.current;
          if (!canvas) return null;
          const dataUrl = withExportMode(canvas, "flat", () =>
            canvas.toDataURL({ format: "png", multiplier: 2 })
          );
          try {
            const res = await fetch(dataUrl);
            return await res.blob();
          } catch {
            return null;
          }
        },

        isTextEditing: () => {
          const canvas = fabricRef.current;
          if (!canvas) return false;
          return canvas
            .getObjects()
            .some(
              (o) =>
                o.type === "textbox" &&
                (o as fabric.Textbox).isEditing === true
            );
        },

        getDesignElements: () => {
          const canvas = fabricRef.current;
          if (!canvas) return [];
          const elements: SubmissionDesignElement[] = [];
          for (const obj of canvas.getObjects()) {
            // Guide / dev / paper / shadow layers all carry a `__layer_*`
            // marker via tagging at construction. User objects don't.
            if (isAnyLayer(obj)) continue;

            if (obj.type === "textbox") {
              const it = obj as fabric.Textbox;
              const align = it.textAlign;
              const textAlign: "left" | "center" | "right" =
                align === "center" || align === "right" ? align : "left";
              // IText scales rather than resizes — multiply the unscaled
              // fontSize by the current scale to report the rendered size.
              // Use scaleX since text typically scales uniformly here
              // (uniform-scale corner controls); fall back to scaleY when
              // scaleX is somehow undefined.
              const scale = it.scaleX ?? it.scaleY ?? 1;
              const baseFontSize = it.fontSize ?? 32;
              const fillRaw =
                typeof it.fill === "string" ? it.fill : null;
              const strokeRaw =
                typeof it.stroke === "string" ? it.stroke : null;
              elements.push({
                kind: "text",
                content: it.text ?? "",
                fontFamily: it.fontFamily ?? "",
                fontSize: Math.round(baseFontSize * scale),
                fontWeight: it.fontWeight ?? "normal",
                fontStyle: it.fontStyle ?? "normal",
                textAlign,
                fillColor: colorToHexAlpha(fillRaw),
                strokeColor: colorToHexAlpha(strokeRaw),
                strokeWidth:
                  typeof it.strokeWidth === "number" ? it.strokeWidth : 0,
                objectOpacity:
                  typeof it.opacity === "number" ? it.opacity : 1,
                lineHeight:
                  typeof it.lineHeight === "number" ? it.lineHeight : 1.16,
                charSpacing:
                  typeof it.charSpacing === "number" ? it.charSpacing : 0,
              });
              continue;
            }

            if (obj.type === "image") {
              const sourceUrl = (
                obj as unknown as { sourceUrl?: string }
              ).sourceUrl;
              // Skip images with no recoverable URL — the designer can't
              // do anything with them. addLogo always tags one, so this
              // only happens for legacy / programmatically-added images.
              if (!sourceUrl) continue;
              elements.push({
                kind: "image",
                url: sourceUrl,
                objectOpacity:
                  typeof obj.opacity === "number" ? obj.opacity : 1,
                rotation: typeof obj.angle === "number" ? obj.angle : 0,
              });
              continue;
            }
          }
          return elements;
        },
      }),
      []
    );

    return (
      <div
        ref={containerRef}
        className="relative h-full w-full touch-none select-none"
      >
        <canvas ref={canvasElRef} className="absolute inset-0" />
      </div>
    );
  }
);

export default ConstructorCanvas;

/* ====================================================================== */
/* Helpers                                                                */
/* ====================================================================== */

interface Fitted {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface GuideToggles {
  showSafeZone: boolean;
  shadowMode: ShadowMode;
  shadowIntensity: number;
  showFront: boolean;
  safeZoneColor: SafeZoneColor;
  safeZoneStroke: SafeZoneStroke;
  backgroundColor: string | null;
  editingMode: boolean;
  gridStep: number;
  zoomLevel: number;
}

/**
 * Indices into the 8-point Mini polygon delineating the chocolate's 3D faces:
 *   side L = 0,1,6,7  (left side trapezoid as viewed from camera)
 *   side R = 2,3,4,5  (right side trapezoid)
 *   front  = 1,2,5,6  (front face — where the printed label lives)
 *
 * Only Mini bars are traced with this 3D structure today. Popular and Greeting
 * Card use placeholder rectangles where these indices wouldn't form meaningful
 * trapezoids, so the side/front guides are gated to shape "mini".
 */
const SIDE_L_INDICES = [0, 1, 6, 7];
const SIDE_R_INDICES = [2, 3, 4, 5];
const FRONT_INDICES = [1, 2, 5, 6];

function fitContain(iw: number, ih: number, cw: number, ch: number): number {
  return Math.min(cw / iw, ch / ih);
}

function centroidOnCanvas(points: SafeZonePoint[], fitted: Fitted): { x: number; y: number } {
  let sx = 0;
  let sy = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
  }
  const n = points.length || 1;
  return {
    x: fitted.left + (sx / n) * fitted.width,
    y: fitted.top + (sy / n) * fitted.height,
  };
}

/**
 * Centroid of just the front face (points 1, 2, 5, 6) for 8-point polygons.
 * The side trapezoid widths vary slightly between flavors, which shifts the
 * all-8-point centroid even when the printable front face is identical —
 * front-face-only centroid is the stable reference for positioning user
 * objects across flavor swaps.
 *
 * Falls back to all-points centroid for non-8-point polygons (e.g. 4-point
 * greeting-card placeholder), where there's no separable "front face".
 */
function frontFaceCentroidOnCanvas(
  points: SafeZonePoint[],
  fitted: Fitted
): { x: number; y: number } {
  if (points.length === 8) {
    return centroidOnCanvas(
      [points[1], points[2], points[5], points[6]],
      fitted
    );
  }
  return centroidOnCanvas(points, fitted);
}

function bboxWidthOnCanvas(points: SafeZonePoint[], fitted: Fitted): number {
  if (points.length === 0) return 0;
  let minX = Infinity;
  let maxX = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
  }
  return (maxX - minX) * fitted.width;
}

/**
 * Axis-aligned bounding box of the safe-zone polygon in canvas coords.
 * Used by `alignActiveObject` to snap user objects to the polygon's bbox
 * regardless of the polygon's actual edge geometry — alignment in design
 * tools always operates on the bbox, not on the silhouette.
 */
function safeZoneBboxOnCanvas(
  points: SafeZonePoint[],
  fitted: Fitted
): { left: number; right: number; top: number; bottom: number } {
  if (points.length === 0) {
    return {
      left: fitted.left,
      right: fitted.left + fitted.width,
      top: fitted.top,
      bottom: fitted.top + fitted.height,
    };
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return {
    left: fitted.left + minX * fitted.width,
    right: fitted.left + maxX * fitted.width,
    top: fitted.top + minY * fitted.height,
    bottom: fitted.top + maxY * fitted.height,
  };
}

/**
 * Canva-style selection styling for user-added objects (logos, text).
 *
 * Fabric's defaults give ~13 px square corner handles — unhittable on phones,
 * which is why pinch-to-resize was the only mobile path before and it's
 * unreliable on iOS Safari. Circular handles + a separate, larger touch hit
 * area (`touchCornerSize`) make corner-drag the primary resize gesture,
 * matching Canva.
 *
 * Three size tiers (`small` / `medium` / `large`) are available so buyers
 * can opt up if the default 10 px handles feel too fiddly on touch screens.
 *
 * Rotation is enabled with a 15° snap. The mtr (rotation) handle is
 * shown and the lockRotation / hasRotatingPoint flags on the object are
 * unlocked to match. snapAngle is per-object so different shapes can have
 * different snap behaviour later if needed.
 *
 * A custom close control is registered on the per-object `controls` map at
 * the top-right corner of the bounding box, offset upward so it sits OUTSIDE
 * the box (matching Figma / Canva). Clicking it removes the object — same
 * pathway as the layers-panel delete, both UI hooks remain functional.
 */
function applyMobileFriendlyControls(obj: fabric.Object, controlSize: ControlSize) {
  const sizes = CONTROL_SIZE_PRESETS[controlSize];
  obj.set({
    cornerSize: sizes.cornerSize,
    cornerStyle: "circle",
    cornerColor: "#ffffff",
    cornerStrokeColor: "#1a1a1a",
    transparentCorners: false,
    borderColor: "#1a1a1a",
    borderScaleFactor: 1.5,
    padding: 4,
    lockRotation: false,
    hasRotatingPoint: true,
    snapAngle: 15,
  });
  // touchCornerSize is supported at runtime by Fabric ≥ 4 but missing from
  // @types/fabric ^5.3. Assign directly to bypass the type gap.
  (obj as unknown as { touchCornerSize: number }).touchCornerSize =
    sizes.touchCornerSize;
  obj.setControlsVisibility({ mtr: true });

  // Close button — anchored at top-right (x: 0.5, y: -0.5 in fabric's
  // bbox-relative coords), pulled further up via offsetY so it floats
  // OUTSIDE the bounding box. Fabric's @types are vague around custom
  // controls, so we cast at the construction site.
  //
  // Phase 14 Subtask 5: for fabric.Textbox we MUST clone Textbox's own
  // controls map — not Object's — because Textbox overrides the ml / mr
  // controls with handlers that update `width` directly (so dragging the
  // side handles re-flows text without changing fontSize). Using
  // Object.prototype.controls silently degraded those handles to scaleX
  // mutations, which is why "resize box" mode behaved like another
  // scaling mode in Phase 13.
  const isTextbox = obj.type === "textbox";
  const proto = isTextbox
    ? (
        fabric.Textbox.prototype as unknown as {
          controls: Record<string, unknown>;
        }
      ).controls
    : (
        fabric.Object.prototype as unknown as {
          controls: Record<string, unknown>;
        }
      ).controls;
  const FabricControl = (
    fabric as unknown as {
      Control: new (opts: Record<string, unknown>) => unknown;
    }
  ).Control;
  const close = new FabricControl({
    x: 0.5,
    y: -0.5,
    offsetY: -(sizes.closeRadius + 8),
    cursorStyle: "pointer",
    actionName: "delete",
    mouseUpHandler: (
      _eventData: unknown,
      transform: { target: fabric.Object }
    ): boolean => {
      const target = transform.target;
      const targetCanvas = target.canvas;
      if (!targetCanvas) return false;
      targetCanvas.remove(target);
      targetCanvas.discardActiveObject();
      targetCanvas.requestRenderAll();
      return true;
    },
    render: (
      ctx: CanvasRenderingContext2D,
      left: number,
      top: number
    ) => drawCloseControlIcon(ctx, left, top, sizes.closeRadius),
    cornerSize: sizes.closeRadius * 2,
  });
  const controls: Record<string, unknown> = {
    ...proto,
    deleteObj: close,
  };

  // Phase 13 Subtask 7: Textbox gets a second custom control at top-LEFT
  // that toggles between "scale" mode (corners scale text+box uniformly,
  // side-middle handles disabled) and "resize-box" mode (only ml/mr
  // visible, drag adjusts box width and text wraps inside without
  // changing font size). Mode is stored on the object as `boxResizeMode`
  // so it persists per-text and round-trips through fabric clone if the
  // history hook ever serialises it (currently it doesn't — the runtime
  // flag is recreated by `applyUserObjectControls` on restore).
  if (isTextbox) {
    const tagged = obj as fabric.Textbox & { boxResizeMode?: boolean };
    if (tagged.boxResizeMode === undefined) tagged.boxResizeMode = false;
    applyTextboxControlVisibility(tagged);
    const toggle = new FabricControl({
      x: -0.5,
      y: -0.5,
      offsetY: -(sizes.closeRadius + 8),
      cursorStyle: "pointer",
      actionName: "boxToggle",
      mouseUpHandler: (
        _eventData: unknown,
        transform: { target: fabric.Object }
      ): boolean => {
        const target = transform.target as fabric.Textbox & {
          boxResizeMode?: boolean;
        };
        target.boxResizeMode = !target.boxResizeMode;
        applyTextboxControlVisibility(target);
        target.canvas?.requestRenderAll();
        return true;
      },
      render: (
        ctx: CanvasRenderingContext2D,
        left: number,
        top: number,
        _style: unknown,
        target: fabric.Object
      ) =>
        drawBoxToggleIcon(
          ctx,
          left,
          top,
          sizes.closeRadius,
          ((target as { boxResizeMode?: boolean }).boxResizeMode ?? false)
        ),
      cornerSize: sizes.closeRadius * 2,
    });
    controls.boxToggle = toggle;
  }

  (obj as unknown as { controls: Record<string, unknown> }).controls = controls;
}

/**
 * Apply the per-mode handle visibility for a Textbox. Scale mode shows
 * corner handles only (uniform scale of text + box); resize-box mode
 * shows only the side-middle handles (ml/mr — width drag with text
 * wrapping). mtr (rotation) stays visible in both modes.
 */
function applyTextboxControlVisibility(
  textbox: fabric.Textbox & { boxResizeMode?: boolean }
) {
  // Phase 15 Subtask 5: in BOTH modes the user sees the same 8 handles
  // (4 corners + 2 side-middle + rotation). Mode behavior diverges in
  // the canvas's `object:modified` listener — scale mode bakes scaleX
  // into fontSize (text grows), resize mode bakes scaleX/scaleY into
  // width/height (text wraps without changing fontSize). Hiding mt/mb
  // because Textbox height auto-derives from text content.
  void textbox.boxResizeMode; // mode read at scaling time, not here
  textbox.setControlsVisibility({
    tl: true,
    tr: true,
    bl: true,
    br: true,
    ml: true,
    mr: true,
    mt: false,
    mb: false,
    mtr: true,
  });
}

/**
 * Draw the close-button icon: white-filled circle, dark stroke, X mark.
 * Used as the `render` function for the per-object delete fabric.Control.
 */
function drawCloseControlIcon(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  radius: number
) {
  ctx.save();
  ctx.translate(left, top);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#1a1a1a";
  ctx.stroke();
  const arm = radius * 0.45;
  ctx.beginPath();
  ctx.moveTo(-arm, -arm);
  ctx.lineTo(arm, arm);
  ctx.moveTo(arm, -arm);
  ctx.lineTo(-arm, arm);
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw the Textbox box-resize-mode toggle icon. The button is a circle of
 * the same dimensions as the close-x; the inverted fill on resize mode
 * gives the user an unmistakable visual diff between the two modes.
 *   • scale mode (default): white fill, "T" glyph (signals "drag scales
 *     the text").
 *   • resize-box mode:      dark fill, "↔" glyph (signals "drag resizes
 *     the box width, text wraps").
 */
function drawBoxToggleIcon(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  radius: number,
  isResizeMode: boolean
) {
  ctx.save();
  ctx.translate(left, top);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = isResizeMode ? "#1a1a1a" : "#ffffff";
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#1a1a1a";
  ctx.stroke();
  ctx.fillStyle = isResizeMode ? "#ffffff" : "#1a1a1a";
  ctx.font = `700 ${Math.round(radius * 1.15)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(isResizeMode ? "↔" : "T", 0, 1);
  ctx.restore();
}

/**
 * State subset needed to build the point-dependent polygon guides
 * (paper band + shadow polygons + front-face stroke). Used both by the
 * full-render path (addGuideLayers) and the imperative drag path
 * (rebuildPointDependentGuides) so the rendering rules stay in one place.
 */
interface PolygonGuideState {
  showSafeZone: boolean;
  safeZoneColor: SafeZoneColor;
  safeZoneStroke: SafeZoneStroke;
  shadowMode: ShadowMode;
  shadowIntensity: number;
  showFront: boolean;
  /**
   * Single wrapper colour. Drives the LAYER.paper polygon fill (multiply
   * blend over the chocolate photo) — there is no longer a separate
   * front-face background polygon. null = fall back to the safe-zone
   * preset's translucent-white default.
   */
  backgroundColor: string | null;
  shapeId: string;
  /** Used to inverse-scale stroke widths so lines stay hairline at any zoom. */
  zoomLevel: number;
}

/**
 * Draw the polygon guides that depend on safe-zone point positions:
 * the dashed paper band, the directional 3D shadows, and the front-face
 * indicator. Caller is responsible for stripping any prior copies of these
 * layers and for calling restackLayers() afterwards.
 */
function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function addPolygonGuides(
  canvas: fabric.Canvas,
  fitted: Fitted,
  points: SafeZonePoint[],
  state: PolygonGuideState
) {
  const supports3DGuides = state.shapeId === "mini" && points.length === 8;

  // Paper polygon always renders so backgroundColor edits stay visible.
  // The dashed safe-zone outline is the only thing showSafeZone gates
  // now — see makePaperBand's `showStroke` param.
  canvas.add(
    makePaperBand(
      { points },
      fitted,
      state.safeZoneColor,
      state.safeZoneStroke,
      state.zoomLevel,
      state.backgroundColor,
      state.showSafeZone
    )
  );
  // (Phase 8: the legacy LAYER.background front-face polygon was dropped.
  // backgroundColor now flows through the paper polygon above — single
  // wrapper-color concept.)
  if (state.shadowMode !== "off" && supports3DGuides) {
    // intensity drives the master alpha; per-face fractions encode the
    // light-direction asymmetry. At intensity = 1.0 the strongest face hits
    // alpha = 1 (fully opaque) so we can verify polygons render at all.
    const I = clamp01(state.shadowIntensity);
    if (state.shadowMode === "right") {
      // Right side lit (no overlay), front mid, left deepest.
      canvas.add(
        makeSubPolygon(points, FRONT_INDICES, fitted, LAYER.shadowFront, {
          fill: `rgba(0,0,0,${(I * 0.5).toFixed(3)})`,
        })
      );
      canvas.add(
        makeSubPolygon(points, SIDE_L_INDICES, fitted, LAYER.sideL, {
          fill: `rgba(0,0,0,${I.toFixed(3)})`,
        })
      );
    } else {
      // shadowMode === "front": front lit, both sides equally shadowed.
      const sideAlpha = (I * 0.8).toFixed(3);
      canvas.add(
        makeSubPolygon(points, SIDE_L_INDICES, fitted, LAYER.sideL, {
          fill: `rgba(0,0,0,${sideAlpha})`,
        })
      );
      canvas.add(
        makeSubPolygon(points, SIDE_R_INDICES, fitted, LAYER.sideR, {
          fill: `rgba(0,0,0,${sideAlpha})`,
        })
      );
    }
  }
  if (state.showFront && supports3DGuides) {
    canvas.add(
      makeSubPolygon(points, FRONT_INDICES, fitted, LAYER.front, {
        fill: "transparent",
        stroke: "rgba(255,200,100,0.65)",
        strokeWidth: 1,
        strokeDashArray: [4, 3],
      })
    );
  }
}

/**
 * Imperative drag-time polygon update. Reads current point-handle positions
 * from the canvas (NOT from React state — state would lag the drag), strips
 * the polygon-dependent guide layers, and re-adds them based on the latest
 * handle positions. Skipped layers: photo bg, texture, grid, point handles
 * themselves, user objects.
 *
 * This is the engine that lets the polygon track the cursor at 60 fps without
 * a React render-storm during drag. State syncs once on `object:modified`.
 */
function rebuildPointDependentGuides(
  canvas: fabric.Canvas,
  fitted: Fitted,
  state: PolygonGuideState
) {
  const handles = canvas
    .getObjects()
    .filter((o) => isLayer(o, LAYER.point))
    .sort(
      (a, b) =>
        ((a as unknown as { pointIndex: number }).pointIndex ?? 0) -
        ((b as unknown as { pointIndex: number }).pointIndex ?? 0)
    );
  if (handles.length === 0) return;

  const points: SafeZonePoint[] = handles.map((h) => ({
    x: ((h.left ?? 0) - fitted.left) / fitted.width,
    y: ((h.top ?? 0) - fitted.top) / fitted.height,
  }));

  const stripKeys: LayerKey[] = [
    LAYER.paper, LAYER.background, LAYER.sideL, LAYER.sideR,
    LAYER.shadowFront, LAYER.front,
  ];
  canvas
    .getObjects()
    .filter((o) => stripKeys.some((k) => isLayer(o, k)))
    .forEach((o) => canvas.remove(o));

  addPolygonGuides(canvas, fitted, points, state);
  restackLayers(canvas);
  canvas.requestRenderAll();
}

function addGuideLayers(
  canvas: fabric.Canvas,
  fitted: Fitted,
  shapeConfig: ShapeConfig,
  activeFlavor: FlavorConfig,
  activeMaterial: MaterialType,
  toggles: GuideToggles
) {
  const isFree = shapeConfig.mode === "free" && activeMaterial === "paper";
  if (!isFree) return;

  addPolygonGuides(canvas, fitted, activeFlavor.safeZone.points, {
    showSafeZone: toggles.showSafeZone,
    safeZoneColor: toggles.safeZoneColor,
    safeZoneStroke: toggles.safeZoneStroke,
    shadowMode: toggles.shadowMode,
    shadowIntensity: toggles.shadowIntensity,
    showFront: toggles.showFront,
    backgroundColor: toggles.backgroundColor,
    shapeId: shapeConfig.id,
    zoomLevel: toggles.zoomLevel,
  });

  // Dev pixel grid — only drawn when screen-step ≥ 4. At 1/2 px the lines
  // would clutter the canvas; snap-on-drop still uses the smaller step
  // invisibly. Spacing is also divided by zoom so the grid LOOKS like the
  // user's chosen step on screen at any zoom level.
  if (toggles.editingMode && toggles.gridStep >= 4) {
    addGridLines(canvas, fitted, toggles.gridStep, toggles.zoomLevel);
  }
}

// Base stroke geometry at zoom 1×; both the stroke width and the dash
// pattern divide by zoom so the polygon outline stays the same physical
// size on screen at any zoom level (matches handles + grid lines).
const PAPER_BAND_STROKE_WIDTH = 1.5;
const PAPER_BAND_DASH = [6, 4] as const;

function makePaperBand(
  safeZone: SafeZone,
  fitted: Fitted,
  color: SafeZoneColor,
  stroke: SafeZoneStroke,
  zoom: number,
  backgroundColor: string | null,
  showStroke: boolean
): fabric.Polygon {
  const preset = SAFE_ZONE_COLOR_PRESETS[color];
  const z = zoom > 0 ? zoom : 1;
  const allIndices = safeZone.points.map((_, i) => i);
  // User-picked wrapper colour overrides the safe-zone preset fill. The
  // dashed outline is the visual safe-zone guide and is the only thing
  // showStroke gates — the colour stays visible even when the user
  // hides the guide outline.
  const fill = backgroundColor ?? preset.fill;
  // Multiply blend (Option A) preserves the chocolate photo's side-face
  // shadow gradients underneath the paper tint. White paper × photo =
  // photo unchanged; coloured paper × photo darkens-with-color so the
  // side shadows stay visible as darker tones of the chosen color.
  return makeSubPolygon(safeZone.points, allIndices, fitted, LAYER.paper, {
    fill,
    globalCompositeOperation: "multiply",
    stroke: showStroke ? preset.stroke : undefined,
    strokeWidth: showStroke ? PAPER_BAND_STROKE_WIDTH / z : 0,
    strokeDashArray:
      showStroke && stroke === "dashed"
        ? [PAPER_BAND_DASH[0] / z, PAPER_BAND_DASH[1] / z]
        : undefined,
  });
}

function makeClipPath(safeZone: SafeZone, fitted: Fitted): fabric.Polygon {
  const absPoints = safeZone.points.map((p) => ({
    x: fitted.left + p.x * fitted.width,
    y: fitted.top + p.y * fitted.height,
  }));
  const clip = new fabric.Polygon(absPoints, {
    originX: "left",
    originY: "top",
  });
  clip.absolutePositioned = true;
  return clip;
}

/**
 * Pick the right clipPath for a flavor's user objects. Chocolates clip
 * to the single front-face polygon derived from the 8-point safe zone.
 * Phase 24 Subtask 3: greeting card clips to the FULL 12-point safe-
 * zone polygon (the card outline). Content can land anywhere INSIDE the
 * card outline — fold strip + ribbon-hole columns are inside the clip,
 * so they're still reachable for buyer freedom — but anything outside
 * the card is clipped.
 */
function makeUserObjectClipPath(
  flavor: FlavorConfig,
  fitted: Fitted
): fabric.Object {
  if (flavor.brandingZones && flavor.brandingZones.length > 0) {
    return makeClipPath(flavor.safeZone, fitted);
  }
  return makeClipPath(getBrandingZone(flavor.safeZone), fitted);
}

interface PolyOpts {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeDashArray?: number[];
  /** Optional canvas blend mode (e.g. "multiply" for the background color). */
  globalCompositeOperation?: GlobalCompositeOperation;
}

/**
 * Build a Polygon from a subset of (or all of) the safe-zone's points.
 *
 * Construction pattern: pass ABSOLUTE canvas-space points to the constructor
 * with NO explicit left/top, and don't call .set({left, top}) afterwards.
 * Fabric auto-derives the bounding box and sets pathOffset correctly when
 * given absolute points alone. The earlier rel-points + .set({left,top})
 * approach left pathOffset stuck at the centroid of the original points,
 * causing the polygon to declare a valid bbox but draw nothing visible.
 */
function makeSubPolygon(
  points: SafeZonePoint[],
  indices: number[],
  fitted: Fitted,
  layerKey: LayerKey,
  opts: PolyOpts
): fabric.Polygon {
  const subset = indices.map((i) => points[i]);
  const abs = subset.map((p) => ({
    x: fitted.left + p.x * fitted.width,
    y: fitted.top + p.y * fitted.height,
  }));

  const poly = new fabric.Polygon(abs, {
    fill: opts.fill ?? "rgba(0,0,0,0)",
    stroke: opts.stroke,
    strokeWidth: opts.strokeWidth,
    strokeDashArray: opts.strokeDashArray,
    globalCompositeOperation: opts.globalCompositeOperation,
    selectable: false,
    evented: false,
    objectCaching: false,
  });
  poly.setCoords();
  (poly as unknown as { layer: LayerKey }).layer = layerKey;
  return poly;
}

/* -------------------------- Dev-only helpers -------------------------- */

// Base sizes (canvas-px at zoom 1×). Both divide by `zoom` so the handle
// stays visually the same size on screen at any zoom level.
const HANDLE_BASE_RADIUS = 5;
const HANDLE_BASE_STROKE = 1;

/**
 * Render a draggable handle for each polygon point. The pointIndex stored on
 * the fabric object is read back inside the canvas's `object:moving` handler
 * so we know which point of the safeZone array to update.
 *
 * Styled as small semi-transparent gray dots with a thin white outline —
 * they don't obscure the photo underneath. Size scales with 1/zoom so
 * physical screen size is constant.
 *
 * Tagged with LAYER.point — NOT a guide layer, so refreshGuides leaves it
 * alone (handles persist across toggle changes during a drag).
 */
function addPointHandles(
  canvas: fabric.Canvas,
  fitted: Fitted,
  points: SafeZonePoint[],
  zoom: number
) {
  const z = zoom > 0 ? zoom : 1;
  points.forEach((p, index) => {
    const handle = new fabric.Circle({
      left: fitted.left + p.x * fitted.width,
      top: fitted.top + p.y * fitted.height,
      radius: HANDLE_BASE_RADIUS / z,
      fill: "rgba(120,120,120,0.6)",
      stroke: "rgba(255,255,255,0.9)",
      strokeWidth: HANDLE_BASE_STROKE / z,
      originX: "center",
      originY: "center",
      hasControls: false,
      hasBorders: false,
      lockRotation: true,
      hoverCursor: "grab",
      moveCursor: "grabbing",
      selectable: true,
      evented: true,
    });
    (handle as unknown as { layer: LayerKey; pointIndex: number }).layer =
      LAYER.point;
    (handle as unknown as { layer: LayerKey; pointIndex: number }).pointIndex =
      index;
    canvas.add(handle);
  });
}

/**
 * Resize existing point handles in place (radius + stroke). Called from the
 * zoom useEffect so handles don't grow/shrink visually with zoom.
 */
function applyZoomToHandles(canvas: fabric.Canvas, zoom: number) {
  const z = zoom > 0 ? zoom : 1;
  canvas
    .getObjects()
    .filter((o) => isLayer(o, LAYER.point))
    .forEach((o) => {
      const c = o as fabric.Circle;
      c.set({
        radius: HANDLE_BASE_RADIUS / z,
        strokeWidth: HANDLE_BASE_STROKE / z,
      });
      c.setCoords();
    });
}

/**
 * Pixel grid over the fitted background area. The user-supplied `screenStep`
 * is interpreted as desired *screen-px* spacing (so a 4 px grid looks 4 px
 * apart on screen at any zoom). Canvas-space spacing is therefore
 * `screenStep / zoom`, which keeps lines visually constant under zoom.
 *
 * Stroke width also scales with 1/zoom so lines remain hairline at any zoom.
 */
function addGridLines(canvas: fabric.Canvas, fitted: Fitted, screenStep: number, zoom: number) {
  const z = zoom > 0 ? zoom : 1;
  const canvasStep = screenStep / z;
  if (canvasStep <= 0) return;
  const stroke = "rgba(0,0,0,0.06)";
  const strokeWidth = 1 / z;
  const lineOpts = { stroke, strokeWidth, selectable: false, evented: false };

  const startX = Math.ceil(fitted.left / canvasStep) * canvasStep;
  const endX = fitted.left + fitted.width;
  for (let x = startX; x <= endX; x += canvasStep) {
    const line = new fabric.Line(
      [x, fitted.top, x, fitted.top + fitted.height],
      lineOpts
    );
    (line as unknown as { layer: LayerKey }).layer = LAYER.grid;
    canvas.add(line);
  }
  const startY = Math.ceil(fitted.top / canvasStep) * canvasStep;
  const endY = fitted.top + fitted.height;
  for (let y = startY; y <= endY; y += canvasStep) {
    const line = new fabric.Line(
      [fitted.left, y, fitted.left + fitted.width, y],
      lineOpts
    );
    (line as unknown as { layer: LayerKey }).layer = LAYER.grid;
    canvas.add(line);
  }
}

/* ---------------------------------------------------------------------- */

/**
 * Load the paper-texture PNG and add it as a tiled, multiply-blended overlay
 * clipped to the safe-zone polygon. Graceful no-op if the file 404s — useful
 * during the period before the Figma asset is committed.
 *
 * NOTE on a tempting alternative (extracting the paper-band area from each
 * chocolate photo and overlaying it as a low-opacity layer): we DON'T do
 * that. Reasons:
 *   1. Per-flavor manual mask creation = exactly the Figma work we already
 *      deferred (shadowSrc/highlightSrc PNGs in FlavorConfig).
 *   2. This generic seamless texture already provides the paper-grain feel.
 *   3. Inter-flavor lighting variation would make masks look inconsistent
 *      when applied to a different flavor's photo.
 * Path forward (post-MVP): properly photographed shadow/highlight overlay
 * PNGs per flavor, wired through loadOverlay() — the architecture's already
 * there. If users want stronger texture in the meantime, raise opacity here.
 */
function loadPaperTexture(
  fabricRef: { current: fabric.Canvas | null },
  fitted: Fitted,
  safeZone: SafeZone,
  scale: number,
  opacity: number
) {
  const canvas = fabricRef.current;
  if (!canvas) return;
  fabric.Image.fromURL(
    PAPER_TEXTURE_URL,
    (img) => {
      if (fabricRef.current !== canvas) return;
      const el = img.getElement() as HTMLImageElement | undefined;
      // Graceful no-op: missing asset means naturalWidth is 0.
      if (!el || !el.naturalWidth) return;

      // Upscale the texture tile via an offscreen canvas so the pattern repeats
      // at scale × native size. Larger tiles read more grain at human scale —
      // tiling the native ~512px image once across a ~600px polygon makes the
      // grain almost invisible.
      const tileW = Math.max(1, Math.round(el.naturalWidth * scale));
      const tileH = Math.max(1, Math.round(el.naturalHeight * scale));
      const off = document.createElement("canvas");
      off.width = tileW;
      off.height = tileH;
      const ctx = off.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(el, 0, 0, tileW, tileH);

      // @types/fabric types `source` as string | HTMLImageElement, but Fabric
      // accepts HTMLCanvasElement at runtime. Cast around the type gap.
      const pattern = new fabric.Pattern({
        source: off as unknown as HTMLImageElement,
        repeat: "repeat",
      });
      const rect = new fabric.Rect({
        left: fitted.left,
        top: fitted.top,
        width: fitted.width,
        height: fitted.height,
        // fabric.Rect.fill accepts Pattern at runtime but its type def is string.
        fill: pattern as unknown as string,
        // User-controlled via the LeftPanel "Інтенсивність текстури"
        // input (0..100). The opacity-only effect below keeps the rect
        // in sync without forcing a full texture reload on every nudge.
        opacity: clamp01(opacity / 100),
        globalCompositeOperation: "multiply",
        selectable: false,
        evented: false,
        objectCaching: false,
      });
      rect.clipPath = makeClipPath(safeZone, fitted);
      (rect as unknown as { layer: LayerKey }).layer = LAYER.texture;
      canvas.add(rect);
      restackLayers(canvas);
      canvas.requestRenderAll();
    },
    { crossOrigin: "anonymous" }
  );
}

function loadOverlay(
  fabricRef: { current: fabric.Canvas | null },
  src: string,
  fitted: Fitted,
  layerKey: LayerKey,
  blend: "multiply" | "screen"
) {
  const canvas = fabricRef.current;
  if (!canvas) return;
  fabric.Image.fromURL(
    src,
    (img) => {
      if (fabricRef.current !== canvas) return;
      if (!img.width || !img.height) return;
      const scale = fitted.width / img.width;
      img.set({
        left: fitted.left,
        top: fitted.top,
        scaleX: scale,
        scaleY: scale,
        selectable: false,
        evented: false,
        originX: "left",
        originY: "top",
        globalCompositeOperation: blend,
      });
      (img as unknown as { layer: LayerKey }).layer = layerKey;
      canvas.add(img);
      restackLayers(canvas);
      canvas.requestRenderAll();
    },
    { crossOrigin: "anonymous" }
  );
}


/* ---------------- Builder-id tagging + layers projection ---------------- */

interface BuilderTag {
  __bid?: string;
  __bname?: string | null;
}

/**
 * Generate a stable identifier for a user-added object. crypto.randomUUID
 * is available in all evergreen browsers, but we keep the fallback for the
 * (rare) cases where the canvas mounts in an iframe with crypto unavailable.
 */
function makeBuilderId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `bid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function tagBuilderObject(obj: fabric.Object, id: string, name: string | null) {
  const tagged = obj as unknown as BuilderTag;
  tagged.__bid = id;
  tagged.__bname = name;
}

function getBuilderId(obj: fabric.Object): string | null {
  return (obj as unknown as BuilderTag).__bid ?? null;
}

/**
 * Extract the filename portion of a URL for display in the layers list.
 * Falls back to the full URL if parsing fails (e.g., blob: or data: URLs).
 */
function filenameFromUrl(url: string): string {
  try {
    const path = new URL(url, "http://x").pathname;
    const last = path.split("/").pop();
    if (last && last.length > 0) {
      return decodeURIComponent(last);
    }
  } catch {
    /* fall through */
  }
  return url;
}

/**
 * Run a callback with the canvas in "export mode" — guide outlines hidden,
 * active selection cleared. Restores everything before returning, even if
 * the callback throws. Both the mockup and the (currently disabled) flat
 * exports route through this helper so what the user sees and what gets
 * saved stay in lockstep about which layers count as "guide chrome".
 *
 *   "mockup" — hides only outline-style guides (paper polygon, front-face
 *   stroke, dev grid, dev point handles). Keeps texture, background-color
 *   polygon, side / front shadows, photo overlays, the photo background,
 *   and user objects.
 *
 *   "flat"   — hides every layer the canvas owns plus the photo bg image,
 *   leaving only user objects on a transparent canvas.
 */
function withExportMode<T>(
  canvas: fabric.Canvas,
  mode: "mockup" | "flat",
  cb: () => T
): T {
  // LAYER.paper is intentionally NOT here. It's the paper-color polygon —
  // a permanent visual element that has to be in the mockup. Its stroke
  // (the dashed safe-zone outline) IS guide chrome though, so we null it
  // for the duration of the export below.
  const MOCKUP_HIDDEN: LayerKey[] = [
    LAYER.front,
    LAYER.point,
    LAYER.grid,
  ];
  const isMockupHidden = (o: fabric.Object) =>
    MOCKUP_HIDDEN.some((key) => isLayer(o, key));

  const objsToHide =
    mode === "mockup"
      ? canvas.getObjects().filter(isMockupHidden)
      : canvas.getObjects().filter(isAnyLayer);

  const savedVisibility = objsToHide.map((o) => o.visible !== false);
  objsToHide.forEach((o) => {
    o.visible = false;
  });

  // Mockup-only: temporarily strip the dashed stroke from LAYER.paper so
  // the printed outline doesn't bleed into the final PNG. Stroke is
  // restored unconditionally in the finally block.
  type SavedStroke = {
    obj: fabric.Object;
    stroke: unknown;
    strokeWidth: number;
    strokeDashArray: number[] | undefined;
  };
  const savedStrokes: SavedStroke[] = [];
  if (mode === "mockup") {
    canvas
      .getObjects()
      .filter((o) => isLayer(o, LAYER.paper))
      .forEach((p) => {
        savedStrokes.push({
          obj: p,
          stroke: p.stroke,
          strokeWidth: p.strokeWidth ?? 0,
          strokeDashArray: p.strokeDashArray,
        });
        (p as unknown as { set: (k: string, v: unknown) => void }).set(
          "stroke",
          null
        );
        p.strokeWidth = 0;
        p.strokeDashArray = undefined;
      });
  }

  let savedBg: unknown = null;
  if (mode === "flat") {
    savedBg = canvas.backgroundImage;
    (canvas as unknown as { backgroundImage: undefined }).backgroundImage =
      undefined;
  }

  // Phase 12 Subtask 6: snapshot the user's pan/zoom and force the canvas
  // to its identity (fit) view for the duration of the export. Buyers
  // expect the basket-item thumbnail and the local-download mockup to
  // show the centered chocolate, NOT whatever zoomed-in / panned-off view
  // they were debugging just before submission. cb() runs synchronously
  // inside this try/finally; the user never sees the visible flicker
  // because canvas.renderAll() in the finally block restores the view in
  // the same paint frame.
  const savedVpt = canvas.viewportTransform
    ? (canvas.viewportTransform.slice() as [
        number,
        number,
        number,
        number,
        number,
        number,
      ])
    : null;
  if (savedVpt) {
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
  }

  // Drop selection so corner handles / borders never reach the PNG. Done
  // last so any throw above already has a clean restore path.
  const hadSelection = canvas.getActiveObject();
  canvas.discardActiveObject();
  canvas.renderAll();

  try {
    return cb();
  } finally {
    if (savedVpt) {
      canvas.setViewportTransform(savedVpt);
    }
    if (mode === "flat") {
      (canvas as unknown as { backgroundImage: unknown }).backgroundImage =
        savedBg;
    }
    savedStrokes.forEach(({ obj, stroke, strokeWidth, strokeDashArray }) => {
      (obj as unknown as { set: (k: string, v: unknown) => void }).set(
        "stroke",
        stroke
      );
      obj.strokeWidth = strokeWidth;
      obj.strokeDashArray = strokeDashArray;
    });
    objsToHide.forEach((o, i) => {
      o.visible = savedVisibility[i];
    });
    if (hadSelection) canvas.setActiveObject(hadSelection);
    canvas.renderAll();
  }
}

/**
 * Read the right-panel-shaped props off a fabric.IText. Centralised so
 * selection emit, addText emit, and updateActiveText emit all return the
 * exact same shape — keeps the panel's slider readouts in sync after
 * each mutation without bespoke per-call object literals.
 */
function readActiveTextProps(it: fabric.Textbox): ActiveTextProps {
  const align = it.textAlign;
  const textAlign: "left" | "center" | "right" =
    align === "center" || align === "right" ? align : "left";
  const stroke =
    typeof it.stroke === "string" && it.stroke.length > 0 ? it.stroke : null;
  return {
    fontFamily: it.fontFamily ?? "",
    fontSize: it.fontSize ?? 32,
    fill: typeof it.fill === "string" ? it.fill : "#1a1a1a",
    textAlign,
    opacity: typeof it.opacity === "number" ? it.opacity : 1,
    stroke,
    strokeWidth: typeof it.strokeWidth === "number" ? it.strokeWidth : 0,
    fontWeight: it.fontWeight ?? "normal",
    fontStyle: it.fontStyle ?? "normal",
    lineHeight: typeof it.lineHeight === "number" ? it.lineHeight : 1.16,
    charSpacing: typeof it.charSpacing === "number" ? it.charSpacing : 0,
  };
}

/**
 * Read the right-panel-shaped props off a fabric.Image. Mirrors
 * readActiveTextProps so the panel can render image controls without
 * dipping into Fabric directly.
 */
function readActiveImageProps(obj: fabric.Object): ActiveImageProps {
  return {
    opacity: typeof obj.opacity === "number" ? obj.opacity : 1,
    angle: typeof obj.angle === "number" ? obj.angle : 0,
  };
}

/**
 * Project a user-added fabric object into a layer-list row. Returns null for
 * untagged objects (which would only happen for legacy objects loaded before
 * the tagging logic existed — currently unreachable).
 */
function toBuilderLayer(obj: fabric.Object): BuilderLayer | null {
  const id = getBuilderId(obj);
  if (!id) return null;
  if (obj.type === "textbox") {
    const it = obj as fabric.Textbox;
    const raw = (it.text ?? "").trim();
    const display = raw.length === 0 ? "(порожній текст)" : raw;
    const truncated =
      display.length > 20 ? `${display.slice(0, 20)}…` : display;
    return { id, kind: "text", name: truncated };
  }
  if (obj.type === "image") {
    const stored = (obj as unknown as BuilderTag).__bname;
    return { id, kind: "image", name: stored ?? "Зображення" };
  }
  return null;
}

/**
 * Enforce z-order. Bottom → top:
 *   photo background (canvas-level) → paper band → texture → background color
 *   → user objects → side/front shadows → photo overlays → front-face guide
 *   → point handles.
 *
 * Implementation strategy:
 *   • Bottom cluster is positioned via successive `sendToBack` calls in
 *     REVERSE final order: each call drops the target to index 0, so the
 *     LAST call ends up at the very bottom. Order: background, texture, paper.
 *   • Top cluster is positioned via successive `bringToFront` calls in
 *     FORWARD final order: each call lifts the target to the last index, so
 *     the LAST call ends up at the very top. Order: side shadows, photo
 *     overlays, front guide, point handles.
 *
 * Idempotent — safe to call after every layer mutation.
 */
function restackLayers(canvas: fabric.Canvas) {
  // Bottom cluster — apply in reverse-final-order so the last sendToBack
  // (cardChrome on the greeting card, paper otherwise) lands at index 0.
  canvas.getObjects().filter((o) => isLayer(o, LAYER.background)).forEach((o) => o.sendToBack());
  canvas.getObjects().filter((o) => isLayer(o, LAYER.texture)).forEach((o) => o.sendToBack());
  canvas.getObjects().filter((o) => isLayer(o, LAYER.paper)).forEach((o) => o.sendToBack());
  // Greeting card body sits below everything (no chocolate photo + paper
  // band on the card route — the chrome IS the surface).
  canvas.getObjects().filter((o) => isLayer(o, LAYER.cardChrome)).forEach((o) => o.sendToBack());
  // Top cluster — last bringToFront (point) ends up topmost.
  canvas.getObjects().filter((o) => isLayer(o, LAYER.sideL)).forEach((o) => o.bringToFront());
  canvas.getObjects().filter((o) => isLayer(o, LAYER.sideR)).forEach((o) => o.bringToFront());
  canvas.getObjects().filter((o) => isLayer(o, LAYER.shadowFront)).forEach((o) => o.bringToFront());
  canvas.getObjects().filter((o) => isLayer(o, LAYER.shadow)).forEach((o) => o.bringToFront());
  canvas.getObjects().filter((o) => isLayer(o, LAYER.highlight)).forEach((o) => o.bringToFront());
  // Fold lines (greeting card) sit ABOVE user objects + bg color so
  // they remain visible even when the buyer paints the card a bright
  // colour. Ribbon holes follow on top — same reason — so cutouts
  // still read through.
  canvas.getObjects().filter((o) => isLayer(o, LAYER.foldLine)).forEach((o) => o.bringToFront());
  canvas.getObjects().filter((o) => isLayer(o, LAYER.ribbonHole)).forEach((o) => o.bringToFront());
  canvas.getObjects().filter((o) => isLayer(o, LAYER.front)).forEach((o) => o.bringToFront());
  canvas.getObjects().filter((o) => isLayer(o, LAYER.point)).forEach((o) => o.bringToFront());
}
