
import FadeCarousel from "@/components/Main/FadeCarousel";
import Advantages from "@/components/Main/Advantages";

export default function WebBanner() {
  return (
    <div className="flex flex-col px-2 md:px-10 py-5 gap-2">
      {/* Carousel */}
      <div className="relative group w-full h-auto min-h-[300px] max-h-[calc(100vh-10rem)] p-0.5">
        <FadeCarousel />
      </div>

      {/* Advantages */}
      <Advantages />
    </div>
  );
}
