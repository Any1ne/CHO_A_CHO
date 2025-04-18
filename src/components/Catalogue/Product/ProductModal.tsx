"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import Gallery from "./Gallery";
import ProductDetails from "./ProductDetails";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  images?: string[];
  id: string;
  price: number;
};

export default function ProductModal({
  isOpen,
  onClose,
  title,
  description,
  images,
  id,
  price,
}: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[80vw] h-[80vh] max-w-none max-h-none p-6 overflow-auto">
        <div className="flex flex-col md:flex-row gap-2 h-full py-4">
          <Gallery images={images} title={title} />
          <ProductDetails
            title={title}
            description={description}
            price={price}
            id={id}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
