// src/components/Builder/useCanvasHistory.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fabric } from "fabric";

const MAX_HISTORY = 30;
// Custom keys we tag onto user-added fabric objects in ConstructorCanvas. They
// must be listed for `obj.toObject(...)` so they survive serialization,
// otherwise the restore path can't tell user objects from guides.
const SERIALIZED_PROPS: string[] = ["__bid", "__bname"];

export interface CanvasHistory {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  /**
   * Seed the initial snapshot. Caller invokes this AFTER the canvas's first
   * onCanvasReady fires — capturing earlier (e.g. on canvas mount) would
   * snapshot a state without the photo background, and undo would later
   * restore that empty state, blanking the photo.
   */
  seedInitial: () => void;
}

export interface CanvasHistoryOptions {
  /** Current paper / multiply-blend color, captured into each entry. */
  backgroundColor: string | null;
  /** Setter used by undo/redo to restore the captured backgroundColor. */
  setBackgroundColor: (next: string | null) => void;
  /**
   * Called for each enlivened user object after restore. Consumer re-applies
   * runtime-only properties (selection controls, clipPath, custom close
   * button) that don't survive serialization.
   */
  postRestoreUserObject: (obj: fabric.Object) => void;
  /**
   * Called once after all user objects have been restored and added back to
   * the canvas. Consumer typically re-runs restackLayers + requestRenderAll
   * so guides return to their pinned z-order and the new objects paint.
   */
  finalizeRestore: () => void;
}

interface HistoryEntry {
  objects: unknown[];
  backgroundColor: string | null;
}

interface BuilderTagged {
  __bid?: string;
}

/**
 * Stack-based undo / redo for a fabric.Canvas. Captures only USER objects
 * (those tagged with `__bid`) plus the current backgroundColor — never the
 * photo background, never the guide layers. This way a restore can't blank
 * the chocolate photo and can't accidentally re-instantiate guide polygons
 * that the canvas component manages itself.
 *
 * Triggers (each pushes one entry, capped at MAX_HISTORY):
 *   • fabric `object:added` / `object:modified` / `object:removed` for any
 *     object carrying `__bid` — i.e. only buyer-placed logos / text.
 *   • A useEffect on `options.backgroundColor` — captures Тло picks.
 *
 * Suppression: during a restore (in undo / redo), a ref blocks both trigger
 * paths so the restore itself doesn't push new entries.
 */
export function useCanvasHistory(
  canvas: fabric.Canvas | null,
  options: CanvasHistoryOptions
): CanvasHistory {
  const undoStackRef = useRef<HistoryEntry[]>([]);
  const redoStackRef = useRef<HistoryEntry[]>([]);
  const suppressRef = useRef(false);
  const skipNextBgCaptureRef = useRef(false);
  const seededRef = useRef(false);
  const [, forceTick] = useState(0);
  const bumpTick = useCallback(() => forceTick((t) => t + 1), []);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const takeSnapshot = useCallback((): HistoryEntry => {
    if (!canvas) {
      return { objects: [], backgroundColor: optionsRef.current.backgroundColor };
    }
    const objects = canvas
      .getObjects()
      .filter((o) => (o as unknown as BuilderTagged).__bid)
      .map((o) => o.toObject(SERIALIZED_PROPS));
    return {
      objects,
      backgroundColor: optionsRef.current.backgroundColor,
    };
  }, [canvas]);

  const captureNow = useCallback(() => {
    if (!canvas) return;
    if (suppressRef.current) return;
    if (!seededRef.current) return;
    undoStackRef.current.push(takeSnapshot());
    if (undoStackRef.current.length > MAX_HISTORY) {
      undoStackRef.current.shift();
    }
    redoStackRef.current = [];
    bumpTick();
  }, [canvas, takeSnapshot, bumpTick]);

  // User-object events
  useEffect(() => {
    if (!canvas) return;
    const handler = (e: fabric.IEvent) => {
      const target = e.target;
      if (!target) return;
      // Phase 15 Subtask 6: when fabric finishes a multi-select drag /
      // rotate / scale, the event target is the transient
      // ActiveSelection group. Its children carry __bid but the group
      // itself does not, so the original guard skipped the snapshot —
      // and the children's left/top were still in selection-local
      // coordinates, never flushed to absolute. Discard the selection
      // here: fabric commits each child's absolute transform during
      // discardActiveObject, then we snapshot the freshly-flushed
      // state. The user loses their multi-select after the action,
      // which matches Figma's behavior on undo / commit.
      if (target.type === "activeSelection") {
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        captureNow();
        return;
      }
      if (!(target as unknown as BuilderTagged).__bid) return;
      captureNow();
    };
    canvas.on("object:added", handler);
    canvas.on("object:modified", handler);
    canvas.on("object:removed", handler);
    return () => {
      canvas.off("object:added", handler);
      canvas.off("object:modified", handler);
      canvas.off("object:removed", handler);
    };
  }, [canvas, captureNow]);

  // Background color captures — Тло picks aren't fabric events, so listen
  // on the value itself. Restore writes set skipNextBgCaptureRef so the
  // resulting setBackgroundColor doesn't recursively push another entry.
  useEffect(() => {
    if (!seededRef.current) return;
    if (skipNextBgCaptureRef.current) {
      skipNextBgCaptureRef.current = false;
      return;
    }
    captureNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.backgroundColor]);

  const seedInitial = useCallback(() => {
    if (seededRef.current) return;
    if (!canvas) return;
    undoStackRef.current = [takeSnapshot()];
    redoStackRef.current = [];
    seededRef.current = true;
    bumpTick();
  }, [canvas, takeSnapshot, bumpTick]);

  const restore = useCallback(
    (entry: HistoryEntry) => {
      if (!canvas) return;
      suppressRef.current = true;
      // Phase 14 Subtask 6: drop the active selection BEFORE removing the
      // user objects. Without this, fabric's transient ActiveSelection
      // group keeps its stale bounding box (the blue group frame plus
      // each object's individual frame) painted over the canvas after
      // restore — even though the underlying objects have been replaced
      // with the snapshot's enlivened copies.
      canvas.discardActiveObject();
      // Remove ONLY current user objects. Photo + guides untouched.
      canvas
        .getObjects()
        .filter((o) => (o as unknown as BuilderTagged).__bid)
        .forEach((o) => canvas.remove(o));

      // Restore the captured background color; the bg-watching useEffect
      // would otherwise push a new history entry, so flag it to skip.
      if (optionsRef.current.backgroundColor !== entry.backgroundColor) {
        skipNextBgCaptureRef.current = true;
        optionsRef.current.setBackgroundColor(entry.backgroundColor);
      }

      const finishRestore = () => {
        optionsRef.current.finalizeRestore();
        canvas.requestRenderAll();
        suppressRef.current = false;
      };

      if (entry.objects.length === 0) {
        finishRestore();
        return;
      }

      fabric.util.enlivenObjects(
        entry.objects as fabric.Object[],
        (objs: fabric.Object[]) => {
          objs.forEach((obj) => {
            optionsRef.current.postRestoreUserObject(obj);
            canvas.add(obj);
          });
          finishRestore();
        },
        ""
      );
    },
    [canvas]
  );

  const undo = useCallback(() => {
    if (!canvas) return;
    if (undoStackRef.current.length < 2) return;
    const current = undoStackRef.current.pop()!;
    redoStackRef.current.push(current);
    if (redoStackRef.current.length > MAX_HISTORY) {
      redoStackRef.current.shift();
    }
    const previous =
      undoStackRef.current[undoStackRef.current.length - 1];
    restore(previous);
    bumpTick();
  }, [canvas, restore, bumpTick]);

  const redo = useCallback(() => {
    if (!canvas) return;
    if (redoStackRef.current.length === 0) return;
    const next = redoStackRef.current.pop()!;
    undoStackRef.current.push(next);
    restore(next);
    bumpTick();
  }, [canvas, restore, bumpTick]);

  return {
    canUndo: undoStackRef.current.length > 1,
    canRedo: redoStackRef.current.length > 0,
    undo,
    redo,
    seedInitial,
  };
}
