import Image from "next/image";
import Link from "next/link";

export default function Logo() {
  return (
    <div className="md:relative md:right-0 md:left-0 items-center justify-center justify-self-center h-full">
      <Link href="/">
        <Image
          src="/logo.png"
          alt="cho a cho."
          width={130}
          height={80}
          className="h-auto w-auto max-h-[3rem] md:max-h-[5rem] object-contain cursor-pointer"
        />
      </Link>
    </div>
  );
}
