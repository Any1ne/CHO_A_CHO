import BasketHeader from "./BasketHeader";
import BasketItemsList from "./BasketItemsList";
import BasketFooter from "./BasketFooter";
import { XIcon } from "lucide-react";
import { Button } from "../ui/button";

type Props = {
  onClose: () => void;
};

export default function BasketModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40">
      <aside className="fixed right-0 top-0 h-full w-100 bg-white shadow-lg z-50 p-4 flex flex-col">
        <Button
          variant="ghost"
          className="p-2 justify-end"
          onClick={onClose}
          aria-label="Close menu"
        >
          <XIcon />
        </Button>
        <BasketHeader />
        <BasketItemsList />
        <BasketFooter />
      </aside>
    </div>
  );
}
