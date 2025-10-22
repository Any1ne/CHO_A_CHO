"use client";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/types";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import flavourIcons from "@/components/Catalogue/Product/flavourIcons";

export default function FlavourSelect() {
  const router = useRouter();
  const { product, flavours } = useSelector(
    (state: RootState) => state.productModal
  );
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (product) {
      setSelectedId(product.id);
    }
  }, [product]);

  const handleFlavourChange = (id: string) => {
    // Навігація на /store/{id} — ModalInitializer на новій сторінці ініціалізує Redux
    setSelectedId(id);
    router.push(`/store/${id}`);
  };

  if (!product) return <span>Завантаження товару...</span>;

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-primary-light p-3 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-500 uppercase mb-1">Категорія товару</p>
        <p className="text-lg font-semibold text-gray-800">
          {product.category}
        </p>
      </div>

      <div>
        <p className="text-sm text-gray-500 uppercase mb-1">Оберіть смак</p>
        <Select value={selectedId} onValueChange={handleFlavourChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Оберіть смак" />
          </SelectTrigger>
          <SelectContent>
            {flavours.map(({ id, flavour }) => (
              <SelectItem key={id} value={id}>
                <div className="flex items-center">
                  {flavourIcons[flavour] ?? (
                    <Star className="w-4 h-4 mr-2 text-gray-400" />
                  )}
                  {flavour}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
