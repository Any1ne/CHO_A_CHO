// src/lib/builder/persistence.ts
//
// Phase 31 Subtask 2: per-shape draft persistence in localStorage. The
// builder snapshots the buyer's current state (quantity, active flavor /
// side, background colour, user objects) every ~600 ms via the
// useAutoSave hook. On next visit to the same `/builder/<shapeId>`
// route, the draft restores everything so the buyer can pick up where
// they left off.
//
// Limits:
//   • localStorage quota is ~5 MB per origin. Fabric objects are
//     serialized with their image src — for Supabase-hosted uploads
//     that's just a short URL. Inline data URLs would explode the
//     payload; current code only ever points at Supabase URLs.
//   • Drafts older than 30 days auto-purge on load so the storage
//     doesn't accumulate stale state from one-off visits.
//   • Failures (private mode, quota exceeded, JSON parse error) are
//     swallowed — persistence is best-effort, never blocking.

export interface SavedDesign {
  version: 1;
  shapeId: string;
  flavorId: string;
  /** Greeting card only — which face was last visible. */
  activeSide?: "outer" | "inner";
  /** Greeting card only — serialized user objects per side. */
  objectsBySide?: {
    outer: unknown[];
    inner: unknown[];
  };
  quantity: number;
  backgroundColor: string | null;
  /** Serialized fabric.Object.toObject() output for the active side
   *  (or for the whole canvas on chocolates). */
  objects: unknown[];
  savedAt: number;
}

const STORAGE_KEY_PREFIX = "cho-a-cho.draft.";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

/* ---------------- save-state pub/sub (Phase 32 Subtask 3) ------------- */
// Module-level listener registry so any consumer (SaveIndicator) can
// reflect the most recent save attempt without prop-drilling. Three
// states: `saving` fires before the write, `saved` on success, `error`
// on quota / private-mode failure.
export type SaveState = "idle" | "saving" | "saved" | "error";

let lastState: SaveState = "idle";
const listeners = new Set<(s: SaveState) => void>();

function notify(state: SaveState) {
  lastState = state;
  listeners.forEach((fn) => fn(state));
}

export function getSaveState(): SaveState {
  return lastState;
}

export function subscribeSaveState(fn: (s: SaveState) => void): () => void {
  listeners.add(fn);
  // Push the current state immediately so subscribers don't render an
  // "idle" placeholder during the first paint frame.
  fn(lastState);
  return () => {
    listeners.delete(fn);
  };
}

function keyFor(shapeId: string): string {
  return `${STORAGE_KEY_PREFIX}${shapeId}`;
}

export function saveDesignDraft(design: SavedDesign): void {
  if (typeof window === "undefined") return;
  notify("saving");
  try {
    window.localStorage.setItem(keyFor(design.shapeId), JSON.stringify(design));
    notify("saved");
  } catch {
    notify("error");
  }
}

export function loadDesignDraft(shapeId: string): SavedDesign | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(keyFor(shapeId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedDesign;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      parsed.version !== 1 ||
      typeof parsed.savedAt !== "number"
    ) {
      return null;
    }
    if (Date.now() - parsed.savedAt > TTL_MS) {
      clearDesignDraft(shapeId);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearDesignDraft(shapeId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(keyFor(shapeId));
  } catch {
    /* ignore */
  }
}
