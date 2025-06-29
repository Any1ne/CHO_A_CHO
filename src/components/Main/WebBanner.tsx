import FadeCarousel from "@/components/Main/FadeCarousel";
import Advantages from "@/components/Main/Advantages";

const slides = [
  { src: "/webbanner/4.jpg", href: "/" },
  { src: "/webbanner/1.jpg", href: "/branded" },
  { src: "/webbanner/2.jpg", href: "/" },
  { src: "/webbanner/3.jpg", href: "/" },
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
