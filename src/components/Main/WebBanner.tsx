import FadeCarousel from "@/components/Main/FadeCarousel";
import Advantages from "@/components/Main/Advantages";

const slides = [
  // {
  //   src: "https://9qy6ktzgsu2nlgvi.public.blob.vercel-storage.com/webbanner/0.webp",
  //   href: "/",
  // },
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

export default function WebBanner() {
  return (
    <div className="flex flex-col px-2 md:px-10 py-5 gap-2">
      {/* Carousel */}
      <div className="relative w-full aspect-[16/9] max-h-[calc(100vh-15rem)] min-h-[200px] md:min-h-[17rem] overflow-hidden">
        <FadeCarousel slides={slides} />
      </div>

      {/* Advantages */}
      <Advantages />
    </div>
  );
}
