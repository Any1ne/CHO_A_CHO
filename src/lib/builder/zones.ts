// src/lib/builder/zones.ts
//
// Vocabulary
// ----------
// The chocolate-builder uses two distinct polygon concepts derived from the
// same underlying SafeZone data structure. Naming is preserved on the type
// (`SafeZone` / `safeZone`) to avoid an invasive cross-codebase rename, but
// the SEMANTIC distinction below is the source of truth for any new code.
//
//   • Rubber band — the full 8-point polygon traced around the paper strip
//     wrapping the chocolate (left face → front face → right face). Stored
//     directly on `FlavorConfig.safeZone`. Used as the clipPath for the
//     paper-texture overlay and as the geometric base for shadow / face
//     guides. NOT the place where user content lives.
//
//   • Branding zone — the front-face quad. The printable region a customer
//     sees head-on. Derived from rubber-band points [1, 2, 5, 6]. Used as
//     the clipPath for user objects, the polygon for the background-color
//     fill, the bbox for alignment snapping, and the centroid for default
//     placement. Side faces are intentionally excluded — Phase 4 may add
//     side-color editing as a separate concept.
//
// Helper:
//
//   getBrandingZone(safeZone) → SafeZone
//
// For an 8-point rubber-band polygon (Mini layout: clockwise from the left
// face's top-left, see CLAUDE.md "Type system + polygon point ordering"),
// returns a 4-point SafeZone containing only the front-face corners. For
// any other point count (greeting cards, future shapes), returns the input
// unchanged so the caller falls back to the full polygon. Pure — never
// mutates the input.

import type { SafeZone } from "@/types/builder";

/**
 * Indices of the front-face quad inside the 8-point rubber-band polygon.
 * Mirrors the FRONT_INDICES constant inside ConstructorCanvas; kept in sync
 * by convention. Centralised here so non-canvas modules (alignment helpers,
 * placement utils) don't have to reach into the canvas file.
 */
const FRONT_FACE_INDICES = [1, 2, 5, 6] as const;

/**
 * Extract the branding zone from a rubber-band safe zone.
 *
 *   • 8-point input → branding zone = points[1,2,5,6] (front-face quad).
 *   • Any other point count → returned as-is. Greeting cards (`mode: "template"`)
 *     never call this path — their content lives in `templateSlots` — so the
 *     fallback covers placeholder shapes that haven't been measured yet.
 */
export function getBrandingZone(safeZone: SafeZone): SafeZone {
  const points = safeZone.points;
  if (points.length === 8) {
    return {
      points: FRONT_FACE_INDICES.map((i) => points[i]),
    };
  }
  return safeZone;
}
