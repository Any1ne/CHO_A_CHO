// src/types/builder.ts
export type MaterialType = "paper" | "transparent";

/** A single point in NORMALIZED coordinates (0..1) relative to the rendered photograph. */
export interface SafeZonePoint {
  x: number; // 0..1, fraction of image width
  y: number; // 0..1, fraction of image height
}

/**
 * Polygon describing where user content (logo, text) is allowed to live on the
 * chocolate's photograph. Points are ordered clockwise from top-left and the
 * polygon is treated as closed (last point connects back to first).
 *
 * Normalized to the rendered photo so safe zones survive any canvas resize.
 */
export interface SafeZone {
  points: SafeZonePoint[];
}

/**
 * Rectangle box used by template slots (greeting cards). Slots are pre-defined
 * image/text fields that the user fills — not free canvases — so a rectangle
 * (not a traced polygon) is sufficient.
 */
export interface SlotBox {
  x: number;       // 0..1, fraction of image width
  y: number;       // 0..1, fraction of image height
  width: number;   // 0..1
  height: number;  // 0..1
}

/**
 * For products where the photograph is intentionally not perfectly centered
 * (which is most of them — they were shot by hand). Each flavor stores
 * how much its base image needs to be nudged so the chocolate body lines up
 * with neighbouring flavors when switching.
 */
export interface ImageAlignment {
  offsetX?: number; // px in the source image's own coordinate system
  offsetY?: number;
}

/**
 * One editable slot inside a TEMPLATE (used by greeting cards).
 * Templates differ from chocolates: the user does NOT freely place
 * objects — they fill predefined zones (a photo box and 1..n text fields).
 */
export type TemplateSlot =
  | {
      kind: "image";
      id: string;
      label: string;             // shown in UI: "Ваше фото"
      box: SlotBox;
      placeholder?: string;      // path to a placeholder asset
    }
  | {
      kind: "text";
      id: string;
      label: string;             // "Привітання", "Підпис"
      box: SlotBox;
      defaultText: string;
      fontFamily: string;        // resolved against the loaded font set
      fontSize: number;          // px at canvas-native size; canvas re-scales
      color: string;             // hex
      align: "left" | "center" | "right";
      maxChars?: number;
    };

export interface FlavorConfig {
  id: string;
  name: string;
  imageSrc: string | null;       // /builder/<shape>/<flavor>.webp (the photo). null on flavors rendered procedurally (greeting card sides) — no photo asset, fabric draws the surface from primitives.
  shadowSrc?: string;            // optional photographic shadow overlay (PNG with alpha)
  highlightSrc?: string;         // optional photographic highlight overlay (PNG with alpha)
  safeZone: SafeZone;            // normalized polygon
  alignment?: ImageAlignment;    // per-image nudge if the photo is off-center
  /**
   * Optional 4-point quads describing the actual brandable rectangles
   * within the safe-zone polygon. Used by the greeting card's per-side
   * layout where the buyer can place content on EITHER half of the fold
   * strip but not on the strip / ribbon-hole zones themselves. Each quad
   * is clockwise-from-top-left, normalized to the underlying photo. Left
   * empty on chocolates — they use the front-face derivation in
   * `getBrandingZone`.
   */
  brandingZones?: SafeZonePoint[][];
  /**
   * Per-flavor template slots. Used by greeting card sides to define
   * which rectangular zones on the photo the buyer should fill in
   * (e.g. "Тут може бути ваш логотип" placeholder). Chocolates leave
   * this empty — they're free-mode shapes.
   */
  templateSlots?: TemplateSlot[];
}

export interface ShapeConfig {
  id: string;
  name: string;
  /**
   * "free": user freely places logo + arbitrary text (chocolates).
   * "template": user fills predefined slots (greeting cards).
   */
  mode: "free" | "template";
  /**
   * Material toggle is shown ONLY when allowedMaterials.length > 1
   * AND the shape supports it. For Mini/Popular bars it's a single
   * material — the toggle won't render.
   */
  allowedMaterials: MaterialType[];
  /** Native pixel size of the photographs in this shape (all flavors must match). */
  nativeImageSize: { width: number; height: number };
  /** Default aspect ratio the canvas should reserve, prevents layout shift. */
  canvasAspect: number;          // width / height
  flavors: FlavorConfig[];
  templateSlots?: TemplateSlot[]; // required when mode === "template"
  /**
   * Tiered B2B pricing. Each tier carries a minimum quantity threshold +
   * the per-piece price that applies once order quantity reaches it. The
   * builder picks the highest-threshold tier whose minQuantity ≤ current
   * quantity (see `getPricePerPiece` in lib/builder/pricing.ts). Below
   * the lowest threshold the helper falls back to the lowest tier's
   * price — the builder doesn't enforce a hard minimum order quantity
   * client-side; that's a /branded copy concern.
   */
  priceTiers?: PriceTier[];
  /**
   * Image used on /branded selector cards. Defaults to `flavors[0].imageSrc`
   * when absent — useful for shapes whose first flavor IS visually
   * representative. The greeting card overrides this because its
   * canonical asset (the SVG template) is a schematic, not a photo;
   * a real example image is shown on the selector card instead.
   */
  cardCoverSrc?: string;
  /**
   * Phase 31 Subtask 3: copy for the back-to-setup button in the
   * TopBar. Defaults to "Смаки" (Flavors) — fits chocolates with
   * multiple variants. Greeting card uses "Товар" (Product) because
   * there's only one flavor + the setup stage just collects qty + bg
   * colour.
   */
  flavorPickerLabel?: string;
}

export interface PriceTier {
  /** Minimum order quantity at which this per-piece price activates. */
  minQuantity: number;
  /** Per-piece price in UAH. Float allowed (e.g. 19.5). */
  pricePerPiece: number;
}
