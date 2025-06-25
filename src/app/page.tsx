import WebBanner from "@/components/Main/WebBanner";
import Gateway from "@/components/Main/Pathway";
// import BirthdayModal from "@/components/Birthday/BirthdayModal";

export default function Home() {
  return (
    <>
    {/* <BirthdayModal/> */}
    <main className="mt-[6rem] md:mt-[8rem]">
      <WebBanner />
      <Gateway />
    </main>
    </>
  );
}
