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
      {/* Carousel */}
      <div className="relative w-full aspect-[16/9] max-h-[calc(100vh-15rem)] min-h-[200px] md:min-h-[17rem] overflow-hidden">
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
