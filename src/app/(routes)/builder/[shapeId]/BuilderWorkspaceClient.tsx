"use client";

import dynamic from "next/dynamic";
import { ShapeConfig } from "@/types/builder";

// We dynamically import the heavy Fabric.js workspace and disable SSR.
// Doing this inside a "use client" file satisfies Next.js 15 rules.
const BuilderShell = dynamic(
  () => import("@/components/Builder/BuilderShell"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[600px] w-full bg-stone-50">
        <p className="text-stone-500">Завантаження робочої області...</p>
      </div>
    ),
  }
);

interface BuilderWorkspaceClientProps {
  shapeConfig: ShapeConfig;
}

export default function BuilderWorkspaceClient({
  shapeConfig,
}: BuilderWorkspaceClientProps) {
  return <BuilderShell shapeConfig={shapeConfig} />;
}