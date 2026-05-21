// src/components/Builder/fonts.ts
//
// next/font/google calls run at module load (build-time on the server). We use
// `variable` mode so applying the resulting className to a wrapper element only
// defines a CSS variable — it does NOT override font-family on that element.
// That lets us apply all four font classNames simultaneously on <main>, which
// is what causes Next to emit the @font-face rules.
//
// For Fabric.js text rendering, use the `family` field — the literal hashed
// CSS family string (e.g. `'__Inter_e8ce0c', '__Inter_Fallback_e8ce0c'`) —
// and pass it to fabric.IText as `fontFamily`.

import {
  Inter,
  Lobster,
  Montserrat,
  Playfair_Display,
  Roboto,
} from "next/font/google";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-builder-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-builder-playfair",
});

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-builder-montserrat",
});

const lobster = Lobster({
  subsets: ["latin", "cyrillic"],
  weight: ["400"],
  display: "swap",
  variable: "--font-builder-lobster",
});

const roboto = Roboto({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-builder-roboto",
});

export interface BuilderFont {
  id: string;
  label: string;
  /** Resolved CSS font-family string (hashed by next/font). Use this in Fabric. */
  family: string;
}

// System / web-safe fonts pass through the literal family string. They
// don't need next/font loading because the user's OS already has them.
export const BUILDER_FONTS: BuilderFont[] = [
  { id: "inter",      label: "Inter",            family: inter.style.fontFamily },
  { id: "roboto",     label: "Roboto",           family: roboto.style.fontFamily },
  { id: "montserrat", label: "Montserrat",       family: montserrat.style.fontFamily },
  { id: "playfair",   label: "Playfair Display", family: playfair.style.fontFamily },
  { id: "lobster",    label: "Lobster",          family: lobster.style.fontFamily },
  { id: "arial",      label: "Arial",            family: "Arial, sans-serif" },
  { id: "helvetica",  label: "Helvetica",        family: "Helvetica, Arial, sans-serif" },
  { id: "georgia",    label: "Georgia",          family: "Georgia, serif" },
  { id: "times",      label: "Times New Roman",  family: '"Times New Roman", Times, serif' },
  { id: "courier",    label: "Courier New",      family: '"Courier New", Courier, monospace' },
  { id: "verdana",    label: "Verdana",          family: "Verdana, sans-serif" },
  { id: "tahoma",     label: "Tahoma",           family: "Tahoma, sans-serif" },
];

export const DEFAULT_BUILDER_FONT = BUILDER_FONTS[0]; // Inter

/**
 * Apply this className to the wrapping element of /builder/[shapeId] so Next
 * emits the @font-face CSS for the four fonts. Variable mode means it does
 * NOT alter font-family on the wrapper.
 */
export const builderFontVariables = [
  inter.variable,
  playfair.variable,
  montserrat.variable,
  lobster.variable,
  roboto.variable,
].join(" ");
