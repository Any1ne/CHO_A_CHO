"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Client wrapper that renders the global header / footer everywhere EXCEPT
 * the builder. The builder is a full-screen design surface — header banner
 * and footer chrome eat vertical space the canvas needs and visually
 * compete with TopBar's product line.
 *
 * The root layout is a server component without access to `usePathname`,
 * so the header / footer slots are passed in as `ReactNode` props and
 * this wrapper decides whether to render them based on the route.
 */
export default function SiteChrome({
  header,
  footer,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const path = usePathname();
  const isBuilder = path?.startsWith("/builder") ?? false;
  return (
    <>
      {!isBuilder && header}
      {children}
      {!isBuilder && footer}
    </>
  );
}
