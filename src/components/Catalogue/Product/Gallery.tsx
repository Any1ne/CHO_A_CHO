"use client";
import Image from "next/image";

type Props = {
  images?: string[];
  title: string;
};

export default function Gallery({ images, title }: Props) {
  return (
    <div className="w-full md:w-1/2 flex flex-col gap-2 border-1 p-4">
      {images && images.length > 0 ? (
        images.map((src, i) => (
          <Image
            key={i}
            src={src}
            alt={title}
            width={600}
            height={400}
            className="rounded object-cover w-full h-auto"
          />
        ))
      ) : (
        <div className="w-full h-[400px] bg-gray-200 rounded flex items-center justify-center text-gray-500 text-lg">
          Немає зображень
        </div>
      )}
    </div>
  );
}
