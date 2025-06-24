import PathwayLeftSection from "@/components/Main/PathwayLeftSection";
import PathwayRightSection from "@/components/Main/PathwayRightSection";

export default function Pathway() {
  return (
    <div className="bg-white flex flex-col md:flex-row min-h-[90vh] px-0 md:px-10 lg:px-30 py-10 rounded-lg overflow-hidden shadow-md justify-center">
      <PathwayLeftSection />
      <PathwayRightSection />
    </div>
  );
}
