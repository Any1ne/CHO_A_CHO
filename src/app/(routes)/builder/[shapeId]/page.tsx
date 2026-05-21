// src/app/(routes)/builder/[shapeId]/page.tsx
import { notFound } from "next/navigation";
import type { Viewport, Metadata } from "next";
import { BUILDER_SHAPES } from "@/config/builder-shapes";
import { builderFontVariables } from "@/components/Builder/fonts";
import BuilderWorkspaceClient from "./BuilderWorkspaceClient";

// Disable pinch-zoom on the page so canvas pinch gestures aren't hijacked
// by the browser. Only safe to do on routes that genuinely need it.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

type Props = { params: Promise<{ shapeId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shapeId } = await params;
  const shape = BUILDER_SHAPES[shapeId];
  if (!shape) return { title: "Конструктор | Cho a Cho" };
  return {
    title: `Конструктор: ${shape.name} | Cho a Cho B2B`,
    description: `Створіть власний дизайн для ${shape.name.toLowerCase()} — завантажте логотип, додайте текст, отримайте прев'ю.`,
    robots: { index: false, follow: true }, // builder pages aren't for SEO
  };
}

export async function generateStaticParams() {
  return Object.keys(BUILDER_SHAPES).map((shapeId) => ({ shapeId }));
}

export default async function BuilderPage({ params }: Props) {
  const { shapeId } = await params;
  const shapeConfig = BUILDER_SHAPES[shapeId];
  if (!shapeConfig) notFound();

  return (
    <main className={`flex min-h-0 flex-1 flex-col bg-stone-50 ${builderFontVariables}`}>
      {/* Phase 30 Subtask 2: server-side breadcrumb dropped. The
          breadcrumb now lives inside BuilderShell as a client component
          (`BuilderBreadcrumb`) so it can host the shape-switcher
          Popover + the onboarding help button (both need React state). */}
      <BuilderWorkspaceClient shapeConfig={shapeConfig} />
    </main>
  );
}