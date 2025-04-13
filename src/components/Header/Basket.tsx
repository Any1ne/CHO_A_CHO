import { ShoppingBasket } from "lucide-react";
import { Button } from "../ui/button";

type BasketProps = {
  onOpen: () => void;
};

export default function Basket({ onOpen }: BasketProps) {
  return (
    <div>
      <Button onClick={onOpen}>
        <ShoppingBasket />
      </Button>
    </div>
  );
}
