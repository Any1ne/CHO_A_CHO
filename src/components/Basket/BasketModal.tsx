import BasketHeader from "./BasketHeader";
import BasketItemsList from "./BasketItemsList";
import BasketFooter from "./BasketFooter";

type Props = {
  onClose: () => void;
};

export default function BasketModal({ onClose }: Props) {
  return (
    <aside className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg z-50 p-4 flex flex-col">
      <button className="self-end text-sm mb-2" onClick={onClose}>
        ✕
      </button>
      <BasketHeader />
      <BasketItemsList />
      <BasketFooter />
    </aside>
  );
}
