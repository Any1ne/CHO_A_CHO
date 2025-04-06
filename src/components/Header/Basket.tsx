import { Button } from "../ui/button";

type BasketProps = {
  onOpen: () => void;
};

export default function Basket({ onOpen }: BasketProps) {
  return (
    <div className="box px-4 row-start-2 flex items-center justify-end">
      <Button onClick={onOpen}>Basket</Button>
    </div>
  );
}
