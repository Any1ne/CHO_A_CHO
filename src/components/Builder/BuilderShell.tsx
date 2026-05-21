// src/components/Builder/BuilderShell.tsx
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  Shapes,
  Type,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { fabric } from "fabric";
import type {
  ShapeConfig,
  FlavorConfig,
  MaterialType,
  SafeZonePoint,
} from "@/types/builder";
import {
  uploadBuilderLogo,
  uploadBuilderPreview,
} from "@/lib/supabase/builder-storage";
import { serializedToDesignElements } from "@/lib/builder/designElements";
import {
  getActiveTier,
  getPricePerPiece,
  getTotalPrice,
} from "@/lib/builder/pricing";
import {
  clearDesignDraft,
  loadDesignDraft,
  saveDesignDraft,
  type SavedDesign,
} from "@/lib/builder/persistence";
import { useCanvasHistory } from "./useCanvasHistory";
import ConstructorCanvas, {
  type ActiveObjectInfo,
  type ActiveTextProps,
  type BuilderLayer,
  type ConstructorCanvasHandle,
  type ControlSize,
  type SafeZoneColor,
  type SafeZoneStroke,
  type ShadowMode,
} from "./ConstructorCanvas";
import { DEFAULT_BUILDER_FONT } from "./fonts";
import TopBar from "./shell/TopBar";
import LeftPanel from "./shell/LeftPanel";
import RightPanel from "./shell/RightPanel";
import BottomBar, { type BuilderStage } from "./shell/BottomBar";
import {
  ZOOM_MIN,
  ZOOM_MAX,
  ZoomButtonsControl,
} from "./shell/ZoomControl";
import SettingsPopover from "./shell/SettingsPopover";
import SubmissionDialog, {
  type SubmissionFormValues,
} from "./shell/SubmissionDialog";
import FloatingFlavorBubbles from "./shell/FloatingFlavorBubbles";
import FloatingTypographyToolbar from "./shell/FloatingTypographyToolbar";
import SetupConfigPanel from "./shell/SetupConfigPanel";
import BackgroundPopover from "./shell/BackgroundPopover";
import QtyStepper from "./shell/QtyStepper";
import TourPopover from "./onboarding/TourPopover";
import { useOnboarding } from "./onboarding/useOnboarding";
import BuilderBreadcrumb from "./shell/BuilderBreadcrumb";
import BottomSheet from "./shell/BottomSheet";
import { BUILDER_SHAPES } from "@/config/builder-shapes";
import { Layers, Settings as SettingsIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SlidersHorizontal } from "lucide-react";

const TEXT_DEFAULTS: ActiveTextProps = {
  fontFamily: DEFAULT_BUILDER_FONT.family,
  fontSize: 32,
  fill: "#1a1a1a",
};

const MIN_LOGO_DIMENSION = 200; // px — under this we soft-warn
const MAX_LOGO_BYTES = 10 * 1024 * 1024;
const ACCEPTED_LOGO_MIME = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

// Phase 25 Subtask 1: default lifted to the lowest price tier's
// minQuantity so the qty stepper opens at a meaningful order size.
const DEFAULT_QUANTITY = 100;

interface BuilderShellProps {
  shapeConfig: ShapeConfig;
}

export default function BuilderShell({ shapeConfig }: BuilderShellProps) {
  /* ----------------------------- core state ---------------------------- */
  const [stage, setStage] = useState<BuilderStage>("setup");
  const [quantity, setQuantity] = useState(DEFAULT_QUANTITY);
  const [activeFlavor, setActiveFlavor] = useState<FlavorConfig>(
    shapeConfig.flavors[0]
  );
  const [activeMaterial, setActiveMaterial] = useState<MaterialType>(
    shapeConfig.allowedMaterials[0]
  );
  const [activeObject, setActiveObject] = useState<ActiveObjectInfo | null>(null);
  const [layers, setLayers] = useState<BuilderLayer[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  // Phase 16 Subtask 3: true while a flavor swap's photo is in flight.
  // Set to true whenever activeFlavor.id changes; cleared by the canvas's
  // onFlavorImageLoaded callback inside its fromURL resolve. Drives the
  // spinner overlay so the buyer doesn't see a flash where the new
  // safe-zone polygon paints over the OLD chocolate while the new
  // photo is still loading.
  const [flavorChanging, setFlavorChanging] = useState(true);
  useEffect(() => {
    setFlavorChanging(true);
  }, [activeFlavor.id]);
  const handleFlavorImageLoaded = useCallback(() => {
    setFlavorChanging(false);
  }, []);

  // Phase 22 Subtask 1: greeting card is now ONE flavor with a separate
  // `activeSide` toggle (outer / inner). Per-side user-object buckets
  // persist designs across side switches without needing two flavor
  // entries. Refs (not state) — only `activeSide` drives renders.
  const isGreetingCard = shapeConfig.id === "greeting-card";
  type CardSide = "outer" | "inner";
  const [activeSide, setActiveSide] = useState<CardSide>("outer");
  const sideBucketsRef = useRef<Record<CardSide, unknown[]>>({
    outer: [],
    inner: [],
  });
  const handleSideSwitch = useCallback(
    (nextSide: CardSide) => {
      if (!isGreetingCard) return;
      if (activeSide === nextSide) return;
      // Snapshot the current side's user objects before swapping.
      const current = canvasRef.current?.getUserObjects() ?? [];
      sideBucketsRef.current[activeSide] = current;
      // Apply the new side's bucket immediately — no SVG re-fetch is
      // needed (both sides render the same template), so the canvas
      // can swap user objects in place.
      const nextBucket = sideBucketsRef.current[nextSide] ?? [];
      canvasRef.current?.replaceUserObjects(nextBucket);
      setActiveSide(nextSide);
    },
    [activeSide, isGreetingCard]
  );

  // Phase 17: scroll-bounce hint on phone when the user transitions from
  // setup to design. Phone design layout matches setup (canvas claims
  // the full middle height), so panels below the fold aren't visible
  // immediately. A brief smooth scroll down → back up signals to the
  // buyer that there IS more content beneath the canvas to discover.
  // Skipped on lg+ where panels are visible alongside the canvas in
  // the grid layout, and on the back-to-setup direction.
  const middleRef = useRef<HTMLDivElement>(null);
  const prevStageRef = useRef<BuilderStage>(stage);
  useEffect(() => {
    const wasSetup = prevStageRef.current === "setup";
    prevStageRef.current = stage;
    if (!wasSetup || stage !== "design") return;
    if (typeof window === "undefined") return;
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (isDesktop) return;
    const middle = middleRef.current;
    if (!middle) return;
    // Wait for the design panels to mount so middle has scrollable
    // content to reveal, then bounce.
    const timer = window.setTimeout(() => {
      if (!middle) return;
      middle.scrollTo({ top: 60, behavior: "smooth" });
      window.setTimeout(() => {
        middle.scrollTo({ top: 0, behavior: "smooth" });
      }, 700);
    }, 100);
    return () => window.clearTimeout(timer);
  }, [stage]);

  /* --------------------------- guide toggles --------------------------- */
  const [showSafeZone, setShowSafeZone] = useState(true);
  // Shadow mode default "right" (light from the right, left side darkest).
  // Was "off" — that made the intensity slider visibly do nothing because
  // addPolygonGuides skips creating shadow polygons when mode is off.
  // Users can still switch to "front" or "off" via SettingsPopover.
  const [shadowMode, setShadowMode] = useState<ShadowMode>("right");
  const [shadowIntensity, setShadowIntensity] = useState(0.3);
  // Front-face guide doubles as the branding-zone outline (see zones.ts).
  // Default ON so users see where their content can live without having to
  // toggle a setting.
  const [showFront, setShowFront] = useState(true);
  // Phase 25 Subtask 4: greeting card fold-strip edges. Default visible
  // so the buyer sees where the card folds; toggle off via canvas
  // settings popover for chocolates / unwanted clutter.
  const [showFoldLines, setShowFoldLines] = useState(true);
  const [safeZoneStroke, setSafeZoneStroke] = useState<SafeZoneStroke>("dashed");
  // Default to neutral white-with-alpha for everyone. The colored presets
  // (green / cyan / magenta) stay accessible via SettingsPopover for QA.
  const [safeZoneColor, setSafeZoneColor] = useState<SafeZoneColor>("white");
  const [textureAvailable, setTextureAvailable] = useState(false);
  const [showTexture, setShowTexture] = useState(false);
  const [textureScale, setTextureScale] = useState(4);
  // Texture opacity 0..100 (percent). User-controllable from LeftPanel.
  // Phase 14 Subtask 8: default lowered from 60 → 20 so the paper grain
  // is a subtle finish rather than an obvious overlay over the chocolate.
  const [textureOpacity, setTextureOpacity] = useState(20);
  // User-chosen paper color (null = no overlay = white paper). Picked via
  // the floating BackgroundPopover button rendered alongside the canvas
  // action toolbar — single source of truth for wrapper colour. Drives the
  // LAYER.paper polygon fill (multiply blend over the chocolate photo).
  // null = fall back to the safe-zone preset's translucent-white default.
  // Replaces the old dual paperColor / backgroundColor split — see Phase 8
  // Subtask 2.
  const [backgroundColor, setBackgroundColor] = useState<string | null>(null);
  // Figma-style collapsible side panels. State is component-local;
  // resets across stage transitions intentionally so the user gets a
  // clean view each time they enter design mode.
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  // Phase 32 Subtask 6: which mobile bottom-sheet (if any) is open.
  // Desktop ignores this — panels render inline in the grid layout.
  const [mobileSheet, setMobileSheet] = useState<null | "layers" | "properties">(null);
  // No explicit resize dispatch is needed: the canvas's ResizeObserver
  // listens directly on the container and refits via renderFlavor when
  // the column width changes. renderFlavor recomputes the photo fit but
  // does NOT reset viewportTransform, so the user's pan / zoom stays.
  // Selection-handle size preset, surfaced in the gear settings popover.
  const [controlSize, setControlSize] = useState<ControlSize>("small");
  useEffect(() => {
    const probe = new window.Image();
    probe.onload = () => {
      setTextureAvailable(true);
      setShowTexture(true);
    };
    probe.onerror = () => setTextureAvailable(false);
    probe.src = "/builder/textures/paper.webp";
  }, []);

  /* ---------------------- zoom (user-facing slider) -------------------- */
  // Now that the slider is in the bottom-right of the canvas (not gated to
  // dev), every user can zoom. Range tightened to [0.25, 4] so end-users
  // don't accidentally hit the very-zoomed-in dev range.
  const [zoomLevel, setZoomLevel] = useState(1);
  const clampZoom = useCallback(
    (n: number) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, n)),
    []
  );

  /* ---------------- dev-only: safe-zone editor state ------------------- */
  const [editedPointsByFlavor, setEditedPointsByFlavor] = useState<
    Record<string, SafeZonePoint[]>
  >({});
  const [devEditingMode, setDevEditingMode] = useState(false);
  const [devGridStep, setDevGridStep] = useState(2);

  // Dev controls only render at lg+ AND in development. Force-disable
  // editingMode if the viewport drops below the breakpoint.
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  useEffect(() => {
    if (!isDesktop && devEditingMode) setDevEditingMode(false);
  }, [isDesktop, devEditingMode]);
  const devVisible =
    process.env.NODE_ENV === "development" && isDesktop;

  /* -------------- effective flavor (overlays dev edits) ---------------- */
  const effectiveActiveFlavor = useMemo<FlavorConfig>(() => {
    const overrides = editedPointsByFlavor[activeFlavor.id];
    if (!overrides) return activeFlavor;
    return { ...activeFlavor, safeZone: { points: overrides } };
  }, [activeFlavor, editedPointsByFlavor]);

  const handlePointMove = useCallback(
    (index: number, normalized: SafeZonePoint) => {
      setEditedPointsByFlavor((prev) => {
        const id = activeFlavor.id;
        const current = prev[id] ?? activeFlavor.safeZone.points;
        const next = [...current];
        next[index] = normalized;
        return { ...prev, [id]: next };
      });
    },
    [activeFlavor]
  );

  /* --------------------------- imperative refs ------------------------- */
  const canvasRef = useRef<ConstructorCanvasHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---------------------- history (undo / redo) ------------------------ */
  // Surface the fabric.Canvas instance via onCanvasMount so the history
  // hook can subscribe to events on the same canvas the imperative API talks
  // to. The hook captures only user objects + the current backgroundColor —
  // never the photo background or guide layers — so undo can never blank
  // the chocolate photo or break guide z-order.
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const { canUndo, canRedo, undo, redo, seedInitial } = useCanvasHistory(
    fabricCanvas,
    {
      backgroundColor,
      // Тло is editable via the floating BackgroundPopover (Phase 8) — pass
      // the real setter so undo / redo restore the captured Тло pick along
      // with the user objects.
      setBackgroundColor,
      postRestoreUserObject: useCallback((obj: fabric.Object) => {
        canvasRef.current?.applyUserObjectControls(obj);
      }, []),
      finalizeRestore: useCallback(() => {
        canvasRef.current?.finalizeRestore();
      }, []),
    }
  );

  // Seed the initial history entry only AFTER the canvas's first ready
  // signal (which fires after the photo loads + guides paint). Capturing
  // before that would store an empty state, and undo would later restore
  // it — blanking the chocolate.
  useEffect(() => {
    if (!canvasReady) return;
    seedInitial();
  }, [canvasReady, seedInitial]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Only intercept Ctrl/Cmd+Z / Ctrl/Cmd+Shift+Z / Ctrl/Cmd+Y.
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      // Skip if focus is in a regular text input or contenteditable. The
      // canvas itself doesn't show up here (it's a <canvas> element), so we
      // also defer to the canvas's own IText editor when active.
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea" || target.isContentEditable) {
          return;
        }
      }
      if (canvasRef.current?.isTextEditing()) return;

      const isUndo = e.key === "z" && !e.shiftKey;
      const isRedo = (e.key === "z" && e.shiftKey) || e.key === "y";
      if (isUndo) {
        e.preventDefault();
        undo();
      } else if (isRedo) {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  /* ---------------------- design-content predicate --------------------- */
  // Phase 28 / Phase 31 Subtask 1: single source of truth for "buyer
  // has made the design their own". `layers.length > 0` covers placed
  // user objects (text + uploaded images). Additionally, any custom
  // background colour pick counts — picking a paper tint counts as a
  // creative decision worth letting the buyer download / submit.
  // backgroundColor is null when the buyer hasn't touched the picker.
  const hasDesignContent = layers.length > 0 || backgroundColor !== null;

  /* ---------------------- draft persistence (Phase 31 S2) -------------- */
  // Per-shape localStorage. Auto-save fires on a 600 ms debounce after
  // any user-visible change (object add / remove / move, qty, bg color,
  // flavor, side). Restore happens once on mount after the canvas is
  // ready. Submission clears the draft. Designed so the buyer can
  // close the tab mid-design and come back to exactly where they were.
  const restoredRef = useRef(false);
  const autoSaveTimerRef = useRef<number | null>(null);
  // Snapshot of the canvas + state for persistence. Reads via canvasRef
  // so movement (which doesn't trip React state) still serializes.
  const buildDraft = useCallback((): SavedDesign | null => {
    if (!canvasRef.current) return null;
    const liveObjects = canvasRef.current.getUserObjects();
    let objectsBySide: SavedDesign["objectsBySide"];
    if (isGreetingCard) {
      // Snapshot the current side into its bucket before composing the
      // payload so both sides ship.
      sideBucketsRef.current[activeSide] = liveObjects;
      objectsBySide = {
        outer: sideBucketsRef.current.outer,
        inner: sideBucketsRef.current.inner,
      };
    }
    return {
      version: 1,
      shapeId: shapeConfig.id,
      flavorId: activeFlavor.id,
      activeSide: isGreetingCard ? activeSide : undefined,
      objectsBySide,
      quantity,
      backgroundColor,
      objects: liveObjects,
      savedAt: Date.now(),
    };
  }, [
    activeFlavor.id,
    activeSide,
    backgroundColor,
    isGreetingCard,
    quantity,
    shapeConfig.id,
  ]);

  // Debounced auto-save on every meaningful state change. Object
  // movement doesn't trip React state but DOES trip layers/object:added/
  // object:removed via the canvas event listeners; the `layers` dep here
  // re-fires on those. We also subscribe to object:modified below so
  // moves (which don't re-emit `layers`) trigger saves.
  useEffect(() => {
    if (!canvasReady) return;
    if (!restoredRef.current) return; // wait until any incoming draft has been applied
    if (autoSaveTimerRef.current !== null) {
      window.clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = window.setTimeout(() => {
      const draft = buildDraft();
      if (draft) saveDesignDraft(draft);
    }, 600);
    return () => {
      if (autoSaveTimerRef.current !== null) {
        window.clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [
    layers,
    backgroundColor,
    quantity,
    activeFlavor.id,
    activeSide,
    canvasReady,
    buildDraft,
  ]);

  // Object movement triggers `object:modified` but not the layers
  // array — subscribe directly so position changes also save.
  useEffect(() => {
    if (!fabricCanvas) return;
    const trigger = () => {
      if (!restoredRef.current) return;
      if (autoSaveTimerRef.current !== null) {
        window.clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = window.setTimeout(() => {
        const draft = buildDraft();
        if (draft) saveDesignDraft(draft);
      }, 600);
    };
    fabricCanvas.on("object:modified", trigger);
    return () => {
      fabricCanvas.off("object:modified", trigger);
    };
  }, [fabricCanvas, buildDraft]);

  // Restore draft once the canvas signals ready. Sequenced so the
  // canvas chrome (paper / SVG / image) has rendered before we drop
  // user objects on top — replaceUserObjectsAsync respects the fitted
  // ref the renderFlavor effect populates.
  useEffect(() => {
    if (!canvasReady) return;
    if (restoredRef.current) return;
    const draft = loadDesignDraft(shapeConfig.id);
    if (!draft) {
      restoredRef.current = true;
      return;
    }
    // Re-hydrate scalar state first so the canvas re-render picks up
    // the saved bg color before user objects land.
    if (typeof draft.quantity === "number") setQuantity(draft.quantity);
    if (draft.backgroundColor !== undefined) {
      setBackgroundColor(draft.backgroundColor);
    }
    if (draft.flavorId && draft.flavorId !== activeFlavor.id) {
      const target = shapeConfig.flavors.find((f) => f.id === draft.flavorId);
      if (target) setActiveFlavor(target);
    }
    if (isGreetingCard && draft.activeSide) {
      // Apply per-side buckets BEFORE setting activeSide so the
      // handleSideSwitch / renderFlavor effect sees the right pools.
      if (draft.objectsBySide) {
        sideBucketsRef.current = {
          outer: draft.objectsBySide.outer ?? [],
          inner: draft.objectsBySide.inner ?? [],
        };
      }
      setActiveSide(draft.activeSide);
    }
    // Push the active-side objects onto the canvas. enliven is async —
    // we await via replaceUserObjectsAsync so the next save tick sees
    // the restored objects rather than an empty canvas.
    const objectsToRestore =
      isGreetingCard && draft.objectsBySide
        ? draft.objectsBySide[draft.activeSide ?? "outer"] ?? []
        : draft.objects ?? [];
    canvasRef.current
      ?.replaceUserObjectsAsync(objectsToRestore)
      .finally(() => {
        restoredRef.current = true;
      });
  }, [canvasReady, shapeConfig.id, shapeConfig.flavors, isGreetingCard, activeFlavor.id]);

  /* ----------------------------- onboarding tour ----------------------- */
  // Phase 29: guided product tour for first-time buyers. Auto-starts
  // after ~800 ms unless localStorage marks the tour as completed. The
  // help button in TopBar restarts it on demand.
  const tour = useOnboarding({
    stage,
    hasDesignContent,
    isMobile: !isDesktop,
  });

  /* ----------------------------- pricing ------------------------------- */
  // Phase 23 Subtask 1: tier-based pricing. Each shape carries an array
  // of `priceTiers` (e.g. 100→19.5, 500→18, 1000→17 UAH/piece). The
  // helper picks the highest-threshold tier that fits the current
  // quantity; crossing a boundary in the qty stepper (e.g. 499 → 500)
  // re-runs this memo and the unit price drops visibly.
  const { unitPriceCurrent, totalPrice, activeTier } = useMemo(() => {
    const tiers = shapeConfig.priceTiers;
    if (!tiers || tiers.length === 0) {
      return { unitPriceCurrent: null, totalPrice: null, activeTier: null };
    }
    return {
      unitPriceCurrent: getPricePerPiece(tiers, quantity),
      totalPrice: getTotalPrice(tiers, quantity),
      activeTier: getActiveTier(tiers, quantity),
    };
  }, [quantity, shapeConfig.priceTiers]);

  // Phase 24 Subtask 7 / Phase 25 Subtask 2: surface the price-drop
  // celebration when the buyer crosses INTO a better tier (qty up →
  // per-piece price down). Animations don't fire on qty-down crossings;
  // the new value is just adopted silently. After ~2 s the priceChange
  // overlay clears and the regular static price keeps showing.
  const [priceChange, setPriceChange] = useState<{
    from: number;
    to: number;
  } | null>(null);
  const prevPricePerPieceRef = useRef<number | null>(unitPriceCurrent);
  useEffect(() => {
    const prev = prevPricePerPieceRef.current;
    if (
      prev !== null &&
      unitPriceCurrent !== null &&
      prev > unitPriceCurrent
    ) {
      setPriceChange({ from: prev, to: unitPriceCurrent });
      const timer = window.setTimeout(() => setPriceChange(null), 2000);
      prevPricePerPieceRef.current = unitPriceCurrent;
      return () => window.clearTimeout(timer);
    }
    prevPricePerPieceRef.current = unitPriceCurrent;
  }, [unitPriceCurrent]);

  /* ---------------------- material toggle visibility ------------------- */
  // The old BuilderWorkspace exposed material as a segmented control. The new
  // shell defers the toggle to a future task — we still maintain the state
  // because canvas guides depend on activeMaterial. Reference the setter so
  // it's not flagged unused; future task wires it through SettingsPopover.
  void setActiveMaterial;

  /* ----------------------- file upload pipeline ------------------------ */
  async function handleLogoFile(file: File) {
    if (file.size > MAX_LOGO_BYTES) {
      toast.error("Файл занадто великий. Максимальний розмір 10 МБ.");
      return;
    }
    if (!ACCEPTED_LOGO_MIME.includes(file.type)) {
      toast.error("Підтримуються лише PNG, JPG або WEBP.");
      return;
    }

    const dims = await readImageDimensions(file);
    if (
      dims &&
      (dims.width < MIN_LOGO_DIMENSION || dims.height < MIN_LOGO_DIMENSION)
    ) {
      toast.warning(
        `Зображення ${dims.width}×${dims.height} px замале. На пакуванні може виглядати розмито.`
      );
    }

    setIsUploadingLogo(true);
    try {
      const url = await uploadBuilderLogo(file);
      setLogoUrl(url);
      // Strip extension from the original filename so the layer list
      // reads "acme-logo" rather than "acme-logo.png".
      const displayName = file.name.replace(/\.[^./]+$/, "") || file.name;
      await canvasRef.current?.addLogo(url, activeFlavor.safeZone, displayName);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Не вдалося завантажити логотип.";
      toast.error(msg);
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  /* ----------------------- handlers (callbacks) ------------------------ */
  // Confirmation dialog for back-to-setup. Triggered from both TopBar's
  // Back button and BottomBar's "Смаки" link, but only when the
  // user has placed at least one object — otherwise we just switch stage.
  const [confirmBackOpen, setConfirmBackOpen] = useState(false);

  function handleAdvanceToDesign() {
    if (!canvasReady) return;
    setStage("design");
  }
  function handleBackToSetup() {
    if (hasDesignContent) {
      setConfirmBackOpen(true);
      return;
    }
    setStage("setup");
  }
  function handleConfirmBack() {
    setStage("setup");
    setConfirmBackOpen(false);
  }
  function handleUploadClick() {
    fileInputRef.current?.click();
  }
  function handleAddText() {
    canvasRef.current?.addText(activeFlavor.safeZone, TEXT_DEFAULTS);
  }
  // Submission dialog open state. The actual export → upload → POST happens
  // inside handleSubmissionSubmit; the dialog is purely a form surface.
  const [submitOpen, setSubmitOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Phase 32 Subtask 1: success-screen state. Flipped true after a
  // successful POST; reset on dialog close or fresh-design flow.
  const [submissionSucceeded, setSubmissionSucceeded] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string>("");
  // Object URL for the basket-item preview thumbnail. Generated on dialog
  // open from the same exportPreview path the submit upload uses, so the
  // user sees exactly what will be sent. Revoked on close.
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  // Phase 32 Subtask 5: separate object URL for the setup-stage mini
  // preview. Captured on design → setup transition when the buyer has
  // placed content. Refreshed every time the buyer returns to setup
  // so it reflects the latest edits. Revoked on next refresh / unmount.
  const [setupPreviewUrl, setSetupPreviewUrl] = useState<string | null>(null);

  function clearPreviewBlobUrl() {
    setPreviewBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  // Phase 32 Subtask 5: refresh the setup-stage mini preview every
  // time the buyer crosses design → setup with placed content. The
  // previous blob URL (if any) is revoked before replacing so we don't
  // leak object-URL references in the browser.
  const prevStageRef2 = useRef<BuilderStage>(stage);
  useEffect(() => {
    const prev = prevStageRef2.current;
    prevStageRef2.current = stage;
    if (prev !== "design" || stage !== "setup") return;
    if (!hasDesignContent) return;
    let cancelled = false;
    (async () => {
      const blob = await canvasRef.current?.exportPreview();
      if (cancelled || !blob) return;
      setSetupPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(blob);
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [stage, hasDesignContent]);

  // Drop the setup preview when there's nothing to show (e.g. fresh
  // design after a successful submission resets everything).
  useEffect(() => {
    if (hasDesignContent) return;
    setSetupPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
  }, [hasDesignContent]);

  async function handleSubmit() {
    // Phase 28: gate moved to the button via `canSubmit` (stage ===
    // "design" OR layers exist). Trust the upstream gate so the buyer
    // can submit straight from the setup stage when returning with a
    // previously placed design. Bail if no canvas is mounted yet.
    if (!canvasRef.current) return;
    setSubmitOpen(true);
    clearPreviewBlobUrl();
    const blob = await canvasRef.current?.exportPreview();
    if (blob) setPreviewBlobUrl(URL.createObjectURL(blob));
  }

  async function handleSubmissionSubmit(values: SubmissionFormValues) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Phase 22 Subtask 1 + Phase 29: greeting card snapshots BOTH
      // sides' user objects into their buckets, then renders each side
      // into its own mockup PNG. The non-active side has to be swapped
      // onto the canvas (via replaceUserObjectsAsync) before
      // exportPreview can capture it. We restore the original side
      // after the second export so the buyer's view doesn't flip if
      // they cancel the dialog and keep editing.
      let designElementsBySide:
        | {
            outer: ReturnType<typeof serializedToDesignElements>;
            inner: ReturnType<typeof serializedToDesignElements>;
          }
        | undefined;
      let previewUrlOuter: string | undefined;
      let previewUrlInner: string | undefined;

      if (isGreetingCard) {
        const currentSerialized =
          canvasRef.current?.getUserObjects() ?? [];
        sideBucketsRef.current[activeSide] = currentSerialized;
        designElementsBySide = {
          outer: serializedToDesignElements(sideBucketsRef.current.outer),
          inner: serializedToDesignElements(sideBucketsRef.current.inner),
        };

        const startSide = activeSide;
        // Outer
        await canvasRef.current?.replaceUserObjectsAsync(
          sideBucketsRef.current.outer
        );
        const outerBlob = await canvasRef.current?.exportPreview();
        if (outerBlob) {
          previewUrlOuter = await uploadBuilderPreview(outerBlob);
        }
        // Inner
        await canvasRef.current?.replaceUserObjectsAsync(
          sideBucketsRef.current.inner
        );
        const innerBlob = await canvasRef.current?.exportPreview();
        if (innerBlob) {
          previewUrlInner = await uploadBuilderPreview(innerBlob);
        }
        // Restore originally-active side so the buyer's view doesn't
        // flip if they cancel the dialog and continue editing.
        await canvasRef.current?.replaceUserObjectsAsync(
          sideBucketsRef.current[startSide]
        );
      }

      // Active-side mockup PNG. Same blob the dialog thumbnail used,
      // re-rendered now in case the buyer changed qty / tier between
      // open and submit. Mini / Popular use only this preview; greeting
      // card also surfaces outer + inner alongside it.
      const previewBlob = await canvasRef.current?.exportPreview();
      if (!previewBlob) {
        toast.error("Не вдалося згенерувати прев'ю.");
        return;
      }

      const previewUrl = await uploadBuilderPreview(previewBlob);
      const designElements =
        canvasRef.current?.getDesignElements() ?? [];

      const res = await fetch("/api/builder-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: values,
          order: {
            shapeId: shapeConfig.id,
            shapeName: shapeConfig.name,
            flavorId: activeFlavor.id,
            flavorName: activeFlavor.name,
            quantity,
            unitPriceUah: unitPriceCurrent ?? 0,
            totalUahUah: totalPrice ?? 0,
            pricingTierMinQuantity: activeTier?.minQuantity,
            cardSide: isGreetingCard ? activeSide : undefined,
          },
          assets: {
            logoUrl,
            previewUrl,
            previewUrlOuter,
            previewUrlInner,
          },
          designElements,
          designElementsBySide,
          backgroundColor,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg =
          (body as { error?: string }).error ?? "Не вдалося надіслати запит.";
        toast.error(msg);
        return;
      }

      // Phase 31 Subtask 2: drop the persisted draft on a successful
      // submit. The order has shipped to the designer; keeping the
      // draft would prompt the buyer to "resume" something they've
      // already submitted.
      clearDesignDraft(shapeConfig.id);
      // Phase 32 Subtask 1: stay open, swap to success screen. The
      // previous toast.success was redundant once the dialog itself
      // celebrates the submission.
      setSubmittedEmail(values.email);
      setSubmissionSucceeded(true);
      clearPreviewBlobUrl();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Не вдалося надіслати запит.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }
  function handleResetView() {
    setZoomLevel(1);
    canvasRef.current?.resetView();
  }

  // Phase 32 Subtask 1: reset the design surface after a successful
  // submission. Wipes user objects from the canvas (both side buckets
  // on greeting card), clears the paper-colour pick, resets qty to
  // the default tier minimum, jumps back to setup stage, and closes
  // the dialog. localStorage draft was already cleared by the submit
  // handler. The buyer lands on a fresh setup screen, ready to build
  // a new request.
  async function handleNewDesign() {
    if (isGreetingCard) {
      sideBucketsRef.current = { outer: [], inner: [] };
      setActiveSide("outer");
    }
    await canvasRef.current?.replaceUserObjectsAsync([]);
    setBackgroundColor(null);
    setQuantity(DEFAULT_QUANTITY);
    setStage("setup");
    setSubmitOpen(false);
    setSubmissionSucceeded(false);
    clearPreviewBlobUrl();
  }

  // Local download — skips Supabase entirely. Buyer gets the mockup PNG.
  // Print-ready flat export is parked until perspective unwarp lands; see
  // exportFlat() in ConstructorCanvas.
  // Phase 28: stage gate dropped; same logic as handleSubmit — TopBar's
  // `canSubmit` already gates the trigger button.
  async function handleDownload() {
    if (!canvasRef.current) return;
    const previewBlob = await canvasRef.current?.exportPreview();
    if (!previewBlob) {
      toast.error("Не вдалося згенерувати прев'ю.");
      return;
    }
    const stem = `${shapeConfig.id}-${activeFlavor.id}`;
    triggerDownload(previewBlob, `${stem}-mockup.png`);
  }
  function handleZoomChange(next: number) {
    setZoomLevel(clampZoom(next));
  }

  /* ------------------- layer-list interactions ------------------------- */
  const selectedId = activeObject?.id ?? null;
  function handleLayerSelect(id: string) {
    canvasRef.current?.selectById(id);
  }
  function handleLayerDelete(id: string) {
    canvasRef.current?.deleteById(id);
  }
  function handleBringForward(id: string) {
    canvasRef.current?.bringForwardById(id);
  }
  function handleSendBackwards(id: string) {
    canvasRef.current?.sendBackwardsById(id);
  }

  /* ------------------------- settings popover -------------------------- */
  const settingsContent = (
    <SettingsPopover
      shapeConfig={shapeConfig}
      controlSize={controlSize}
      setControlSize={setControlSize}
      showSafeZone={showSafeZone}
      setShowSafeZone={setShowSafeZone}
      safeZoneColor={safeZoneColor}
      setSafeZoneColor={setSafeZoneColor}
      safeZoneStroke={safeZoneStroke}
      setSafeZoneStroke={setSafeZoneStroke}
      shadowMode={shadowMode}
      setShadowMode={setShadowMode}
      shadowIntensity={shadowIntensity}
      setShadowIntensity={setShadowIntensity}
      showFront={showFront}
      setShowFront={setShowFront}
      showFoldLines={showFoldLines}
      setShowFoldLines={setShowFoldLines}
      textureAvailable={textureAvailable}
      showTexture={showTexture}
      setShowTexture={setShowTexture}
      textureScale={textureScale}
      setTextureScale={setTextureScale}
      textureOpacity={textureOpacity}
      setTextureOpacity={setTextureOpacity}
      devVisible={devVisible}
      devEditingMode={devEditingMode}
      setDevEditingMode={setDevEditingMode}
      devGridStep={devGridStep}
      setDevGridStep={setDevGridStep}
      onResetView={handleResetView}
      devPoints={effectiveActiveFlavor.safeZone.points}
      devFlavorId={activeFlavor.id}
    />
  );

  /* ------------------------------ render ------------------------------- */
  return (
    <div
      data-logo-url={logoUrl ?? undefined}
      className="flex min-h-0 flex-1 flex-col overflow-hidden bg-stone-50 md:rounded-2xl md:border md:border-stone-200 md:bg-white md:shadow-sm"
    >
      <BuilderBreadcrumb
        shapes={Object.values(BUILDER_SHAPES)}
        currentShapeId={shapeConfig.id}
        onRestartTour={tour.restart}
      />
      <TopBar
        shapeName={shapeConfig.name}
        flavorName={activeFlavor.name}
        quantity={quantity}
        // Phase 28: action visibility + disabled state. `showActions`
        // omits the Download/Send cluster entirely on the setup stage
        // when no design content exists (clean nav surface). `canSubmit`
        // still controls the disabled state for cases where the cluster
        // IS rendered but the buyer can't act yet.
        showActions={stage === "design" || hasDesignContent}
        canSubmit={stage === "design" || hasDesignContent}
        onSubmit={handleSubmit}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onDownload={handleDownload}
        showBackToSetup={stage === "design"}
        onBackToSetup={handleBackToSetup}
        backToSetupLabel={shapeConfig.flavorPickerLabel ?? "Смаки"}
      />

      {/* Phase 16 Subtask 3: greeting card side selector. Visible only
          for the greeting-card shape during design. The two buttons map
          1:1 onto the two flavor entries `card-outer` / `card-inner` —
          flipping the active flavor swaps the photo + branding zones +
          template slots. Per-side user-object buckets are persisted by
          `handleSideSwitch` so each half of the card keeps its own
          design. */}
      {isGreetingCard && stage === "design" && (
        <div className="flex shrink-0 items-center justify-center gap-2 border-b border-stone-200 bg-white px-4 py-2">
          <SideToggle active={activeSide} onChange={handleSideSwitch} />
        </div>
      )}

      {/* Middle row.
          • Design: layers panel | canvas | properties panel.
          • Setup:  canvas | config panel (qty + price + CTA).
          Phone (<lg) stacks in JSX order with flex-col + flex-1 on the
          canvas-col so the canvas claims remaining viewport height after
          TopBar / panels / mobile bottom bar. `min-h-0` is critical at
          every flex link in the chain — without it, the implicit
          `min-height: auto` on flex children stops them from shrinking
          past their content min, so the chain falls back to content
          height and leaves an empty band below the canvas. Desktop (lg+)
          is a grid whose column widths shrink to 24px when a side panel
          collapses; the change is animated via transition-[grid-
          template-columns] so the canvas reflows smoothly into the
          recovered space. */}
      <div
        ref={middleRef}
        className={[
          "flex min-h-0 flex-1 flex-col overflow-y-auto lg:grid lg:grid-cols-1 lg:overflow-visible lg:transition-[grid-template-columns] lg:duration-200",
          stage === "design"
            ? designGridColsClass(leftCollapsed, rightCollapsed)
            : "lg:grid-cols-[minmax(0,1fr)_320px]",
        ].join(" ")}
      >
        {/* Canvas + zoom slider. Order on lg:
            • Design: 2nd column (between panels).
            • Setup:  1st column (config sits to its right). */}
        <div
          className={[
            // Phase 17: phone canvas-col claims the FULL middle height
            // (`h-full shrink-0`) regardless of stage so design and setup
            // share the same viewport-filling layout. `shrink-0` is
            // critical — without it the implicit `flex-shrink: 1` on
            // flex children lets the browser compress canvas-col when
            // panels (RightPanel + LeftPanel) ask for their content
            // height. Panels stacked below remain at content height
            // (also `shrink-0` on each) and become scroll-revealed via
            // middle's `overflow-y-auto`. Desktop falls back to
            // grid-row stretch via `lg:h-auto lg:flex-1 lg:shrink`.
            "relative flex h-full min-h-0 min-w-0 shrink-0 flex-col lg:h-auto lg:flex-1 lg:shrink",
            stage === "design" ? "lg:order-2" : "lg:order-1",
          ].join(" ")}
        >
          {/* Phase 16: carousel reverted to an absolute overlay over the
              canvas wrapper (same pattern the design-stage action
              buttons use at the bottom). The previous flex-sibling
              version (Phase 13.2) shrank the canvas wrapper by the
              carousel's own height, so on phone setup the chocolate
              couldn't be panned as low as it could on the design stage.
              Overlay restores full flex-1 height to the canvas wrapper
              — the chocolate now reaches every pixel of canvas-col on
              both stages. */}
          {/* Phase 16: canvas wrapper is `flex-1` on every viewport — on
              desktop the builder fills the entire viewport so the
              wrapper grows to consume whatever vertical space remains
              after TopBar / panels / bottom bar. The aspect-ratio
              inline style is left in place as a hint, but flex-grow
              wins inside a constrained-height parent and the chocolate
              fitContains within whatever shape the wrapper takes. */}
          <div
            className="relative w-full min-h-0 flex-1"
            style={{ aspectRatio: shapeConfig.canvasAspect }}
          >
            <ConstructorCanvas
              ref={canvasRef}
              shapeConfig={shapeConfig}
              activeFlavor={effectiveActiveFlavor}
              activeMaterial={activeMaterial}
              showSafeZone={showSafeZone}
              shadowMode={shadowMode}
              shadowIntensity={shadowIntensity}
              showFront={showFront}
              showFoldLines={showFoldLines}
              safeZoneColor={safeZoneColor}
              safeZoneStroke={safeZoneStroke}
              showTexture={showTexture}
              textureScale={textureScale}
              textureOpacity={textureOpacity}
              backgroundColor={backgroundColor}
              controlSize={controlSize}
              interactive={stage === "design"}
              editingMode={devEditingMode}
              gridStep={devGridStep}
              zoomLevel={zoomLevel}
              onZoomChange={handleZoomChange}
              onPointMove={handlePointMove}
              onActiveObjectChange={setActiveObject}
              onLayersChange={setLayers}
              onCanvasReady={() => setCanvasReady(true)}
              onFlavorImageLoaded={handleFlavorImageLoaded}
              onCanvasMount={setFabricCanvas}
            />
            {(!canvasReady || flavorChanging) && (
              <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-stone-100/60 backdrop-blur-[1px]">
                <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
              </div>
            )}

            {/* Phase 33: phone-only panel triggers in canvas corners.
                Top-left → Layers sheet; top-right → Properties sheet
                (gated on `activeObject` — empty panel would have
                nothing to show). lg:hidden auto-suppresses on desktop
                where the panels sit inline in the grid. */}
            {stage === "design" && (
              <button
                type="button"
                onClick={() => setMobileSheet("layers")}
                title="Шари"
                aria-label="Шари"
                data-tour="layers-trigger"
                className="pointer-events-auto absolute left-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-md transition hover:bg-stone-50 lg:hidden"
              >
                <Layers className="h-4 w-4" />
              </button>
            )}
            {stage === "design" && activeObject && (
              <button
                type="button"
                onClick={() => setMobileSheet("properties")}
                title="Властивості"
                aria-label="Властивості"
                data-tour="properties-trigger"
                className="pointer-events-auto absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-md transition hover:bg-stone-50 lg:hidden"
              >
                <SettingsIcon className="h-4 w-4" />
              </button>
            )}
            {/* Phase 14 Subtask 4: bottom-right vertical cluster — settings
                on top, zoom (+ / reset / −) stacked below. Same surface on
                phone and desktop; frees the bottom-CENTER row for the
                action buttons (image / text / background / shapes).
                Phase 21 Subtask 3: ungated — every shape (free + template)
                gets the cluster so greeting card has settings + zoom too. */}
            <div
              data-tour="zoom-cluster"
              className="pointer-events-auto absolute bottom-4 right-4 z-10 flex flex-col items-center gap-4"
            >
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      title="Налаштування"
                      aria-label="Налаштування"
                      className="h-9 w-9 rounded-full border-stone-200 bg-white text-stone-700 shadow-md hover:bg-stone-50 xl:h-12 xl:w-12 2xl:h-14 2xl:w-14 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:xl:h-5 [&>svg]:xl:w-5 [&>svg]:2xl:h-6 [&>svg]:2xl:w-6"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="top"
                    align="end"
                    sideOffset={8}
                    className="w-72"
                  >
                    {settingsContent}
                  </PopoverContent>
                </Popover>
                <ZoomButtonsControl
                  zoom={zoomLevel}
                  onZoomChange={handleZoomChange}
                  onReset={handleResetView}
                  vertical
                />
              </div>

            {/* Phase 14 Subtask 4: settings now lives in the bottom-right
                cluster alongside the zoom controls (rendered below). The
                top-LEFT desktop variant + TopBar mobileLeftSlot variant
                from Phase 13 are dropped — single source of settings
                across viewports. */}

            {/* Floating island buttons that re-expand a collapsed side
                panel. Visible only on lg+ where the collapse affordance
                lives. Sit at vertical centre on the canvas left/right
                edges so they pair visually with the mid-edge collapse
                chevrons (Phase 11 Subtask 4). */}
            {stage === "design" && leftCollapsed && (
              <button
                type="button"
                onClick={() => setLeftCollapsed(false)}
                title="Показати шари"
                aria-label="Показати шари"
                className="pointer-events-auto absolute left-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-md transition hover:bg-stone-50 lg:flex"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
            {stage === "design" && rightCollapsed && (
              <button
                type="button"
                onClick={() => setRightCollapsed(false)}
                title="Показати властивості"
                aria-label="Показати властивості"
                className="pointer-events-auto absolute right-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-md transition hover:bg-stone-50 lg:flex"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}

            {/* Phase 30 Subtask 5: floating price chip on design stage.
                Mirrors the bottom-right zoom cluster but on the LEFT
                edge so the buyer always sees current price while they
                edit. Hidden on setup (price already in
                SetupConfigPanel / mobile setup bar). */}
            {stage === "design" &&
              totalPrice !== null &&
              unitPriceCurrent !== null && (
                <div className="pointer-events-auto absolute bottom-4 left-4 z-10 rounded-lg border border-stone-200 bg-white px-3 py-1.5 shadow-md">
                  <div className="text-sm font-semibold leading-none tabular-nums text-stone-900">
                    {Math.round(totalPrice).toLocaleString("uk-UA")} ₴
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs tabular-nums text-stone-500">
                    {priceChange && (
                      <span className="text-stone-400 line-through">
                        {Math.round(priceChange.from).toLocaleString("uk-UA")} ₴
                      </span>
                    )}
                    <span
                      key={
                        priceChange
                          ? `${priceChange.from}->${priceChange.to}`
                          : "static"
                      }
                      className={priceChange ? "animate-price-pulse font-semibold" : ""}
                    >
                      {Math.round(unitPriceCurrent).toLocaleString("uk-UA")} ₴ / шт
                    </span>
                  </div>
                </div>
              )}

            {/* Phase 16: setup-stage carousel as absolute overlay over
                the canvas. Sits at top, non-blocking pointer-events on
                the wrapper so chocolate behind it stays clickable
                through gaps. The inner row re-enables pointer events.
                Phase 26 Subtask 3: skip when the shape has only one
                flavor (greeting card) — a 1-bubble carousel is dead
                chrome. */}
            {stage === "setup" && shapeConfig.flavors.length > 1 && (
              <div className="pointer-events-none absolute inset-x-0 top-3 z-10 px-2 md:px-6 lg:px-16">
                <div data-tour="flavor-carousel" className="pointer-events-auto">
                  <FloatingFlavorBubbles
                    flavors={shapeConfig.flavors}
                    activeFlavor={activeFlavor}
                    onSelect={setActiveFlavor}
                  />
                </div>
              </div>
            )}

            {/* The Phase 12 Subtask 3 bottom bar (rendered as a sibling
                to the canvas card, fixed to viewport bottom) replaces
                the Phase 11 floating CTA. SetupConfigPanel is still
                hidden on mobile via its own md gate. */}

            {/* Floating canvas action toolbar. Image, text, background-
                color popover (Тло), and a "Скоро" placeholder for shapes.
                Phase 21 Subtask 3: ungated from `mode === "free"` so the
                greeting card (template mode) gets the same toolbar. */}
            {stage === "design" && (
              <div className="pointer-events-auto absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3">
                <FloatingActionButton
                  icon={
                    isUploadingLogo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ImagePlus className="h-4 w-4" />
                    )
                  }
                  label={
                    isUploadingLogo ? "Завантаження…" : "Завантажити фото"
                  }
                  onClick={handleUploadClick}
                  disabled={!canvasReady || isUploadingLogo}
                  dataTour="action-image"
                />
                <FloatingActionButton
                  icon={<Type className="h-4 w-4" />}
                  label="Додати текст"
                  onClick={handleAddText}
                  disabled={!canvasReady}
                  dataTour="action-text"
                />
                <span data-tour="action-background">
                  <BackgroundPopover
                    value={backgroundColor}
                    onChange={setBackgroundColor}
                  />
                </span>
                <FloatingActionButton
                  icon={<Shapes className="h-4 w-4" />}
                  label="Фігури"
                  onClick={() => {}}
                  disabled
                  title="Скоро"
                />
                {/* Phase 32 Subtask 6 / Phase 33: panel triggers
                    relocated to canvas top corners — Layers top-left
                    and Properties top-right — so the bottom action
                    cluster stays focused on design tools (image / text /
                    bg / shapes). Renders below; same `mobileSheet`
                    state still drives the bottom-sheet panels. */}
              </div>
            )}
          </div>
        </div>

        {/* Mobile design stack ordering (Phase 11 Subtask 10):
            JSX order is canvas → RightPanel (properties) → LeftPanel
            (layers) → SetupConfigPanel. On desktop the `lg:order-N`
            classes override JSX order back to layers | canvas | properties. */}

        {/* Right contextual panel — same unmount-when-collapsed behaviour
            as the left panel. */}
        {stage === "design" && !rightCollapsed && (
          <div data-tour="right-panel" className="hidden shrink-0 lg:order-3 lg:block lg:shrink">
            <RightPanel
              active={activeObject}
              onUpdateText={(patch) =>
                canvasRef.current?.updateActiveText(patch)
              }
              onUpdateImage={(patch) =>
                canvasRef.current?.updateActiveImage(patch)
              }
              onAlign={(axis, mode) =>
                canvasRef.current?.alignActiveObject(axis, mode)
              }
              onCollapse={() => setRightCollapsed(true)}
            />
          </div>
        )}

        {/* Left layers panel — fully unmounted during setup OR when the
            collapse chevron has hidden it. The expand affordance in the
            collapsed case is the floating island button rendered inside
            the canvas wrapper. */}
        {stage === "design" && !leftCollapsed && (
          <div data-tour="left-panel" className="hidden shrink-0 lg:order-1 lg:block lg:shrink">
            <LeftPanel
              layers={layers}
              selectedId={selectedId}
              onSelect={handleLayerSelect}
              onDelete={handleLayerDelete}
              onBringForward={handleBringForward}
              onSendBackwards={handleSendBackwards}
              onCollapse={() => setLeftCollapsed(true)}
            />
          </div>
        )}

        {/* Setup-stage right column: config (qty + price + CTA). Hidden on
            mobile (Phase 11 Subtask 9) — phone users see only the carousel
            + chocolate; the advance CTA appears as a floating button inside
            the canvas area instead. */}
        {stage === "setup" && (
          <div className="hidden md:block lg:order-2">
            <SetupConfigPanel
              quantity={quantity}
              onQuantityChange={setQuantity}
              unitPriceCurrent={unitPriceCurrent}
              totalPrice={totalPrice}
              priceChange={priceChange}
              canvasReady={canvasReady}
              onAdvanceToDesign={handleAdvanceToDesign}
              hasDesignContent={hasDesignContent}
              designPreviewUrl={setupPreviewUrl}
            />
          </div>
        )}
      </div>

      {/* BottomBar is design-stage only. Setup uses FloatingFlavorBubbles
          (above canvas) + SetupConfigPanel (right column) instead. */}
      {stage === "design" && (
        <BottomBar
          stage={stage}
          shapeConfig={shapeConfig}
          activeFlavor={activeFlavor}
          onFlavorSelect={setActiveFlavor}
          quantity={quantity}
          onQuantityChange={setQuantity}
          unitPriceCurrent={unitPriceCurrent}
          totalPrice={totalPrice}
          canvasReady={canvasReady}
          onAdvanceToDesign={handleAdvanceToDesign}
          onBackToSetup={handleBackToSetup}
        />
      )}

      {/* Phase 14 Subtask 1: phone setup bottom bar moved INSIDE the
          outer card as the last flex sibling (was previously
          `position: fixed`). With the flex-1 canvas chain, this lets
          the canvas claim every pixel between TopBar and the bottom
          bar with no overlap or invisible band. md:hidden — desktop
          uses SetupConfigPanel as the right column. */}
      {stage === "setup" && (
        <div
          className="flex shrink-0 items-center gap-2 border-t border-stone-200 bg-white px-3 py-2 md:hidden"
          style={{
            paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)",
          }}
        >
          <QtyStepper
            value={quantity}
            onChange={setQuantity}
            min={100}
            max={10000}
            variant="compact"
            dataTour="qty-stepper"
          />
          {totalPrice !== null && (
            <span className="min-w-0 flex-1 truncate text-center text-sm font-semibold tabular-nums text-stone-900">
              {Math.round(totalPrice).toLocaleString("uk-UA")} ₴
            </span>
          )}
          <Button
            data-tour="cta-create-design"
            onClick={handleAdvanceToDesign}
            disabled={!canvasReady}
            className="h-9 gap-1 bg-stone-900 px-3 text-white hover:bg-stone-800"
          >
            {hasDesignContent ? "Редагувати" : "Створити"}
            <ArrowRight className="h-4 w-4" />
          </Button>
          {/* Phase 26 Subtask 3 / Phase 27: submission CTA stays
              exclusively in TopBar. With Phase 27 it activates on the
              setup stage too when `hasDesignContent`, so no need to
              duplicate the Send icon down here. */}
        </div>
      )}

      {/* Hidden file input for the logo uploader */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        disabled={!canvasReady}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleLogoFile(file);
        }}
      />

      {/* Order submission flow — preview export + upload + admin email POST. */}
      <SubmissionDialog
        open={submitOpen}
        onOpenChange={(next) => {
          // Block close while the network call is in flight so the user
          // can't accidentally cancel mid-upload.
          if (isSubmitting && !next) return;
          if (!next) clearPreviewBlobUrl();
          setSubmitOpen(next);
          // Phase 32 Subtask 1: reset success state when the dialog
          // closes so the next open is clean.
          if (!next) setSubmissionSucceeded(false);
        }}
        previewUrl={previewBlobUrl}
        shapeName={shapeConfig.name}
        flavorName={activeFlavor.name}
        quantity={quantity}
        onQuantityChange={setQuantity}
        unitPriceCurrent={unitPriceCurrent}
        totalPrice={totalPrice}
        isSubmitting={isSubmitting}
        submissionSucceeded={submissionSucceeded}
        submittedEmail={submittedEmail}
        onSubmit={handleSubmissionSubmit}
        onNewDesign={handleNewDesign}
      />

      {/* Mobile-only floating typography toolbar (Phase 11 Subtask 12).
          The component itself is `md:hidden` and bails out when no text is
          selected — safe to mount unconditionally. Rendered outside the
          canvas card because it's `position: fixed`.
          Phase 29: also data-tour anchor for the mobile typography
          tour step (the desktop tour points at RightPanel instead). */}
      <div data-tour="floating-toolbar">
        {stage === "design" && (
          <FloatingTypographyToolbar
            active={activeObject}
            canvas={fabricCanvas}
            onUpdateText={(patch) => canvasRef.current?.updateActiveText(patch)}
          />
        )}
      </div>

      {/* Phase 32 Subtask 6: mobile sheets for layers + properties.
          On lg+ these renders are inert (BottomSheet returns null when
          closed AND `lg:hidden` on its wrapper) — the inline panels in
          the grid layout above carry the desktop UX. */}
      <BottomSheet
        open={mobileSheet === "layers"}
        onClose={() => setMobileSheet(null)}
        title="Шари"
      >
        <LeftPanel
          layers={layers}
          selectedId={selectedId}
          onSelect={(id) => {
            handleLayerSelect(id);
            setMobileSheet(null);
          }}
          onDelete={handleLayerDelete}
          onBringForward={handleBringForward}
          onSendBackwards={handleSendBackwards}
          onCollapse={() => setMobileSheet(null)}
        />
      </BottomSheet>

      <BottomSheet
        open={mobileSheet === "properties"}
        onClose={() => setMobileSheet(null)}
        title="Властивості"
      >
        <RightPanel
          active={activeObject}
          onUpdateText={(patch) => canvasRef.current?.updateActiveText(patch)}
          onUpdateImage={(patch) => canvasRef.current?.updateActiveImage(patch)}
          onAlign={(axis, mode) => canvasRef.current?.alignActiveObject(axis, mode)}
          onCollapse={() => setMobileSheet(null)}
        />
      </BottomSheet>

      {/* Phase 29: onboarding tour popover. Anchors to data-tour
          attributes throughout the shell, auto-starts for first-time
          buyers, restartable via TopBar's help button. */}
      {tour.active && tour.currentStep && (
        <TourPopover
          step={tour.currentStep}
          stepIndex={tour.stepIndex}
          totalSteps={tour.totalSteps}
          isMobile={!isDesktop}
          onNext={tour.next}
          onSkip={tour.skip}
        />
      )}

      {/* Confirmation dialog for back-to-setup with placed objects.
          Phase 26 Subtask 4: capped at max-w-sm so the short body
          (one-line description + two buttons) doesn't render as a
          half-viewport panel on desktop. */}
      <Dialog open={confirmBackOpen} onOpenChange={setConfirmBackOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Повернутися до вибору?</DialogTitle>
            <DialogDescription>
              Ваш дизайн буде збережено.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmBackOpen(false)}
            >
              Скасувати
            </Button>
            <Button onClick={handleConfirmBack}>Повернутися</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

/* -------------------------------------------------------------------- */
/* Helpers                                                              */
/* -------------------------------------------------------------------- */

/**
 * Compute the design-stage `lg:grid-cols-[...]` Tailwind class based on
 * the two collapse flags. Tailwind's JIT needs the literal class strings
 * present in the source, hence the explicit enumeration over the four
 * combinations rather than runtime template interpolation.
 */
function designGridColsClass(
  leftCollapsed: boolean,
  rightCollapsed: boolean
): string {
  // Collapsed panel columns are dropped from the grid entirely (the panel
  // is unmounted, so the column would be empty). Canvas's `lg:order-2`
  // still places it correctly relative to whichever panels remain.
  // Phase 23 Subtask 6: panels grow at xl: / 2xl: so they don't read
  // tiny on 1440p+ displays. Canvas absorbs the remainder.
  if (leftCollapsed && rightCollapsed) {
    return "lg:grid-cols-[minmax(0,1fr)]";
  }
  if (leftCollapsed) {
    return "lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_400px]";
  }
  if (rightCollapsed) {
    return "lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[340px_minmax(0,1fr)]";
  }
  return "lg:grid-cols-[260px_minmax(0,1fr)_320px] xl:grid-cols-[300px_minmax(0,1fr)_360px] 2xl:grid-cols-[340px_minmax(0,1fr)_400px]";
}

interface FloatingActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /** Optional native tooltip override (used for the "Скоро" hint on Тло). */
  title?: string;
  /** Phase 29: tour anchor id (mapped to a `data-tour` attribute on the
   *  rendered button). */
  dataTour?: string;
}

function FloatingActionButton({
  icon,
  label,
  onClick,
  disabled,
  title,
  dataTour,
}: FloatingActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      aria-label={label}
      data-tour={dataTour}
      // Phase 23 Subtask 6: bump at xl:/2xl: so the floating cluster
      // remains tappable / readable on 1440p+ desktops.
      className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-md transition hover:bg-stone-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white sm:h-10 sm:w-10 xl:h-12 xl:w-12 2xl:h-14 2xl:w-14 [&>svg]:xl:h-5 [&>svg]:xl:w-5 [&>svg]:2xl:h-6 [&>svg]:2xl:w-6"
    >
      {icon}
    </button>
  );
}

/**
 * Greeting-card side selector. Two-button segmented control driving
 * the `activeSide` state: `outer` (front of card) vs `inner` (back).
 */
function SideToggle({
  active,
  onChange,
}: {
  active: "outer" | "inner";
  onChange: (next: "outer" | "inner") => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Сторона листівки"
      className="inline-flex items-stretch overflow-hidden rounded-md border border-stone-300"
    >
      <button
        type="button"
        role="tab"
        aria-selected={active === "outer"}
        onClick={() => onChange("outer")}
        className={[
          "px-3 py-1.5 text-xs font-medium transition-colors",
          active === "outer"
            ? "bg-stone-900 text-white"
            : "bg-white text-stone-600 hover:bg-stone-50",
        ].join(" ")}
      >
        Зовнішня
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={active === "inner"}
        onClick={() => onChange("inner")}
        className={[
          "border-l border-stone-300 px-3 py-1.5 text-xs font-medium transition-colors",
          active === "inner"
            ? "bg-stone-900 text-white"
            : "bg-white text-stone-600 hover:bg-stone-50",
        ].join(" ")}
      >
        Внутрішня
      </button>
    </div>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  // Defer revocation so the browser has time to start the download. The
  // anchor itself can be removed immediately — only the URL needs to outlive
  // the click handler.
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function readImageDimensions(
  file: File
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(null);
      return;
    }
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const dims = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(url);
      resolve(dims);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}
