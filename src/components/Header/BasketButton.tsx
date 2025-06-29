import { ShoppingBasket } from "lucide-react";
import { Button } from "../ui/button";
import { useSelector } from "react-redux";
import { RootState } from "@/store"; 

type BasketProps = {
  onOpen: () => void;
};

export default function BasketButton({ onOpen }: BasketProps) {
  const itemsCount = useSelector((state: RootState) =>
    state.basket.items.reduce((total, item) => total + item.quantity, 0)
  );

  const displayCount = itemsCount > 999 ? "+999" : itemsCount;

  return (
    <div>
      <Button
        className="relative h-[2rem] bg-white text-black hover:bg-gray-300"
        onClick={onOpen}
      >
        <ShoppingBasket />

        {itemsCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] min-w-[20px] h-5 px-[5px] rounded-full flex items-center justify-center font-semibold">
            {displayCount}
          </span>
        )}

        <span className="hidden md:inline">Кошик</span>
      </Button>
    </div>
  );
}
