// src/app/(routes)/builder/layout.tsx
//
// Builder-specific layout. The global Header + Footer are suppressed by
// `SiteChrome` (root layout) on /builder/* routes — this layout is the
// minimal flex container the builder pages render inside. No max-width
// container, no horizontal padding, no top margin: the canvas owns the
// viewport.

import type { ReactNode } from "react";

export default function BuilderLayout({ children }: { children: ReactNode }) {
  // Phase 16: full-viewport-height layout. `h-screen` pins the outer
  // container to exactly the viewport height; `overflow-hidden` blocks
  // any inner overflow from spilling out and creating page-level scroll.
  // Combined with the flex-col chain inside, the builder occupies the
  // full window with no scroll on desktop — chrome (TopBar / panels /
  // bottom bar) framing a canvas that fills the remaining space.
  // Phase 21 Subtask 1: `h-dvh` (dynamic viewport height) accounts for
  // mobile-browser chrome (Chrome / Safari URL bar) collapsing in/out
  // on scroll. `h-screen` (= 100vh) reserves height as if URL bar were
  // hidden, which on phone clipped the bottom CTA when the URL bar
  // was visible. Falls back to vh in browsers that don't understand
  // dvh — Tailwind emits both via the dvh util, so support is safe.
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-stone-50">
      {children}
    </div>
  );
}
