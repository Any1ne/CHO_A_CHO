import FadeCarousel from "@/components/Main/FadeCarousel";
import Advantages from "@/components/Main/Advantages";

export type BannerSlide = {
  src: string;
  href: string;
};

/**
 * Production banner set. Exported so the /banner-preview review tool can
 * preload the exact same slides the homepage ships. Editing the live
 * banners is a manual change to this array (no CMS / backend).
 */
export const DEFAULT_SLIDES: BannerSlide[] = [
  // {
  //   src: "https://9qy6ktzgsu2nlgvi.public.blob.vercel-storage.com/webbanner/0.webp",
  //   href: "/",
  // },
  {
    src: "https://9qy6ktzgsu2nlgvi.public.blob.vercel-storage.com/webbanner/5.webp",
    href: "/branded",
  },
  {
    src: "https://9qy6ktzgsu2nlgvi.public.blob.vercel-storage.com/webbanner/1.webp",
    href: "/branded",
  },
  {
    src: "https://9qy6ktzgsu2nlgvi.public.blob.vercel-storage.com/webbanner/2.webp",
    href: "/",
  },
  {
    src: "https://9qy6ktzgsu2nlgvi.public.blob.vercel-storage.com/webbanner/3.webp",
    href: "/",
  },
];

type Props = {
  /** Override the slide set (review tool). Defaults to the production set. */
  slides?: BannerSlide[];
  /** Forwarded to FadeCarousel — needed for data-URL / arbitrary-URL slides. */
  unoptimized?: boolean;
  /** Forwarded to FadeCarousel — CSS object-position for crop testing. */
  objectPosition?: string;
  /** Forwarded to FadeCarousel — disable slide click-through (stage preview). */
  disableNav?: boolean;
};

export default function WebBanner({
  slides = DEFAULT_SLIDES,
  unoptimized,
  objectPosition,
  disableNav,
}: Props) {
  return (
    <div className="flex flex-col px-2 md:px-10 py-5 gap-2">
      {/* Carousel.
          Safari fix: the box height is set EXPLICITLY via clamp() instead of
          `aspect-[16/9] + max-h`. Reason — next/image `fill` is an absolutely
          positioned `height:100%` child; Safari does NOT treat an
          aspect-ratio-derived height as "definite" for such a child, so the
          image collapsed / failed to center (Chrome resolves it fine). A real
          height makes the fill resolve identically in both.
          clamp(min-h, 16:9 of the content width, 100vh-15rem) reproduces the
          previous look exactly: content width = 100vw minus the wrapper
          padding (px-2 → 1rem total, md:px-10 → 5rem total); 0.5625 = 9/16. */}
      <div className="relative w-full overflow-hidden h-[clamp(200px,calc((100vw-1rem)*0.5625),calc(100vh-15rem))] md:h-[clamp(272px,calc((100vw-5rem)*0.5625),calc(100vh-15rem))]">
        <FadeCarousel
          slides={slides}
          unoptimized={unoptimized}
          objectPosition={objectPosition}
          disableNav={disableNav}
        />
      </div>

      {/* Advantages */}
      <Advantages />
    </div>
  );
}
