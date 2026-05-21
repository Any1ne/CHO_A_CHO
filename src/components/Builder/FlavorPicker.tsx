// src/components/Builder/FlavorPicker.tsx
"use client";

import Image from "next/image";
import type { FlavorConfig } from "@/types/builder";

interface FlavorPickerProps {
  flavors: FlavorConfig[];
  activeFlavor: FlavorConfig;
  onSelect: (flavor: FlavorConfig) => void;
}

export default function FlavorPicker({
  flavors,
  activeFlavor,
  onSelect,
}: FlavorPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Виберіть смак"
      className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]"
      style={{ scrollSnapType: "x mandatory" }}
    >
      {flavors.map((flavor) => {
        const active = flavor.id === activeFlavor.id;
        return (
          <button
            key={flavor.id}
            role="radio"
            aria-checked={active}
            aria-label={flavor.name}
            onClick={() => onSelect(flavor)}
            className={[
              "group relative flex h-20 w-20 shrink-0 flex-col items-center overflow-hidden rounded-xl border transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2",
              active
                ? "border-amber-600 ring-2 ring-amber-600/30"
                : "border-stone-200 hover:border-stone-300",
            ].join(" ")}
            style={{ scrollSnapAlign: "start" }}
            title={flavor.name}
          >
            {flavor.imageSrc ? (
              <Image
                src={flavor.imageSrc}
                alt=""
                fill
                sizes="80px"
                unoptimized={flavor.imageSrc.toLowerCase().endsWith(".svg")}
                className="object-cover"
              />
            ) : (
              <span
                aria-hidden
                className="absolute inset-0 flex items-center justify-center text-2xl font-semibold text-stone-700"
                style={{ backgroundColor: "#F8F4ED" }}
              >
                {flavor.name.charAt(0)}
              </span>
            )}
            <span
              className={[
                "absolute inset-x-0 bottom-0 truncate px-1.5 py-1 text-[10px] font-medium leading-tight text-white",
                "bg-gradient-to-t from-black/70 to-transparent",
                active ? "opacity-100" : "opacity-0 group-hover:opacity-100",
              ].join(" ")}
            >
              {flavor.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}