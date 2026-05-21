// src/config/builder-shapes.ts
import type {
  SafeZone,
  SafeZonePoint,
  ShapeConfig,
} from "@/types/builder";

/**
 * IMPORTANT: All polygon points are NORMALIZED (0..1) relative to the rendered
 * photo. Points are ordered clockwise from top-left. The canvas multiplies them
 * by the fitted image dimensions at render time, so they survive resize and
 * any future re-shoot at different resolution.
 */

/* ------------------------------------------------------------------------ */
/* Mini bars — per-flavor traced polygons (measured from cropped Figma assets) */
/* ------------------------------------------------------------------------ */

const MINI_SAFE_ZONES: Record<string, SafeZone> = {
  berry:      { points: [{x:0.3192,y:0.3254},{x:0.3559,y:0.3277},{x:0.6426,y:0.3330},{x:0.6823,y:0.3350},{x:0.6771,y:0.6796},{x:0.6426,y:0.6991},{x:0.3559,y:0.6911},{x:0.3192,y:0.6769}] },
  black:      { points: [{x:0.3095,y:0.2983},{x:0.3420,y:0.2841},{x:0.6503,y:0.2804},{x:0.6828,y:0.2933},{x:0.6895,y:0.6521},{x:0.6530,y:0.6587},{x:0.3420,y:0.6587},{x:0.3108,y:0.6551}] },
  coconut:    { points: [{x:0.3127,y:0.3264},{x:0.3430,y:0.3201},{x:0.6525,y:0.3171},{x:0.6875,y:0.3234},{x:0.6882,y:0.6815},{x:0.6525,y:0.6987},{x:0.3430,y:0.6961},{x:0.3152,y:0.6842}] },
  flag:       { points: [{x:0.3219,y:0.3595},{x:0.3673,y:0.3502},{x:0.6434,y:0.3413},{x:0.6739,y:0.3476},{x:0.6771,y:0.6878},{x:0.6429,y:0.7047},{x:0.3681,y:0.7133},{x:0.3311,y:0.7011}] },
  lime:       { points: [{x:0.3155,y:0.3105},{x:0.3512,y:0.3062},{x:0.6443,y:0.2999},{x:0.6865,y:0.3082},{x:0.6905,y:0.6607},{x:0.6491,y:0.6733},{x:0.3517,y:0.6756},{x:0.3155,y:0.6644}] },
  matcha:     { points: [{x:0.3189,y:0.3555},{x:0.3497,y:0.3575},{x:0.6540,y:0.3575},{x:0.6858,y:0.3532},{x:0.6845,y:0.6984},{x:0.6543,y:0.7219},{x:0.3497,y:0.7219},{x:0.3254,y:0.7034}] },
  milk:       { points: [{x:0.3145,y:0.3188},{x:0.3410,y:0.2983},{x:0.6543,y:0.2966},{x:0.6818,y:0.3112},{x:0.6890,y:0.6693},{x:0.6540,y:0.6733},{x:0.3405,y:0.6746},{x:0.3110,y:0.6700}] },
  orange:     { points: [{x:0.3090,y:0.3499},{x:0.3537,y:0.3399},{x:0.6567,y:0.3320},{x:0.6900,y:0.3393},{x:0.6912,y:0.6875},{x:0.6570,y:0.6958},{x:0.3534,y:0.7047},{x:0.3251,y:0.6961}] },
  oreo:       { points: [{x:0.3140,y:0.3423},{x:0.3490,y:0.3366},{x:0.6600,y:0.3323},{x:0.6863,y:0.3340},{x:0.6843,y:0.6839},{x:0.6602,y:0.7017},{x:0.3490,y:0.7060},{x:0.3239,y:0.6944}] },
  strawberry: { points: [{x:0.3204,y:0.3009},{x:0.3497,y:0.2943},{x:0.6577,y:0.3072},{x:0.6905,y:0.3125},{x:0.6840,y:0.6617},{x:0.6577,y:0.6706},{x:0.3495,y:0.6634},{x:0.3165,y:0.6541}] },
  toffee:     { points: [{x:0.3189,y:0.3158},{x:0.3522,y:0.3089},{x:0.6481,y:0.3158},{x:0.6806,y:0.3228},{x:0.6761,y:0.6753},{x:0.6481,y:0.6809},{x:0.3522,y:0.6759},{x:0.3152,y:0.6627}] },
  vanilla:    { points: [{x:0.3162,y:0.3376},{x:0.3507,y:0.3386},{x:0.6401,y:0.3452},{x:0.6853,y:0.3436},{x:0.6858,y:0.6918},{x:0.6406,y:0.7149},{x:0.3504,y:0.7037},{x:0.3182,y:0.6832}] },
};

/* ------------------------------------------------------------------------ */
/* Popular bars — measured per-flavor polygons (Phase 18). 8-point Mini-     */
/* style polygons traced clockwise from top-left in the Figma source. No     */
/* orange flavor in the Popular line.                                        */
/* ------------------------------------------------------------------------ */
const POP_SAFE_ZONES: Record<string, SafeZone> = {
  berry:      { points: [{x:0.3753,y:0.4368},{x:0.4031,y:0.4350},{x:0.5969,y:0.4338},{x:0.6243,y:0.4355},{x:0.6243,y:0.5712},{x:0.5969,y:0.5751},{x:0.4031,y:0.5766},{x:0.3776,y:0.5717}] },
  black:      { points: [{x:0.3743,y:0.4231},{x:0.3952,y:0.4182},{x:0.6025,y:0.4182},{x:0.6237,y:0.4221},{x:0.6270,y:0.5565},{x:0.6025,y:0.5603},{x:0.3952,y:0.5593},{x:0.3727,y:0.5565}] },
  coconut:    { points: [{x:0.3740,y:0.4382},{x:0.3955,y:0.4348},{x:0.6028,y:0.4377},{x:0.6250,y:0.4395},{x:0.6227,y:0.5729},{x:0.6028,y:0.5786},{x:0.3952,y:0.5766},{x:0.3720,y:0.5709}] },
  flag:       { points: [{x:0.3737,y:0.4549},{x:0.3935,y:0.4529},{x:0.6042,y:0.4529},{x:0.6260,y:0.4549},{x:0.6260,y:0.5893},{x:0.6038,y:0.5945},{x:0.3972,y:0.5952},{x:0.3747,y:0.5893}] },
  lime:       { points: [{x:0.3717,y:0.4402},{x:0.3952,y:0.4415},{x:0.6032,y:0.4432},{x:0.6293,y:0.4432},{x:0.6273,y:0.5747},{x:0.6032,y:0.5821},{x:0.3952,y:0.5806},{x:0.3687,y:0.5729}] },
  matcha:     { points: [{x:0.3753,y:0.4355},{x:0.3975,y:0.4348},{x:0.6022,y:0.4370},{x:0.6250,y:0.4382},{x:0.6214,y:0.5697},{x:0.6022,y:0.5754},{x:0.3972,y:0.5739},{x:0.3720,y:0.5675}] },
  milk:       { points: [{x:0.3747,y:0.4283},{x:0.3952,y:0.4234},{x:0.6045,y:0.4234},{x:0.6250,y:0.4286},{x:0.6280,y:0.5630},{x:0.6038,y:0.5655},{x:0.3965,y:0.5647},{x:0.3707,y:0.5618}] },
  oreo:       { points: [{x:0.3786,y:0.4370},{x:0.4031,y:0.4350},{x:0.6019,y:0.4373},{x:0.6257,y:0.4402},{x:0.6227,y:0.5719},{x:0.6019,y:0.5779},{x:0.4028,y:0.5779},{x:0.3750,y:0.5714}] },
  strawberry: { points: [{x:0.3413,y:0.4000},{x:0.3644,y:0.3894},{x:0.5873,y:0.3867},{x:0.6128,y:0.3924},{x:0.6190,y:0.5382},{x:0.5969,y:0.5387},{x:0.3644,y:0.5419},{x:0.3431,y:0.5419}] },
  toffee:     { points: [{x:0.3737,y:0.4315},{x:0.3968,y:0.4296},{x:0.6045,y:0.4298},{x:0.6267,y:0.4315},{x:0.6250,y:0.5632},{x:0.6042,y:0.5689},{x:0.3968,y:0.5689},{x:0.3770,y:0.5647}] },
  vanilla:    { points: [{x:0.3697,y:0.4390},{x:0.3972,y:0.4370},{x:0.6045,y:0.4373},{x:0.6283,y:0.4390},{x:0.6283,y:0.5719},{x:0.6045,y:0.5784},{x:0.3972,y:0.5789},{x:0.3724,y:0.5749}] },
};

/* ------------------------------------------------------------------------ */
/* Greeting card geometry (Phase 16).                                        */
/*                                                                          */
/* The card is a foldable rectangle: 1830 × 1000 logical px embedded inside */
/* a 2016 × 1512 photo. A 120 px fold strip runs vertically through the     */
/* centre, and a ribbon hole (20 px diameter) sits ~95.5 px from each       */
/* outer edge at the vertical midline. Buyers can brand EITHER half of the  */
/* fold strip but not the strip itself, the ribbon-hole dead zones, or the  */
/* photo margin around the card.                                            */
/*                                                                          */
/* SafeZone here is a 12-point polygon traced clockwise from top-left,      */
/* with extra waypoints (9–12) marking where the actual brandable safe      */
/* zones begin — i.e. just past the ribbon-hole clears. The two 4-point     */
/* `brandingZones` quads (left + right) are derived from these waypoints    */
/* and the fold-strip edges.                                                */
/*                                                                          */
/* Both card sides (outer + inner) share the same geometry; they differ     */
/* only by photo + per-side template slots.                                 */
/* ------------------------------------------------------------------------ */
// Phase 24: points reordered into a clean clockwise traversal so the
// dev-editor's preview polyline (and fabric.Polygon rendering) doesn't
// self-intersect. Convention requested by the user:
//   • Top row, six points, LEFT → RIGHT  → indices 0..5
//   • Bottom row, six points, RIGHT → LEFT → indices 6..11
// The polygon closes from index 11 back to index 0 (left edge implicit).
// Geometry is unchanged — only the array order differs. The two
// brandingZones quads below are coordinate-literal (not index-based),
// so they stay valid through the reorder.
const GREETING_SAFE_ZONE_12: SafeZone = {
  points: [
    // Top row, left → right
    { x: 0.0461, y: 0.1687 }, //  0: top-left outer corner
    { x: 0.0955, y: 0.1687 }, //  1: top, after left ribbon-hole clear
    { x: 0.4820, y: 0.1687 }, //  2: top, left edge of fold strip
    { x: 0.5425, y: 0.1687 }, //  3: top, right edge of fold strip
    { x: 0.9050, y: 0.1687 }, //  4: top, before right ribbon-hole clear
    { x: 0.9539, y: 0.1687 }, //  5: top-right outer corner
    // Bottom row, right → left
    { x: 0.9539, y: 0.8300 }, //  6: bottom-right outer corner
    { x: 0.9060, y: 0.8300 }, //  7: bottom, before right ribbon-hole clear
    { x: 0.5425, y: 0.8300 }, //  8: bottom, right edge of fold strip
    { x: 0.4820, y: 0.8300 }, //  9: bottom, left edge of fold strip
    { x: 0.0965, y: 0.8300 }, // 10: bottom, after left ribbon-hole clear
    { x: 0.0461, y: 0.8300 }, // 11: bottom-left outer corner
  ],
};

/* Two 4-point branding-zone quads (left + right of the fold strip).       */
const GREETING_BRANDING_LEFT: SafeZonePoint[] = [
  { x: 0.0955, y: 0.1687 },
  { x: 0.4820, y: 0.1687 },
  { x: 0.4820, y: 0.8300 },
  { x: 0.0955, y: 0.8300 },
];
const GREETING_BRANDING_RIGHT: SafeZonePoint[] = [
  { x: 0.5425, y: 0.1687 },
  { x: 0.9050, y: 0.1687 },
  { x: 0.9050, y: 0.8300 },
  { x: 0.5425, y: 0.8300 },
];

export const BUILDER_SHAPES: Record<string, ShapeConfig> = {
  mini: {
    id: "mini",
    name: "Міні шоколадка",
    mode: "free",
    // Per business clarification: Mini ships only on white paper labels.
    // Single-material array hides the toggle from the UI.
    allowedMaterials: ["paper"],
    nativeImageSize: { width: 1600, height: 1200 },
    canvasAspect: 4 / 3,
    // B2B pricing — separate from B2C catalog. Three-tier table per shape.
    priceTiers: [
      { minQuantity: 100,  pricePerPiece: 19.5 },
      { minQuantity: 500,  pricePerPiece: 18 },
      { minQuantity: 1000, pricePerPiece: 17 },
    ],
    // Phase 23 Subtask 3: carousel order tuned for visual appeal —
    // colorful flavors first, neutral / dark flavors (milk, black)
    // pushed to the end. Flavor IDs untouched so submission payloads
    // and email content keep matching.
    flavors: [
      { id: "mini-flag",       name: "Прапор",        imageSrc: "/builder/mini/flag.webp",       safeZone: MINI_SAFE_ZONES.flag },
      { id: "mini-orange",     name: "Апельсин",      imageSrc: "/builder/mini/orange.webp",     safeZone: MINI_SAFE_ZONES.orange },
      { id: "mini-lime",       name: "Лайм",          imageSrc: "/builder/mini/lime.webp",       safeZone: MINI_SAFE_ZONES.lime },
      { id: "mini-strawberry", name: "Полуниця",      imageSrc: "/builder/mini/strawberry.webp", safeZone: MINI_SAFE_ZONES.strawberry },
      { id: "mini-matcha",     name: "Матча-малина",  imageSrc: "/builder/mini/matcha.webp",     safeZone: MINI_SAFE_ZONES.matcha },
      { id: "mini-vanilla",    name: "Ваніль",        imageSrc: "/builder/mini/vanilla.webp",    safeZone: MINI_SAFE_ZONES.vanilla },
      { id: "mini-berry",      name: "З ягодами",     imageSrc: "/builder/mini/berry.webp",      safeZone: MINI_SAFE_ZONES.berry },
      { id: "mini-oreo",       name: "Орео",          imageSrc: "/builder/mini/oreo.webp",       safeZone: MINI_SAFE_ZONES.oreo },
      { id: "mini-toffee",     name: "Тофі",          imageSrc: "/builder/mini/toffee.webp",     safeZone: MINI_SAFE_ZONES.toffee },
      { id: "mini-coconut",    name: "Кокос",         imageSrc: "/builder/mini/coconut.webp",    safeZone: MINI_SAFE_ZONES.coconut },
      { id: "mini-milk",       name: "Молочна",       imageSrc: "/builder/mini/milk.webp",       safeZone: MINI_SAFE_ZONES.milk },
      { id: "mini-black",      name: "Чорна",         imageSrc: "/builder/mini/black.webp",      safeZone: MINI_SAFE_ZONES.black },
    ],
  },

  popular: {
    id: "popular",
    name: "Популярна шоколадка",
    mode: "free",
    allowedMaterials: ["paper"],
    nativeImageSize: { width: 1600, height: 1200 },
    canvasAspect: 4 / 3,
    // B2B pricing — separate from B2C catalog. Three-tier table per shape.
    priceTiers: [
      { minQuantity: 100,  pricePerPiece: 30.5 },
      { minQuantity: 500,  pricePerPiece: 29 },
      { minQuantity: 1000, pricePerPiece: 27 },
    ],
    // Phase 23 Subtask 3: matching colorful-first order from Mini.
    // No Popular variant of "Апельсин" (Phase 18 — flavor not produced
    // at this size); IDs unchanged so payloads keep aligning.
    flavors: [
      { id: "pop-flag",       name: "Прапор",    imageSrc: "/builder/popular/flag.webp",       safeZone: POP_SAFE_ZONES.flag },
      { id: "pop-lime",       name: "Лайм",      imageSrc: "/builder/popular/lime.webp",       safeZone: POP_SAFE_ZONES.lime },
      { id: "pop-strawberry", name: "Полуниця",  imageSrc: "/builder/popular/strawberry.webp", safeZone: POP_SAFE_ZONES.strawberry },
      { id: "pop-matcha",     name: "Матча",     imageSrc: "/builder/popular/matcha.webp",     safeZone: POP_SAFE_ZONES.matcha },
      { id: "pop-vanilla",    name: "Ваніль",    imageSrc: "/builder/popular/vanilla.webp",    safeZone: POP_SAFE_ZONES.vanilla },
      { id: "pop-berry",      name: "З ягодами", imageSrc: "/builder/popular/berry.webp",      safeZone: POP_SAFE_ZONES.berry },
      { id: "pop-oreo",       name: "Орео",      imageSrc: "/builder/popular/oreo.webp",       safeZone: POP_SAFE_ZONES.oreo },
      { id: "pop-toffee",     name: "Тофі",      imageSrc: "/builder/popular/toffee.webp",     safeZone: POP_SAFE_ZONES.toffee },
      { id: "pop-coconut",    name: "Кокос",     imageSrc: "/builder/popular/coconut.webp",    safeZone: POP_SAFE_ZONES.coconut },
      { id: "pop-milk",       name: "Молочна",   imageSrc: "/builder/popular/milk.webp",       safeZone: POP_SAFE_ZONES.milk },
      { id: "pop-black",      name: "Чорна",     imageSrc: "/builder/popular/black.webp",      safeZone: POP_SAFE_ZONES.black },
    ],
  },

  /**
   * Greeting card: a TEMPLATE shape with TWO sides modelled as flavors
   * (Phase 16). The buyer designs each side independently, switching
   * via the side selector. Each side carries its own photo, branding
   * zones (left + right of the fold strip), and template slots. Per-
   * flavor `templateSlots` replace the previous shape-level config so
   * the slots can differ per side.
   */
  "greeting-card": {
    id: "greeting-card",
    name: "Листівка",
    mode: "template",
    allowedMaterials: ["paper"],
    // Phase 31 Subtask 3: setup stage has no flavor list (one product
    // only) so "Смаки" reads wrong. "Товар" matches what the back
    // button leads to — the qty / bg config screen.
    flavorPickerLabel: "Товар",
    // /branded selector card cycles outer.png / inner.png + two
    // real-world example shots via CoverCycler — cardCoverSrc is left
    // unset (the /branded page builds the cover src list itself).
    // Phase 19: card draws via SVG at /public/builder/greeting-card/
    // template.svg. Virtual canvas remains 2016×1512 to match the
    // 12-point safeZone polygon's normalization (card occupies x=
    // 0.0461..0.9539, y=0.1687..0.8300 within the virtual canvas).
    // SVG asset is positioned + scaled to that card region by
    // ConstructorCanvas.
    nativeImageSize: { width: 2016, height: 1512 },
    canvasAspect: 2016 / 1512,
    // B2B pricing — separate from B2C catalog. Three-tier table per shape.
    priceTiers: [
      { minQuantity: 100,  pricePerPiece: 30 },
      { minQuantity: 500,  pricePerPiece: 29 },
      { minQuantity: 1000, pricePerPiece: 28 },
    ],
    flavors: [
      // Phase 22 Subtask 1: greeting card is ONE product, not two
      // flavors. The two physical sides (outer + inner) live as a
      // dedicated `activeSide` toggle in BuilderShell — both sides
      // share this one flavor entry and ship together as a single
      // card. Carousel shows one bubble; side selector handles outer
      // vs inner switching with per-side object persistence.
      {
        // Phase 27: canvas reverted to the schematic SVG; the new
        // outer.png + inner.png live on the /branded selector card
        // only (rendered via CoverCycler). The buyer's editing surface
        // stays clean + line-art so user content dominates the visual.
        id: "greeting-card",
        name: "Листівка",
        imageSrc: "/builder/greeting-card/template.svg",
        safeZone: GREETING_SAFE_ZONE_12,
        brandingZones: [GREETING_BRANDING_LEFT, GREETING_BRANDING_RIGHT],
      },
    ],
  },
};
